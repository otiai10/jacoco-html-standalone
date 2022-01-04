#!/bin/bash

set -e

# English only, for now
expected='Options:
      --version      Show version number                               [boolean]
  -d, --dir          Directory to convert                               [string]
  -r, --resourceDir  Resource directory                                 [string]
  -o, --outDir       Output directory                                   [string]
  -h, --help         Show help                                         [boolean]'

actual=`node ./bin/index.js -h`

if [ "${actual}" != "${expected}" ]; then
  echo -e "Actual output is not what expected, which was:\n${actual}"
  echo -e "But expected to be:\n${expected}"
  exit 1
else
  echo "OK"
fi
