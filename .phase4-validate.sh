#!/usr/bin/env bash
set -u
source ~/.nvm/nvm.sh
nvm use 23 2>/dev/null || nvm use node
cd /home/bretuobay/prjts/web-loom
LOG=phase4-validation-output.log
: > " \
