import { Router } from 'express';
import { MongoClient, ObjectID } from 'mongodb';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import multer from 'multer';
import colorbrewer from 'colorbrewer';
import { validate } from 'jsonschema';
import csv from 'csvtojson';
import { connect } from 'amqplib/callback_api';
import co from 'co';
import { createHash } from 'crypto';
import uuidV4 from 'uuid/v4';
import passport from 'passport';
import { hash } from '../utils/crypto/hash';
import { getMongoURI } from '../utils/mongoUtil';
import { getConfigForUser, getDashboardState } from '../utils/routerUtil';

import LDAP from '../utils/passport/ldap';
import LocalLogin from '../utils/passport/local-login';
import LocalSignup from '../utils/passport/local-signup';

import userPage from '../templates/Account.template';
import adminPage from '../templates/Admin.template';
import configPage from '../templates/Config.template';
import deepdivePage from '../templates/DeepDive.template';
import editConfig from '../templates/EditConfig.template';
import graphPage from '../templates/Graph.template';
import loginPage from '../templates/Login.template';
import mainPage from '../templates/Main.template';
import registerPage from '../templates/Register.template';
import resetPage from '../templates/Resetpw.template';
import studyPage from '../templates/Study.template';

import config from '../configs/config';
import defaultStudyConfig from '../configs/defaultStudyConfig';
import defaultUserConfig from '../configs/defaultUserConfig';

const router = Router();

const uploadPath = process.env.DPDASH_UPLOADS || '../uploads';
const upload = multer({ dest: uploadPath }).single('file');

const mongoURI = getMongoURI({ settings: config.database.mongo });

let mongoClient;
let mongoApp;
let mongoData;
MongoClient.connect(mongoURI, config.database.mongo.server, function (err, client) {
  if (err) {
    console.error(err.message);
    console.log('Could not connect to the database.');
    process.exit();
  }
  mongoClient = client;
  mongoApp = mongoClient.db();
  mongoData = mongoClient.db(config.database.mongo.dataDB);
});

function checkMongo() {
  if (!mongoClient.isConnected()) {
    MongoClient.connect(mongoURI, config.database.mongo.server, function (err, client) {
      if (err) {
        console.error(err.message);
        console.log('Could not connect to the database.');
        process.exit();
      }
      mongoClient = client;
      mongoApp = mongoClient.db();
      mongoData = mongoClient.db(config.database.mongo.dataDB);
    });
  }
}

var amqpAddress = 'amqp://' + config.rabbitmq.username + ':' + config.rabbitmq.password + '@' + config.rabbitmq.host + ':' + config.rabbitmq.port;
let rabbitmq_conn;
connect(amqpAddress, config.rabbitmq.opts, function (err, conn) {
  if (err) console.log(err);
  rabbitmq_conn = conn;
});

//User authentication middleware
function ensureAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/logout');
  }
  checkMongo();
  mongoApp.collection('users').findOne(
    { uid: req.user },
    { _id: 0, access: 1, blocked: 1, role: 1 },
    function (err, data) {
      if (err) {
        console.log(err);
        return res.redirect('/logout?e=forbidden');
      } else if (!data || Object.keys(data).length === 0) {
        return res.redirect('/logout?e=forbidden');
      } else if (('role' in data) && data['role'] === 'admin') {
        return next();
      } else if (('blocked' in data) && data['blocked'] == true) {
        return res.redirect('/logout?e=forbidden');
      } else if (!('access' in data) || data.access.length == 0) {
        return res.redirect('/logout?e=unauthorized');
      } else {
        return next();
      }
    });
}
//Admin privilege checking middleware
function ensureAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/logout');
  }
  checkMongo();
  mongoApp.collection('users').findOne(
    { uid: req.user, role: 'admin' },
    { _id: 0, uid: 1 }
    , function (err, data) {
      if (err) {
        console.log(err);
        return res.redirect('/?e=forbidden');
      } else if (!data || Object.keys(data).length === 0) {
        return res.redirect('/?e=forbidden');
      } else {
        return next();
      }
    });
}

