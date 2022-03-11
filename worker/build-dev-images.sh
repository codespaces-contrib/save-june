#!/bin/bash
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"
docker build --target build-base -t save-june-worker-build .
docker build --target devcontainer -t save-june-worker-devcontainer .