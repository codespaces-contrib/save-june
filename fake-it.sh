#!/bin/bash
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.fake-it-json"
npm install
cd ..
node .fake-it-json/fake-it.js