//Check if the information requested is for the user
function ensureUser(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/logout?e=forbidden');
  } else if (req.params.uid !== req.user) {
    return res.redirect('/?e=forbidden');
  } else {
    return next();
  }
}
//Check user privilege for the study
function ensurePermission(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/logout');
  }
  checkMongo();
  mongoApp.collection('users').findOne(
    { uid: req.user },
    { _id: 0, access: 1, blocked: 1, role: 1 },
    function (err, data) {
      if (err) {
        console.log(err);
        return res.redirect('/?e=forbidden');
      } else if (!data || Object.keys(data).length === 0) {
        return res.redirect('/?e=forbidden');
      } else if (('role' in data) && data['role'] === 'admin') {
        return next();
      } else if (('blocked' in data) && data['blocked'] == true) {
        return res.redirect('/logout?e=forbidden');
      } else if (!('access' in data) || data.access.length == 0) {
        return res.redirect('/logout?e=unauthorized');
      } else if (data.access.indexOf(req.params.study) < 0) {
        return res.redirect('/?e=forbidden');
      } else {
        return next();
      }
    });
}
//Home
router.get('/', ensureAuthenticated, function (req, res) {
  return res.send(mainPage(req.user, req.session.display_name, req.session.role, req.session.icon));
});

//User Home
router.route('/u')
  .get(ensureAuthenticated, function (req, res) {
    return res.status(200).send(userPage(req.user, req.session.display_name, req.session.icon, req.session.mail, req.session.role));
  });

//User Configuration
router.route('/u/configure')
  .get(ensureAuthenticated, function (req, res) {
    if (req.query.s && req.query.id) {
      return res.status(200).send(editConfig(req.user, req.query.s, req.query.id));
    } else if (req.query.s) {
      return res.status(200).send(editConfig(req.user, req.query.s, null));
    } else if (req.query.u) {
      let message = req.query.u;
      if (req.query.u == 'invalid') {
        message = 'Invalid configuration format.';
      } else if (req.query.u == 'error') {
        message = 'Error occurred while uploading the configuration.';
      } else if (req.query.u == 'success') {
        message = 'Configuratoin upload successful!';
      }
      return res.status(200).send(configPage(req.user, req.session.display_name, req.session.icon, req.session.mail, req.session.role, message));
    } else {
      return res.status(200).send(configPage(req.user, req.session.display_name, req.session.icon, req.session.mail, req.session.role, ''));
    }
  });

//Admin Home
router.route('/admin')
  .get(ensureAdmin, function (req, res) {
    return res.status(200).send(adminPage(req.user, req.session.display_name, req.session.role, req.session.icon));
  });

//Login
router.route('/login')
  .get(function (req, res) {
    let message = '';
    if (req.query.e) {
      if (req.query.e === 'forbidden') {
        message = 'Not authorized. Please contact the admin';
      } else if (req.query.e === 'unauthorized') {
        message = 'Please contact the admin to get access to your projects';
      } else if (req.query.e === 'NA') {
        message = 'This application uses LDAP authentication. Please contact the admin.';
      } else if (req.query.e === 'resetpw') {
        message = 'Your password has been changed. Please log in';
      } else {
        message = req.query.e;
      }
    }
    return res.send(loginPage(message));
  })
  .post(function (req, res, next) {
    passport.authenticate('local-login', { session: true }, function (err, user) {
      if (err) {
        console.error(err);
        return res.redirect('/login?e=' + err);
      }
      if (!user) {
        if (config.auth.useLDAP) {
          return LDAP(req, res, next);
        } else {
          return res.redirect('/login');
        }
      }
      if (user.ldap) {
        if (config.auth.useLDAP) {
          return LDAP(req, res, next);
        } else {
          return res.redirect('/login');
        }
      } else {
        return LocalLogin(req, res, next, user);
      }
    })(req, res, next);
  });

//register
router.route('/signup')
  .get(function (req, res) {
    if (config.auth.useLDAP) {
      return res.redirect('/login?e=NA');
    } else if (req.query.e === 'existingUser') {
      return res.send(registerPage('The username already exists. Please choose another.'));
    } else {
      return res.send(registerPage(''));
    }
  })
  .post(function (req, res, next) {
    if (config.auth.useLDAP) {
      return res.redirect('/login');
    } else {
      return LocalSignup(req, res, next);
    }
  });

//Logout page
router.get('/logout', function (req, res) {
  req.session.destroy();
  req.logout();
  if (req.query.e) {
    return res.redirect('/login?e=' + req.query.e);
  } else {
    return res.redirect('/login');
  }
});

