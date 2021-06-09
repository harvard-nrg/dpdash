#!/bin/bash

# strict mode so script quits immediately upon failure
set -eo pipefail

# stop npm
cd /sw/apps/dpdash
npm stop

# TODO: make this do a graceful exit

pkill -f 'pm2'

# TODO: send SIGQUIT to supervisord

pkill -f 'supervisord'
pkill -f 'rabbitmq'
pkill -f 'erlang'
pkill -f 'celery'
pkill -f 'mongo'
