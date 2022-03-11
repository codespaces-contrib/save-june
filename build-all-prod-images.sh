#!/bin/bash
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"
web/build-prod-images.sh
worker/build-prod-images.sh