//deepdive page
router.get('/api/v1/studies/:study/subjects/:subject/deepdive/:day', ensurePermission, function (req, res) {
  checkMongo();
  mongoData.collection('toc').find(
    {
      study: req.params.study,
      subject: req.params.subject,
      assessment: {
        $regex: /^Deepdive/
      }
    }
  ).toArray(function (err, docs) {
    if (err) {
      console.log(err);
      return res.status(502).send([]);
    } else if (docs.length == 0) {
      return res.status(404).send([]);
    } else {
      co(function* () {
        var dataPiece = [];
        for (var doc = 0; doc < docs.length; doc++) {
          var data = yield mongoData.collection(docs[doc].collection).find({
            day: parseInt(req.params.day)
          }).toArray();
          Array.prototype.push.apply(dataPiece, data);
        }
        return res.status(201).send(dataPiece);
      });
    }
  });
});

router.get('/deepdive/:study/:subject/:day', ensurePermission, function (req, res) {
  return res.send(deepdivePage(req.params.study, req.params.subject, req.params.day));
});

//Dashboard page
router.get('/dashboard/:study/:subject', ensurePermission, async function (req, res) {
  try {
    checkMongo();
    const defaultConfig = await getConfigForUser({
      db: mongoApp,
      user: req.user,
      defaultConfig: defaultUserConfig,
    });
    const dashboardState = await getDashboardState({
      db: mongoData,
      study: req.params.study,
      subject: req.params.subject,
      defaultConfig,
    }); 
    return res.send(graphPage(req.params.subject, req.params.study, req.user, req.session.display_name, req.session.icon, req.session.mail, req.session.toc, dashboardState, defaultConfig, req.session.celery_tasks, req.session.role));
  } catch (err) {
    console.error(err.message);
    return res.status(500).send({ message: err.message });
  }
});

router.route('/resetpw')
  .get(function (req, res) {
    if (config.auth.useLDAP) {
      return res.redirect('/login?e=NA');
    } else {
      let message = '';
      if (req.query.e) {
      if (req.query.e === 'unmatched') {
          message = 'The passwords do not match. Please try again.';
      } else if (req.query.e === 'db') {
          message = 'There was an error. Please contact the admin.';
      } else if (req.query.e === 'nouser') {
          message = 'The username or reset key did not match. Please try again.';
      } else {
          message = req.query.e;
      }
      }
      return res.send(resetPage(message));
    }
  })
  .post(function (req, res) {
    if (req.body.password !== req.body.confirmpw) {
      return res.redirect('/resetpw?e=unmatched');
    } else {
      var hashedPW = hash(req.body.password);
      checkMongo();
      mongoApp.collection('users').findOneAndUpdate(
        { uid: req.body.username, reset_key: req.body.reset_key },
        { $set: { password: hashedPW, reset_key: '', force_reset_pw: false } },
        { returnOriginal: false },
        function (err, doc) {
          if (err) {
            console.log(err);
            return res.redirect('/resetpw?e=db');
          } else if (!doc || doc['value'] === null) {
            return res.redirect('/resetpw?e=nouser');
          } else {
            return res.redirect('/login?e=resetpw');
          }
        });
    }
  });

router.route('/resync/:study/:subject')
  .post(ensureAuthenticated, function (req, res) {
    var rootdir = config.app.rootDir;
    var syncdir = rootdir + '/' + req.params.study + '/' + req.params.subject + '/';
    if (rabbitmq_conn) {
    rabbitmq_conn.createChannel(function (err, ch) {
      if (err) {
        console.log(err);
        try {
            connect(amqpAddress, config.rabbitmq.opts, function (err, conn) {
            rabbitmq_conn = conn;
          });
        } catch (err) {
          console.log(err);
          process.exit(1);
        }
      }
      ch.assertQueue(config.rabbitmq.consumerQueue, { durable: false }, function (err, q) {
        var correlationId = uuidV4();
        publisher(rabbitmq_conn, ch, correlationId, [syncdir, rootdir, '', '', config.database.mongo.username, config.database.mongo.password, config.database.mongo.host, config.database.mongo.port, config.database.mongo.authSource, config.database.mongo.dataDB], q.queue);
        return res.status(201).send({ correlationId: correlationId });
      });
    });
    }
  });

function publisher(conn, ch, correlationId, args, replyTo) {
  var message = {};
  message.id = correlationId;
  message.task = 'import';
  message.args = args;
  message.kwargs = {};
  message.retries = 1;

  ch.sendToQueue(config.rabbitmq.publisherQueue,
    new Buffer(JSON.stringify(message)),
    { correlationId: correlationId, contentType: 'application/json', replyTo: replyTo });

  setTimeout(function () {
    ch.close();
  }, 500);
}

