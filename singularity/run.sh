#!/bin/bash

# strict mode so script quits immediately upon failure
set -eo pipefail

httpProxy=$1
httpsProxy=$2
noProxy=$3

# Proxy settings
export http_proxy=${httpProxy}
export https_proxy=${httpsProxy}
export noProxy=${noProxy}


# vars for rabbitmq-server
export RABBITMQ_CONFIG_FILE=/data/dpdash/configs/rabbitmq.conf
export RABBITMQ_CONF_ENV_FILE=/data/dpdash/configs/rabbitmq-env.conf

# vars for celery worker
export dppy_config=/data/dpdash/configs/dppy.conf

# start mongodb, celery, and rabbit
echo "Starting superivsord..."
supervisord -c /data/dpdash/configs/supervisord.conf

# sleep 30 seconds
sleep 30

# vars for DPdash node app
export DPDASH_UPLOADS=/data/dpdash/uploads
export DPDASH_UPLOADS_CONFIG_SCHEMA=/data/dpdash/configs/dashboard/config.schema

cd /sw/apps/dpdash

echo "Starting dpdash..."
npm run transpile && npm start
