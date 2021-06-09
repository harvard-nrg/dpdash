#!/bin/bash

# strict mode so script quits immediately upon failure
set -eo pipefail

# Getting environment variables from .env
source ./loadenv.sh
source ./varcheck.sh

singularity run \
    -B ${state}:/data \
    -B ${state}/dpdash/configs/dashboard:/sw/apps/dpdash/server/configs \
    -B ${state}/dpdash/dist:/sw/apps/dpdash/dist \
    -B ${data}:/project_data \
    ${DPDASH_IMG} \
    /sw/apps/dpdash/singularity/quit.sh