router.get('/dashboard/:study', ensurePermission, function (req, res) {
  co(function* () {
    checkMongo();
    var configs_heatmap = defaultStudyConfig['colormap'];
    var metadocReference = yield mongoData.collection('metadata').findOne({
      study: req.params.study,
      role: 'metadata'
    });
    if (!metadocReference) {
      return res.status(500).send("Please contact the administrator.");
    }
    var metadoc = yield mongoData.collection(metadocReference['collection']).find({}).toArray();
    var dashboardData = [];
    for (const item in metadoc) {
      var dashboardState = {
        "matrixData": [],
        "project": metadoc[item]['Study'],
        "subject": metadoc[item]['Subject ID'],
        "consentDate": metadoc[item]['Consent'] || metadoc[item]['Consent Date']
      };

      for (var configItem in configs_heatmap) {
        var assessment = configs_heatmap[configItem].analysis;
        var collectionName = metadoc[item]['Study'] + metadoc[item]['Subject ID'] + assessment;
        var encrypted = createHash('sha256').update(collectionName).digest('hex');

        var varName = configs_heatmap[configItem].variable;
        var escapedVarName = encodeURIComponent(varName).replace(/\./g, '%2E');
        const query = [{
                            $project: { _id: 0, day: 1, [escapedVarName]: `$${varName}` }
                          }];
        var data = yield mongoData.collection(encrypted.toString()).aggregate(query).toArray();
        var dataPiece = {};
        dataPiece.text = configs_heatmap[configItem].text;
        dataPiece.analysis = configs_heatmap[configItem].analysis;
        dataPiece.category = configs_heatmap[configItem].category;
        dataPiece.variable = configs_heatmap[configItem].variable;
        dataPiece.label = configs_heatmap[configItem].label;
        dataPiece.range = configs_heatmap[configItem].range;
        dataPiece.color = configs_heatmap[configItem].color;
        dataPiece.data = (
          data.length >= 1 &&
          Object.prototype.hasOwnProperty.call(data[0], configs_heatmap[configItem].variable)
        ) ? data : [];
        dataPiece.stat = [];
        dashboardState.matrixData.push(dataPiece);
      }
      dashboardData.push(dashboardState);
    }
    return res.send(studyPage(req.params.study, req.user, req.session.display_name,
      req.session.icon, req.session.role, req.session.toc, req.session.celery_tasks, dashboardData, defaultStudyConfig));
  });
});

router.route('/api/v1/studies')
  .get(function (req, res) {
    checkMongo();
    mongoApp.collection('users').findOne(
      { uid: req.user },
      { _id: 0, access: 1 }
      , function (err, data) {
        if (err) {
          console.log(err);
          return res.status(502).send([]);
        } else if (!data || Object.keys(data).length == 0) {
          return res.status(404).send([]);
        } else if (!('access' in data) || data.access.length == 0) {
          return res.status(404).send([]);
        } else {
          return res.status(200).send(data.access.sort());
        }
      });
  });

router.get('/api/v1/search/studies', ensureAuthenticated, function (req, res) {
  checkMongo();
  mongoData.collection('toc').distinct('study'
    , function (err, studies) {
      if (err) {
        console.log(err);
        return res.status(502).send([]);
      } else if (!studies || studies.length == 0) {
        return res.status(404).send([]);
      } else {
        return res.status(200).send(studies);
      }
    });
});

router.get('/api/v1/subjects', function (req, res) {
  checkMongo();
  mongoData.collection('metadata').aggregate([
    { $match: { study: { $in: JSON.parse(req.query.q) } } },
    { $addFields: { numOfSubjects: { $size: { "$ifNull": ["$subjects", []] } } } },
    { $sort: { study: 1 } }
  ]).toArray(function (err, subjects) {
    if (err) {
      console.log(err);
      return res.status(502).send([]);
    } else if (!subjects) {
      return res.status(502).send([]);
    } else {
      return res.status(200).send(subjects);
    }
  });
});

