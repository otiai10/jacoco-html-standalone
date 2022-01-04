#!/bin/bash

set -e

# English only, for now
expected='Options:
  --version          Show version number                               [boolean]
  --dir, -d          Directory to convert                               [string]
  --resourceDir, -r  Resource directory                                 [string]
  --outDir, -o       Output directory                                   [string]
  --help, -h         Show help                                         [boolean]'

actual=`node ./bin/index.js -h`

if [ "${actual}" != "${expected}" ]; then
  echo -e "Actual output is not what expected, which was:\n${actual}"
  echo -e "But expected to be:\n${expected}"
  exit 1
else
  echo "OK"
fi
