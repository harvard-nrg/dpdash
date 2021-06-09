#!/usr/b n/env python

import argparse as ap
import os
import logging

logger = logging.getLogger(os.path.basename(__file__))
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def main():
    parser = ap.ArgumentParser('DPdash Configuration')

    parser.add_argument('--data-dir', help='Path to the root directory for GENERAL and PROTECTED folders')
    parser.add_argument('--config-dir', help='Path to the directory for all configuration files')
    parser.add_argument('--mongo-pw', help='MongoDB password for username dpdash')
    parser.add_argument('--rabbit-username', help='RabbitMQ username')
    parser.add_argument('--rabbit-pw', help='RabbitMQ password')
    parser.add_argument('--ssl-ca', help='Path to the ssl CA in PEM')
    parser.add_argument('--ssl-client-cert', help='Path to the client ssl certificate')
    parser.add_argument('--ssl-client-key', help='Path to the client ssl key')
    parser.add_argument('--ssl-server-cert', help='Path to the server ssl certificate')
    parser.add_argument('--ssl-server-key', help='Path to the server ssl key')
    parser.add_argument('--mongo-server-cert', help='Path to the MongoDB certificate')
    parser.add_argument('--mongo-path', help='Path to the MongoDB bind path')
    parser.add_argument('--celery-path', help='Path to the Celery bind path')
    parser.add_argument('--dpdash-path', help='Path to the DPdash bind path')

    parser.add_argument('--mongo-host', help='MongoDB host address')
    parser.add_argument('--mongo-port', help='MongoDB port number', type=int, default=27017)
    parser.add_argument('--rabbit-host', help='Rabbitmq host address')
    parser.add_argument('--rabbit-name', help='Rabbitmq node name', default='rabbit')
    parser.add_argument('--rabbit-port', help='Rabbitmq port number', type=int, default=5671)
    parser.add_argument('--rabbit-dist', help='Rabbitmq distribution port number', type=int, default=25671)
    parser.add_argument('--dpdash-port', help='DPdash port number', type=int, default=8000)
    parser.add_argument('--supervisor-id', help='ID name for supervisord process', default='supervisor')

    parser.add_argument('--dpdash-secret', help='DPdash session secret')
    parser.add_argument('--app-secret', help='App secret')

    args = parser.parse_args()

    configure_rabbit(args.rabbit_port, args.rabbit_name, args.rabbit_dist, args.ssl_ca, args.ssl_server_cert, args.ssl_server_key, args.config_dir, args.dpdash_path)
    configure_mongo(args.mongo_port, args.mongo_path, args.ssl_ca, args.mongo_server_cert, args.config_dir, args.mongo_host)
    configure_dppy(args.rabbit_port, args.celery_path, args.ssl_client_key, args.ssl_client_cert, args.ssl_ca, args.config_dir, args.rabbit_pw, args.rabbit_host)
    configure_supervisord(args.supervisor_id, args.config_dir)
    configure_dpdash(args.ssl_ca, args.ssl_client_key, args.ssl_client_cert, args.dpdash_port, args.mongo_port, args.rabbit_port, args.mongo_pw, args.rabbit_pw, args.dpdash_secret, args.config_dir, args.data_dir, args.dpdash_path, args.rabbit_host, args.mongo_host, args.app_secret)

def export_file(file_path, content):
    try:
        with open(file_path, 'w') as writeable:
            logger.info('Writing {FILE}'.format(FILE=file_path))
            writeable.write(content)
    except Exception as e:
        logger.error(e)

    return