router.get('/api/v1/users', ensureAdmin, function (req, res) {
  checkMongo();
  mongoApp.collection('users').find(
    {}, { _id: 0, configs: 0, member_of: 0, password: 0, last_logoff: 0 }).toArray(function (err, users) {
      if (err) {
        console.log(err);
        return res.status(502).send([]);
      } else if (users.length == 0) {
        return res.status(404).send([]);
      } else {
        return res.status(200).send(users);
      }
    });
});
router.get('/api/v1/search/users', ensureAuthenticated, function (req, res) {
  checkMongo();
  mongoApp.collection('users').find(
    {}, { uid: 1 }).toArray(function (err, users) {
      if (err) {
        console.log(err);
        return res.status(502).send([]);
      } else if (!users || users.length == 0) {
        return res.status(404).send([]);
      } else {
        return res.status(200).send(users.map(function (u) { return u.uid; }));
      }
    });
});

router.route('/api/v1/users/:uid')
  .get(ensureUser, function (req, res) {
    checkMongo();
    mongoApp.collection('users').findOne(
      { uid: req.params.uid },
      {
        configs: 0,
        member_of: 0,
        bad_pwd_count: 0,
        lockout_time: 0,
        last_logoff: 0,
        last_logon: 0,
        account_expires: 0,
        force_reset_pw: 0,
        realms: 0,
        role: 0,
        preferences: 0
      }
      , function (err, user) {
        if (err) {
          console.log(err);
          return res.status(502).send({});
        } else if (!user || Object.keys(user).length === 0) {
          return res.status(404).send({});
        } else {
          return res.status(200).send(user);
        }
      });
  })
  .post(ensureUser, function (req, res) {
    checkMongo();
    mongoApp.collection('users').findOneAndUpdate(
      { uid: req.params.uid },
      {
        $set: {
          display_name: req.body.user.display_name,
          title: req.body.user.title,
          department: req.body.user.department,
          company: req.body.user.company,
          mail: req.body.user.mail,
          icon: req.body.user.icon
        }
      }
      , function (err, user) {
        if (err) {
          console.log(err);
          return res.sendStatus(502);
        } else if (!user) {
          return res.sendStatus(404);
        } else {
          req.session.display_name = req.body.user.display_name;
          req.session.title = req.body.user.title;
          req.session.department = req.body.user.department;
          req.session.company = req.body.user.company;
          req.session.mail = req.body.user.mail;
          req.session.icon = req.body.user.icon;
          return res.sendStatus(201);
        }
      });
  });

router.route('/api/v1/users/:uid/configs')
  .get(ensureUser, function (req, res) {
    checkMongo();
    mongoApp.collection('configs').find(
      { readers: req.params.uid }
    ).toArray(function (err, data) {
      if (err) {
        console.log(err);
        return res.status(502).send([]);
      } else if (data.length == 0) {
        return res.status(404).send([]);
      } else {
        return res.status(200).send(data);
      }
    });
  })
  .post(ensureUser, function (req, res) {
    if (Object.prototype.hasOwnProperty.call(req.body, 'disable')) {
      checkMongo();
      mongoApp.collection('configs').findOneAndUpdate(
        { _id: new ObjectID(req.body.disable) },
        { $pull: { readers: req.params.uid } },
        { returnOriginal: false },
        function (err) {
          if (err) {
            console.log(err);
            return res.status(502).send({ message: 'fail' });
          } else {
            return res.status(201).send({ message: 'success' });
          }
        });
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'remove')) {
      checkMongo();
      mongoApp.collection('configs').deleteOne(
        { _id: new ObjectID(req.body.remove) },
        function (err) {
          if (err) {
            console.log(err);
            return res.status(502).send({ message: 'fail' });
          } else {
            return res.status(201).send({ message: 'success' });
          }
        });
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'share')) {
      checkMongo();
      mongoApp.collection('configs').findOneAndUpdate(
        { _id: new ObjectID(req.body.share) },
        { $set: { readers: req.body.shared } },
        { returnOriginal: false },
        function (err) {
          if (err) {
            console.log(err);
            return res.status(502).send({ message: 'fail' });
          } else {
            return res.status(201).send({ message: 'success' });
          }
        });
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'edit')) {
      checkMongo();
      mongoApp.collection('configs').findOneAndUpdate(
        { _id: new ObjectID(req.body.edit._id) },
        {
          $set: {
            readers: req.body.edit.readers,
            config: req.body.edit.config,
            name: req.body.edit.name,
            type: req.body.edit.type
          }
        },
        { returnOriginal: false },
        function (err) {
          if (err) {
            console.log(err);
            return res.status(502).send({ message: 'fail' });
          } else {
            return res.status(201).send({ message: 'success' });
          }
        });
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'add')) {
      checkMongo();
      mongoApp.collection('configs').insertOne(req.body.add
        , function (err, doc) {
          if (err) {
            console.log(err);
            return res.status(502).send({ message: 'fail' });
          } else {
            if ('insertedId' in doc) {
              var _id = doc['insertedId'];
              var uri = '/u/configure?s=edit&id=' + _id;
              return res.status(201).send({ uri: uri });
            } else {
              return res.status(502).send({ message: 'fail' });
            }
          }
        });
    } else {
      return res.status(502).send({ message: 'fail' });
    }

  });

