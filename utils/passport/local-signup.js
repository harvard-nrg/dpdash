var passport = require('passport');
var configPath = process.env.DPDASH_CONFIG || '../../config';
var config = require(configPath);
var defaultUserConfigPath = process.env.DPDASH_DASHBOARD_CONFIG_DEFAULT || '../../defaultUserConfig';
var defaultUserConfig = require(defaultUserConfigPath);
var MongoDB = require('mongodb');
var MongoClient = MongoDB.MongoClient;

module.exports = (req, res, next) => {
    passport.authenticate('local-signup', {session: true}, function(err, user, reqBody) {
        if(err) {
            return res.redirect('/login?e=' + err);
        }
        if(user) {
            return res.redirect('/signup?e=existingUser');
        }
	    var password = reqBody.password;
        var username = reqBody.username;
        var email = reqBody.email;
        var display_name = reqBody.display_name;

        var mongoURI = 'mongodb://' + config.database.mongo.username + ':';
        mongoURI = mongoURI + config.database.mongo.password + '@'  + config.database.mongo.host;
        mongoURI = mongoURI + ':' + config.database.mongo.port + '/' + config.database.mongo.authSource;
        MongoClient.connect(mongoURI, config.database.mongo.server, function(err, client) {
            if (err) {
                console.error(err.message);
                return res.redirect('/login?e=forbidden');
            }
            const mongodb = client.db(config.database.mongo.appDB);
            var hashedPW = require('../crypto/hash')(password, 'aes-256-ctr', 'encrypt', config.app.secret);
			mongodb.collection('users').findOneAndUpdate(
			    {uid: username},
				{
				    $set: {
                        display_name: display_name,
                        title: '',
                        department: '',
                        company: '',
                        mail: email,
                        member_of: '',
                        bad_pwd_count: 0,
                        lockout_time: 0,
                        last_logoff: Date.now(),
                        last_logon: Date.now(),
                        account_expires: null,
                        password: hashedPW,
                        ldap: false,
                        force_reset_pw: false,
                        realms: config.app.realms,
                        icon: '',
                        access:[],
                        blocked: false,
                        role: "member"
					}
				},
				{
                    projection : {
                        _id : 0,
                        uid : 1,
                        display_name : 1,
                        acl : 1,
                        role: 1,
                        icon: 1,
                        mail: 1
                    },
				    returnOriginal: false,
				    upsert: true						
				},
                function(err, userinfo) {
                    if(err) {
                        console.error(err.message);
                    }

                    var defaultConfig = {
                        owner: username,
                        config: defaultUserConfig,
                        name: 'default',
                        type: 'matrix',
                        readers : [username],
                        created: (new Date()).toUTCString()
                    };
                    mongodb.collection('configs').insertOne(defaultConfig);
                    client.close();

                    req.session.role = userinfo.value.role;
                    req.session.uid = userinfo.value.uid;
                    req.session.display_name = userinfo.value.display_name;
                    req.session.mail = userinfo.value.mail;
                    req.session.celery_tasks = [];
                    req.session.icon = userinfo.value.icon;
                    return res.redirect('/');
            });
        });
    })(req, res, next);
};
