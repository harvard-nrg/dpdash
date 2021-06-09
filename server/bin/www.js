
/**
 * Module dependencies.
 */

import app from '../app';
import { createServer } from 'http';
import { connect } from 'amqplib/callback_api';
import { CronJob } from 'cron';
import { spawn } from 'child_process';

const debug = require('debug')('po:server');

import config from '../configs/config';

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(config.app.port);
app.set('port', port);

console.log(port);

/**
 * Create HTTP server.
 */

const server = createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, config.app.address);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Create a websocket
 */
var io = require('socket.io')(server, {
  transports: ['websocket', 'polling'],
  pingInterval: 1500,
  pingTimeout: 2000
}); //squid v2

app.set('socketio', io);

/* authenticated */
io.use(function (socket, next) {
  if (socket.request.headers.cookie) return next();
  next(new Error('Authentication error'));
});

/* Not authenticated */
io.on('connection', function (socket) {
  socket.on('subscribe', function (roomID) {
    socket.join(roomID);
  });
  socket.on('unsubscribe', function (roomID) {
    socket.leave(roomID);
  });
});

/**
 * Create a rabbitmq connection
 */
var amqpAddress = 'amqp://' + config.rabbitmq.username;
amqpAddress = amqpAddress + ':' + config.rabbitmq.password;
amqpAddress = amqpAddress + '@' + config.rabbitmq.host + ':' + config.rabbitmq.port;
connect(amqpAddress, config.rabbitmq.opts, function (err, conn) {
  if (err) console.log(err);
  conn.createChannel(function (err, ch) {
    if (err) console.log(err);
    ch.assertQueue(config.rabbitmq.consumerQueue, { durable: false }, function (err, q) {
      if (err) console.log(err);
      consumer(conn, ch, q.queue);
    });
  });
});


/*
* Set up crons for data and acl import
*/
for (const hour in config.rabbitmq.sync.hours) {
  if (config.rabbitmq.sync.hours[hour] < 10) {
    var syncTime = '00 00 0' + config.rabbitmq.sync.hours[hour] + ' * * 0-6';
  } else {
    var syncTime = '00 00 ' + config.rabbitmq.sync.hours[hour] + ' * * 0-6';
  }
  new CronJob({
    cronTime: syncTime,
    onTick: function () {
      var importer = spawn('node', ['./utils/importer.js']);

      importer.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      importer.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
      });

      importer.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
      });
    },
    start: true,
    timeZone: config.rabbitmq.sync.timezone
  });
}

/* socket.io connection */
var dashboardNsp = io.of('/dashboard');

function consumer(conn, ch, replyTo) {
  ch.consume(replyTo, function (msg) {
    var response = JSON.parse(msg.content.toString());
    var taskStatus = response.status;
    if (taskStatus === 'PROCESSING') {
      dashboardNsp.emit(taskStatus, { taskId: response.task_id });
    } else if (taskStatus === 'SUCCESS') {
      dashboardNsp.emit(taskStatus, { taskId: response.task_id });
    }
  });
}


/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