router.route('/api/v1/users/:uid/resetpw')
  .post(ensureAdmin, function (req, res) {
    if (Object.prototype.hasOwnProperty.call(req.body, 'force_reset_pw') && Object.prototype.hasOwnProperty.call(req.body, 'reset_key')) {
      checkMongo();
      mongoApp.collection('users').findOneAndUpdate(
        { uid: req.params.uid },
        { $set: { force_reset_pw: req.body.force_reset_pw, reset_key: req.body.reset_key } },
        { returnOriginal: false },
        function (err) {
          if (err) {
            console.log(err);
            return res.status(502).send({ message: 'fail' });
          } else {
            return res.status(201).send({ message: 'success' });
          }
        });
    } else {
      return res.status(502).send({ message: 'fail' });
    }
  });

router.route('/api/v1/users/:uid/delete')
  .post(ensureAdmin, function (req, res) {
    checkMongo();
    mongoApp.collection('users').deleteOne(
      { uid: req.params.uid },
      function (err) {
        if (err) {
          console.log(err);
          return res.status(502).send({ message: 'fail' });
        } else {
          return res.status(201).send({ message: 'success' });
        }
      });
  });

router.route('/api/v1/users/:uid/role')
  .get(ensureAdmin, function (req, res) {
    checkMongo();
    mongoApp.collection('users').findOne(
      { uid: req.params.uid },
      { _id: 0, role: 1 }
      , function (err, data) {
        if (err) {
          console.log(err);
          return res.status(502).send(null);
        } else if (!data || Object.keys(data).length === 0) {
          return res.status(404).send(null);
        } else {
          return res.status(200).send(data['uid']);
        }
      });
  })
  .post(ensureAdmin, function (req, res) {
    if (Object.prototype.hasOwnProperty.call(req.body, 'role')) {
      checkMongo();
      mongoApp.collection('users').findOneAndUpdate(
        { uid: req.params.uid },
        { $set: { role: req.body.role } },
        { returnOriginal: false },
        function (err) {
          if (err) {
            console.log(err);
            return res.status(502).send({ message: 'fail' });
          } else {
            return res.status(201).send({ message: 'success' });
          }
        });
    } else {
      return res.status(502).send({ message: 'fail' });
    }
  });

router.route('/api/v1/users/:uid/blocked')
  .get(ensureAdmin, function (req, res) {
    checkMongo();
    mongoApp.collection('users').findOne(
      { uid: req.params.uid },
      { _id: 0, blocked: 1 }
      , function (err, data) {
        if (err) {
          console.log(err);
          return res.status(502).send(null);
        } else if (!data || Object.keys(data).length === 0) {
          return res.status(404).send(null);
        } else {
          return res.status(200).send(data['blocked']);
        }
      });
  })
  .post(ensureAdmin, function (req, res) {
    if (Object.prototype.hasOwnProperty.call(req.body, 'blocked')) {
      checkMongo();
      mongoApp.collection('users').findOneAndUpdate(
        { uid: req.params.uid },
        { $set: { blocked: req.body.blocked } },
        { returnOriginal: false },
        function (err) {
          if (err) {
            console.log(err);
            return res.status(502).send({ message: 'fail' });
          } else {
            return res.status(201).send({ message: 'success' });
          }
        });
    } else {
      return res.status(502).send({ message: 'fail' });
    }
  });

