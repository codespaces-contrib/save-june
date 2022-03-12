#!/bin/bash
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.fake-it-yaml"
npm install
cd ..
node .fake-it-yaml/fake-it.js