def configure_rabbit(rabbit_port, rabbit_name, rabbit_dist, ca_path, cert_path, key_path, config_path, dpdash_path):
    rabbit_path = os.path.join(dpdash_path, 'rabbitmq')
    rabbit_conf_path = os.path.join(config_path,'rabbitmq.conf')
    rabbit_env_path = os.path.join(config_path,'rabbitmq-env.conf')

    # Generate and export rabbitmq-env.conf
    env = '''NODENAME=%(rabbit_name)s
NODE_PORT=%(rabbit_port)s
DIST_PORT=%(rabbit_dist)s
CTL_DIST_PORT_MIN=%(rabbit_dist_min)s
CTL_DIST_PORT_MAX=%(rabbit_dist_max)s
MNESIA_BASE=%(rabbit_path)s
LOG_BASE=%(rabbit_path)s
''' % { 
        'rabbit_name' : rabbit_name,
        'rabbit_port' : rabbit_port,
        'rabbit_dist': rabbit_dist,
        'rabbit_dist_min': rabbit_dist+10000,
        'rabbit_dist_max': rabbit_dist+10010,
        'rabbit_path': rabbit_path
    }

    export_file(rabbit_env_path, env)

    # Generate and export rabbitmq.conf
    configuration = '''ssl_options.versions.1           = tlsv1.2
ssl_options.versions.2           = tlsv1.1
ssl_options.cacertfile           = %(ca_path)s
ssl_options.certfile             = %(cert_path)s
ssl_options.keyfile              = %(key_path)s
ssl_options.verify               = verify_peer
ssl_options.fail_if_no_peer_cert = true
listeners.ssl.default            = %(rabbit_port)s
'''    % { 
        'rabbit_port' : rabbit_port,
        'ca_path' : ca_path,
        'cert_path' : cert_path,
        'key_path' : key_path
    }

    return export_file(rabbit_conf_path, configuration)

def configure_mongo(mongo_port, mongo_path, ca_path, mongocert_path, config_path, mongo_host):
    configuration = '''
security:
  authorization: enabled
processManagement:
  fork: false
storage:
  dbPath: %(mongo_path)s/dbs/
net:
  port: %(mongo_port)s
  bindIp: localhost,/tmp/mongodb-%(mongo_port)s.sock,%(mongo_host)s
  tls:
    mode: requireTLS
    certificateKeyFile: %(mongocert_path)s
    CAFile: %(ca_path)s
systemLog:
   destination: file
   path: "%(mongo_path)s/logs/mongodb.log"
   logAppend: true
''' % { 
        'mongo_port' : mongo_port,
        'mongo_path' : mongo_path,
        'mongocert_path' : mongocert_path,
        'ca_path' : ca_path,
        'mongo_host': mongo_host,
    }

    return export_file(os.path.join(config_path, 'mongodb.conf'), configuration)

def configure_dppy(rabbit_port, celery_path, key_path, cert_path, ca_path, config_path, rabbit_pw, rabbit_host):
    configuration = '''{
    "celery" : {
        "queue" : "dpdash",
        "broker" : "amqp://dpdash:%(rabbit_pw)s@%(rabbit_host)s:%(rabbit_port)s//",
        "backend" : "amqp://dpdash:%(rabbit_pw)s@%(rabbit_host)s:%(rabbit_port)s//",
        "CELERY_RESULT_BACKEND" : "rpc",
        "CELERY_RESULT_PERSISTENT" : true,
        "CELERY_TASK_SERIALIZER" : "json",
        "CELERY_RESULT_SERIALIZER" : "json",
        "CELERY_IGNORE_RESULT" : false,
        "CELERY_ACCEPT_CONTENT" : ["json"],
        "CELERYD_STATE_DB" : "%(celery_path)s",
        "BROKER_USE_SSL" : {
            "keyfile": "%(key_path)s",
            "certfile" : "%(cert_path)s",
            "ca_certs" : "%(ca_path)s"
        },
        "BROKER_TRANSPORT_OPTIONS" : {
            "confirm_publish" : true
        }
    },
    "mongodb" : {
        "ssl" : {
            "ssl_certfile" : "%(cert_path)s",
            "ssl_keyfile" : "%(key_path)s",
            "ca_certs" : "%(ca_path)s"
        }
    }
}''' % {
        'rabbit_host' : rabbit_host,
        'rabbit_port' : rabbit_port,
        'celery_path' : celery_path,
        'key_path': key_path,
        'cert_path' : cert_path,
        'ca_path' : ca_path,
        'rabbit_pw':rabbit_pw
    }

    return export_file(os.path.join(config_path, 'dppy.conf'), configuration)