router.route('/api/v1/users/:uid/studies')
  .get(ensureAdmin, function (req, res) {
    checkMongo();
    mongoApp.collection('users').findOne(
      { uid: req.params.uid },
      { _id: 0, access: 1 },
      function (err) {
        if (err) {
          console.log(err);
          return res.status(502).send({ message: 'fail' });
        } else {
          return res.status(201).send({ message: 'success' });
        }
      });
  })
  .post(ensureAdmin, function (req, res) {
    if (Object.prototype.hasOwnProperty.call(req.body, 'acl')) {
      checkMongo();
      mongoApp.collection('users').findOneAndUpdate(
        { uid: req.params.uid },
        { $set: { access: req.body.acl } },
        { returnOriginal: false },
        function (err) {
          if (err) {
            console.log(err);
            return res.status(502).send({ message: 'fail' });
          } else {
            return res.status(201).send({ message: 'success' });
          }
        });
    } else {
      return res.status(502).send({ message: 'fail' });
    }
  });

router.route('/api/v1/users/:uid/configs/:config_id')
  .get(ensureUser, function (req, res) {
    checkMongo();
    mongoApp.collection('configs').findOne(
      { readers: req.params.uid, _id: new ObjectID(req.params.config_id) }
      , function (err, data) {
        if (err) {
          console.log(err);
          return res.status(502).send({});
        } else if (!data || Object.keys(data).length === 0) {
          return res.status(404).send({});
        } else {
          return res.status(200).send(data);
        }
      });
  });


router.route('/api/v1/users/:uid/preferences')
  .get(ensureUser, function (req, res) {
    checkMongo();
    mongoApp.collection('users').findOne(
      { uid: req.params.uid },
      { _id: 0, preferences: 1 }
      , function (err, data) {
        if (err) {
          console.log(err);
          return res.status(502).send({});
        } else if (!data || Object.keys(data).length === 0) {
          return res.status(404).send({});
        } else {
          return res.status(200).send(data['preferences']);
        }
      });
  })
  .post(ensureUser, function (req, res) {
    if (Object.prototype.hasOwnProperty.call(req.body, 'preferences')) {
      checkMongo();
      mongoApp.collection('users').findOneAndUpdate(
        { uid: req.params.uid },
        { $set: { preferences: req.body.preferences } },
        { returnOriginal: false },
        function (err, doc) {
          if (err) {
            console.log(err);
            return res.status(502).send({ message: 'fail' });
          } else if (!doc) {
            return res.status(404).send({ message: 'fail' });
          } else {
            return res.status(201).send({ message: 'success' });
          }
        });
    } else {
      console.log('No property known as configurations.');
      return res.status(502).send({ message: 'fail' });
    }
  });

router.route('/api/v1/users/:uid/config/file')
  .post(ensureUser, function (req, res) {
    upload(req, res, function (err) {
      if (err) {
        console.log(err);
        return res.redirect('/u/configure?u=error');
      }
      if (req.file) {
        try {
          var mimetype = req.file.mimetype;
          if (mimetype != 'text/csv') {
            return res.redirect('/u/configure?u=error');
          }
          var file_path = resolve(req.file.path);
          var schema = JSON.parse(readFileSync('config.schema', 'utf8'));
          csv().fromFile(file_path).then((data) => {
            /* cast range to numbers and add colorbar */
            data.forEach(function (d) {
              if (d.range) {
                d.range = d.range.split(';').map(Number);
              }
              if (!d.colorbar || !d.colorbar.trim()) {
                d.colorbar = 'RdYlBu';
              }
            });

            /* validate configuration file (JSON Schema) */
            var validation = validate(data, schema);
            if (validation.errors.length > 0) {
              return res.redirect('/u/configure?u=invalid');
            }

            /* add colorbrewer colors to each config item */
            data.forEach(function (d) {
              var colorbar = d.colorbar ? d.colorbar : 'RdYlBu';
              if (colorbar == 'RdYlBu') {
                d.color = ["#4575b4", "#74add1", "#abd9e9", "#e0f3f8",
                  "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027"];
              } else {
                d.color = colorbrewer[colorbar][9];
              }
            });

            var newConfig = {
              owner: req.user,
              config: data,
              name: req.body.path,
              type: 'matrix',
              readers: [req.user],
              created: (new Date()).toUTCString()
            };
            checkMongo();
            mongoApp.collection('configs').insertOne(newConfig);
            return res.redirect('/u/configure?u=success');
          });
        } catch (err) {
          console.log('Error occurred while uploading a configuration file.');
          console.log(err);
          return res.redirect('/u/configure?u=error');
        }
      } else {
        return res.redirect('/u/configure?u=error');
      }
    });
  });
export default router;
