#!/bin/bash
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"
web/build-dev-images.sh
worker/build-dev-images.sh