def configure_supervisord(supervisor_id, config_path):
    configuration = '''; Sample supervisor config file.
;
; For more information on the config file, please see:
; http://supervisord.org/configuration.html

[unix_http_server]
file=/tmp/%(supervisor_id)s.sock   ; the path to the socket file
;chmod=0700                 ; socket file mode (default 0700)
;chown=nobody:nogroup       ; socket file uid:gid owner
;username=user              ; default is no username (open server)
;password=123               ; default is no password (open server)

;[inet_http_server]         ; inet (TCP) server disabled by default
;port=127.0.0.1:9001        ; ip_address:port specifier, *:port for all iface
;username=user              ; default is no username (open server)
;password=123               ; default is no password (open server)

[supervisord]
logfile=/data/dpdash/supervisord/logs/supervisord.log ; main log file; default $CWD/supervisord.log
logfile_maxbytes=50MB        ; max main logfile bytes b4 rotation; default 50MB
logfile_backups=10           ; # of main logfile backups; 0 means none, default 10
loglevel=info                ; log level; default info; others: debug,warn,trace
pidfile=/data/dpdash/supervisord/supervisord.pid ; supervisord pidfile; default supervisord.pid
nodaemon=false               ; start in foreground if true; default false
minfds=1024                  ; min. avail startup file descriptors; default 1024
minprocs=200                 ; min. avail process descriptors;default 200
;umask=022                   ; process file creation umask; default 022
;user=chrism                 ; default is current user, required if root
identifier=%(supervisor_id)s ; supervisord identifier, default is 'supervisor'
;directory=/tmp              ; default is not to cd during start
;nocleanup=true              ; don't clean up tempfiles at start; default false
;childlogdir=/tmp            ; 'AUTO' child log dir, default $TEMP
;environment=KEY="value"     ; key value pairs to add to environment
;strip_ansi=false            ; strip ansi escape codes in logs; def. false

; The rpcinterface:supervisor section must remain in the config file for
; RPC (supervisorctl/web interface) to work.  Additional interfaces may be
; added by defining them in separate [rpcinterface:x] sections.

[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

; The supervisorctl section configures how supervisorctl will connect to
; supervisord.  configure it match the settings in either the unix_http_server
; or inet_http_server section.

[supervisorctl]
serverurl=unix:///tmp/%(supervisor_id)s.sock ; use a unix:// URL  for a unix socket
;serverurl=http://127.0.0.1:9001 ; use an http:// url to specify an inet socket
;username=chris              ; should be same as in [*_http_server] if set
;password=123                ; should be same as in [*_http_server] if set
;prompt=mysupervisor         ; cmd line prompt (default "supervisor")
;history_file=~/.sc_history  ; use readline history if available

[program:mongod]
command=mongod --config /data/dpdash/configs/mongodb.conf --logpath /data/dpdash/mongodb/logs/mongod.log ; the program (relative uses PATH, can take args)
priority=1                    ; the relative start priority (default 999)
autostart=true                ; start at supervisord start (default: true)
startsecs=10                  ; # of secs prog must stay up to be running (def. 1)
startretries=3                ; max # of serial start failures when starting (default 3)
autorestart=unexpected        ; when to restart if exited after running (def: unexpected)
exitcodes=0,2                 ; 'expected' exit codes used with autorestart (default 0,2)
stopsignal=QUIT               ; signal used to kill process (default TERM)
stopwaitsecs=10               ; max num secs to wait b4 SIGKILL (default 10)
stopasgroup=false             ; send stop signal to the UNIX process group (default false)
killasgroup=true              ; SIGKILL the UNIX process group (def false)
redirect_stderr=true          ; redirect proc stderr to stdout (default false)
stdout_logfile=/data/dpdash/supervisord/logs/mongod.out ; stdout log path, NONE for none; default AUTO
stdout_logfile_maxbytes=1MB   ; max # logfile bytes b4 rotation (default 50MB)
stdout_logfile_backups=10     ; # of stdout logfile backups (0 means none, default 10)
stdout_capture_maxbytes=1MB   ; number of bytes in 'capturemode' (default 0)
stdout_events_enabled=false   ; emit events on stdout writes (default false)
stderr_logfile=/data/dpdash/supervisord/logs/mongod.err ; stderr log path, NONE for none; default AUTO
stderr_logfile_maxbytes=1MB   ; max # logfile bytes b4 rotation (default 50MB)
stderr_logfile_backups=10     ; # of stderr logfile backups (0 means none, default 10)
stderr_capture_maxbytes=1MB   ; number of bytes in 'capturemode' (default 0)
stderr_events_enabled=false   ; emit events on stderr writes (default false)
serverurl=AUTO                ; override serverurl computation (childutils)

[program:rabbitMQ]
command=/usr/lib/rabbitmq/bin/rabbitmq-server ; the program (relative uses PATH, can take args)
priority=2                    ; the relative start priority (default 999)
autostart=true                ; start at supervisord start (default: true)
startsecs=10                  ; # of secs prog must stay up to be running (def. 1)
startretries=3                ; max # of serial start failures when starting (default 3)
autorestart=unexpected        ; when to restart if exited after running (def: unexpected)
exitcodes=0,2                 ; 'expected' exit codes used with autorestart (default 0,2)
stopsignal=QUIT               ; signal used to kill process (default TERM)
stopwaitsecs=10               ; max num secs to wait b4 SIGKILL (default 10)
stopasgroup=false             ; send stop signal to the UNIX process group (default false)
killasgroup=true              ; SIGKILL the UNIX process group (def false)
redirect_stderr=true          ; redirect proc stderr to stdout (default false)
stdout_logfile=/data/dpdash/supervisord/logs/rabbitmq.out ; stdout log path, NONE for none; default AUTO
stdout_logfile_maxbytes=1MB   ; max # logfile bytes b4 rotation (default 50MB)
stdout_logfile_backups=10     ; # of stdout logfile backups (0 means none, default 10)
stdout_capture_maxbytes=1MB   ; number of bytes in 'capturemode' (default 0)
stdout_events_enabled=false   ; emit events on stdout writes (default false)
stderr_logfile=/data/dpdash/supervisord/logs/rabbitmq.err        ; stderr log path, NONE for none; default AUTO
stderr_logfile_maxbytes=1MB   ; max # logfile bytes b4 rotation (default 50MB)
stderr_logfile_backups=10     ; # of stderr logfile backups (0 means none, default 10)
stderr_capture_maxbytes=1MB   ; number of bytes in 'capturemode' (default 0)
stderr_events_enabled=false   ; emit events on stderr writes (default false)
serverurl=AUTO                ; override serverurl computation (childutils)

[program:celery]
command=celery worker -A dppy -l info -E -f /data/dpdash/celery/celery.log -Q dpdash -Ofair --pidfile /data/dpdash/celery/celeryd.pid ; the program (relative uses PATH, can take args)
priority=3                 ; the relative start priority (default 999)
directory=/sw/apps/dppy
autostart=true                ; start at supervisord start (default: true)
startsecs=10                   ; # of secs prog must stay up to be running (def. 1)
startretries=3                ; max # of serial start failures when starting (default 3)
autorestart=unexpected        ; when to restart if exited after running (def: unexpected)
exitcodes=0,2                 ; 'expected' exit codes used with autorestart (default 0,2)
stopsignal=QUIT               ; signal used to kill process (default TERM)
stopwaitsecs=10               ; max num secs to wait b4 SIGKILL (default 10)
stopasgroup=false             ; send stop signal to the UNIX process group (default false)
killasgroup=true              ; SIGKILL the UNIX process group (def false)
redirect_stderr=true          ; redirect proc stderr to stdout (default false)
stdout_logfile=/data/dpdash/supervisord/logs/celery_worker.out ; stdout log path, NONE for none; default AUTO
stdout_logfile_maxbytes=1MB   ; max # logfile bytes b4 rotation (default 50MB)
stdout_logfile_backups=10     ; # of stdout logfile backups (0 means none, default 10)
stdout_capture_maxbytes=1MB   ; number of bytes in 'capturemode' (default 0)
stdout_events_enabled=false   ; emit events on stdout writes (default false)
stderr_logfile=/data/dpdash/supervisord/logs/celery_worker.err        ; stderr log path, NONE for none; default AUTO
stderr_logfile_maxbytes=1MB   ; max # logfile bytes b4 rotation (default 50MB)
stderr_logfile_backups=10     ; # of stderr logfile backups (0 means none, default 10)
stderr_capture_maxbytes=1MB   ; number of bytes in 'capturemode' (default 0)
stderr_events_enabled=false   ; emit events on stderr writes (default false)
serverurl=AUTO                ; override serverurl computation (childutils)
''' % {
    'supervisor_id': supervisor_id
    }

    return export_file(os.path.join(config_path, 'supervisord.conf'), configuration)

