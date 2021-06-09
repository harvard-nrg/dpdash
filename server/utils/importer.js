import config from '../configs/config';
import { connect } from 'amqplib/callback_api';
import uuidV4 from 'uuid/v4';

function dataImport() {
  console.log('INFO - data - connecting to queue');
  var amqpAddress = 'amqps://' + config.rabbitmq.username;
  amqpAddress = amqpAddress + ':' + config.rabbitmq.password;
  amqpAddress = amqpAddress + '@' + config.rabbitmq.host + ':' + config.rabbitmq.port;
  connect(amqpAddress, config.rabbitmq.opts, function (err, conn) {
    if (err) {
      console.log('ERROR - rabbimtq - ' + err);
      return;
    }
    conn.createChannel(function (err, ch) {
      if (err) {
        console.log('ERROR - rabbimtq - ' + err);
        return;
      }
      ch.assertQueue('', { durable: false }, function (err, q) {
        if (err) {
          console.log('ERROR - rabbimtq - ' + err);
          return;
        }
        var correlationId = uuidV4();
        ch.consume(q.queue, function (msg) {
          if (msg.properties.correlationId == correlationId) {
            console.log('rabbitmq - cron - ' + msg.content.toString());
          }
          var messageContent = JSON.parse(msg.content);
          var messageStatus = messageContent.status;
          if (messageStatus) {
            if (messageStatus == 'SUCCESS') {
              console.log('rabbitmq - cron - success. exiting...');
              process.exit(0);
            } else if (messageStatus == 'FAILURE') {
              console.log('rabbitmq - cron - failed.');
              process.exit(1);
            } else if (messageStatus.startsWith('PROCESSING')) {
              console.log(messageStatus);
            } else {
              console.log('rabbitmq - cron - failed. reason unknown. exiting');
              process.exit(1);
            }
          }
        });

        var message = {};
        message.id = correlationId;
        message.task = 'import';
        message.args = [
          config.app.rootDir,
          config.app.rootDir,
          '',
          '',
          config.database.mongo.username,
          config.database.mongo.password,
          config.database.mongo.host,
          config.database.mongo.port,
          config.database.mongo.authSource,
          config.database.mongo.dataDB
        ];
        message.kwargs = {};
        message.retries = 0;

        var sent = ch.sendToQueue(
          config.rabbitmq.publisherQueue,
          new Buffer(JSON.stringify(message)),
          { correlationId: correlationId, contentType: 'application/json', replyTo: q.queue }
        );
      });
    });
  });
}
dataImport();
