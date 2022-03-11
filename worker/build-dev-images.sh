#!/bin/bash
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"
devcontainer build --type docker-compose -f ../docker-compose.yml -f ../docker-compose.devcontainer.yml --service worker .