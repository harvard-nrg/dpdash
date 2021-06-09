#!/bin/bash

# strict mode so script quits immediately upon failure
set -eo pipefail

# vars for DPdash node app
export DPDASH_UPLOADS=/data/dpdash/uploads
export DPDASH_UPLOADS_CONFIG_SCHEMA=/data/dpdash/configs/dashboard/config.schema

cd /sw/apps/dpdash

echo "Building dpdash..."
npm run build
