#!/bin/bash
#  script to clean and reinstall all node modules
#  usage: ./clean_install.sh
set -e
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm -f package-lock.json
npm install