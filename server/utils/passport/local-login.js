import passport from 'passport';
import config from '../../configs/config';
import { MongoClient } from 'mongodb';
import { verifyHash } from '../crypto/hash';
import { getMongoURI } from '../mongoUtil';
import defaultUserConfig from '../../configs/defaultUserConfig';

export default (req, res, next, user) => {
  //validate submitted password
  if (!verifyHash(req.body.password, user.password)) {
    return res.redirect('/login?e=forbidden');
  }
  //passport local log-in serializer
  passport.serializeUser(function (user, done) {
    done(null, user.uid);
  });
  passport.deserializeUser(function (user, done) {
    done(null, user);
  });
  //If the user exists, serialize the user to the session
  req.login(user, function (err) {
    if (err) {
      return next(err);
    } else {
      const mongoURI = getMongoURI({ settings: config.database.mongo });
      MongoClient.connect(mongoURI, config.database.mongo.server, function (err, client) {
        if (err) {
          console.error(err.message);
          return res.redirect('/login?e=forbidden');
        }
        const mongodb = client.db();
        var uid = user.uid;
        mongodb.collection('configs').findOne(
          { owner: uid },
          function (err, configObj) {
            if (err) {
              console.error(err.message);
            }
            if (!configObj) {
              var defaultConfig = {
                owner: uid,
                config: defaultUserConfig,
                name: 'default',
                type: 'matrix',
                readers: [uid],
                created: (new Date()).toUTCString()
              };
              mongodb.collection('configs').insertOne(defaultConfig);
            }
            mongodb.collection('users').findOneAndUpdate(
              { uid: user.uid },
              {
                $set: {
                  last_logon: Date.now()
                }
              },
              {
                projection: {
                  _id: 0,
                  uid: 1,
                  display_name: 1,
                  acl: 1,
                  role: 1,
                  icon: 1,
                  mail: 1
                },
                returnOriginal: false,
                upsert: true
              },
              function (err, userinfo) {
                if (err) {
                  console.error(err.message);
                }
                client.close();
                req.session.role = userinfo.value.role;
                req.session.display_name = userinfo.value.display_name;
                req.session.mail = userinfo.value.mail;
                req.session.celery_tasks = [];
                req.session.icon = userinfo.value.icon;
                return res.redirect('/');
              });
          });
      });
    }
  });
};
