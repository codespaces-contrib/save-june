#!/bin/bash
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"
web/build-prod-image.sh
worker/build-prod-image.sh