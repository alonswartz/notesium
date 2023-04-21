#!/bin/sh
set -e

# ./test.sh | xargs -r -n 1 x-www-browser

GRAPH_DIR="$(dirname $(realpath $0))"
GRAPH_B64="$(notesium graph | base64 --wrap 0)"
echo "file://${GRAPH_DIR}/index.html?data=$GRAPH_B64"

