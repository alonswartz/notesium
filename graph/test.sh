#!/bin/sh
set -e

_data_csv() {
cat<<EOF
id,title
1,this is 1
2,this is 2
3,this is 3
4,this is 4
5,this is 5
6,this is 6

source,target
1,2
1,3
1,4
2,4
3,4
4,5
EOF
}

GRAPH_DIR="$(dirname $(realpath $0))"
echo "var dataCsv = \`$(_data_csv)\n\`" > $GRAPH_DIR/data.csv.js
echo "* $GRAPH_DIR/data.csv.js"
echo "* file://${GRAPH_DIR}/index.html"
