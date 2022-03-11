#!/bin/bash
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"
docker build --target build-base -t save-june-web-build .
devcontainer build --type docker-compose -f ../docker-compose.yml -f ../docker-compose.devcontainer.yml --service web .