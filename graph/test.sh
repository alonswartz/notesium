#!/bin/sh
set -e

GRAPH_DIR="$(dirname $(realpath $0))"
FIXTURES_DIR="$(dirname $GRAPH_DIR)/tests/fixtures"

_data_csv() {
    NOTESIUM_DIR=$FIXTURES_DIR notesium graph | grep -v xxxxxxxx.md
}

_data_csv_js() {
    echo "var dataCsv = \`$(_data_csv)\n\`"
}

_data_csv_js > $GRAPH_DIR/data.csv.js
echo "* $GRAPH_DIR/data.csv.js"
echo "* file://${GRAPH_DIR}/index.html"