def configure_dpdash(ca_path, key_path, cert_path, dpdash_port, mongo_port, rabbit_port, mongo_password, rabbit_password, session_secret, config_path, data_repo, dpdash_path, rabbit_host, mongo_host, secret):
    configuration = '''import { readFileSync } from "fs";
const cert = readFileSync("%(cert_path)s");
const key = readFileSync("%(key_path)s");
const ca = [readFileSync("%(ca_path)s")];

const config = {};

config.app = {};
config.app.debug = false;
config.app.address = "0.0.0.0";
config.app.port = %(dpdash_port)s;
config.app.logfile = "%(dpdash_log)s";
config.app.archive = "data";
config.app.secret = "%(secret)s";
config.app.sslKey = "%(key_path)s";
config.app.sslCertificate = "%(cert_path)s";
config.app.realms = [ "" ];
config.app.rootDir = "%(data_repo)s";

config.database = {};
config.database.mongo = {};
config.database.mongo.host = "%(mongo_host)s";
config.database.mongo.port = %(mongo_port)s;
config.database.mongo.appDB = "dpdmongo";
config.database.mongo.dataDB = "dpdata";
config.database.mongo.authSource = "admin";
config.database.mongo.username = "dpdash";
config.database.mongo.password = "%(mongo_password)s";

config.database.mongo.server = {};
config.database.mongo.server.ssl = true;
config.database.mongo.server.sslCA = ca;
config.database.mongo.server.sslCert = cert;
config.database.mongo.server.sslKey = key;
config.database.mongo.server.sslValidate = false;
config.database.mongo.server.reconnectTries = 1;
config.database.mongo.server.useNewUrlParser = true;

config.database.acl = {};
config.database.acl.json = "%(acl_path)s";

config.rabbitmq = {};

config.rabbitmq.host = "%(rabbit_host)s";
config.rabbitmq.port = "%(rabbit_port)s";
config.rabbitmq.vhost = "/";
config.rabbitmq.username = "dpdash";
config.rabbitmq.password = "%(rabbit_password)s";
config.rabbitmq.publisherQueue = "dpdash";
config.rabbitmq.consumerQueue = "dpdashResponse";

config.rabbitmq.opts = {};
config.rabbitmq.opts.ca = ca;
config.rabbitmq.opts.cert = cert;
config.rabbitmq.opts.key = key;

config.rabbitmq.sync = {};
config.rabbitmq.sync.hours = [1];

config.session = {};

config.session.secret = "%(session_secret)s";
config.session.saveUninitialized = false;
config.session.resave = true;

config.session.proxy = true;

config.session.cookie = {};
config.session.cookie.secure = true;
config.session.cookie.maxAge = 24*60*60*1000;

config.auth = {};
config.auth.table = "users";
config.auth.usernameField = "username";
config.auth.passwordField = "password";
config.auth.useLDAP = false;

config.auth.ldap = {};
config.auth.ldap.url = "ldap://0.0.0.0:000";
config.auth.ldap.bindDn = "cn=,ou=,dc=";
config.auth.ldap.bindCredentials = "PASSWORD";
config.auth.ldap.searchBase = "ou=,dc=,dc=";
config.auth.ldap.searchFilter = "(uid={{username}})";
config.auth.ldap.searchAttributes = ["cn", "mail", "memberOf", "uid", "title", "department", "company", "telephoneNumber", "badPwdCount", "badPasswordTime", "lockoutTime", "whenCreated", "whenChanged", "lastLogoff", "lastLogon", "accountExpires"];

export default config;''' % {
        'secret' : secret,
        'rabbit_host': rabbit_host,
        'mongo_host': mongo_host,
        'rabbit_port' : rabbit_port,
        'mongo_port' : mongo_port,
        'dpdash_port' : dpdash_port,
        'key_path' : key_path,
        'cert_path' : cert_path,
        'ca_path' : ca_path,
        'mongo_password' : mongo_password,
        'rabbit_password' : rabbit_password,
        'session_secret' : session_secret,
        'data_repo' : data_repo,
        'acl_path': os.path.join(dpdash_path, 'acl.json'),
        'dpdash_log': os.path.join(dpdash_path, 'dpdash.log')
    }

    return export_file(os.path.join(config_path, 'dashboard/config.js'), configuration)

if __name__ == '__main__':
    main()
