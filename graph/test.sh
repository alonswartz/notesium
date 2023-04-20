#!/bin/sh
set -e

_nodes_csv() {
cat<<EOF
id,title
1,this is 1
2,this is 2
3,this is 3
4,this is 4
5,this is 5
6,this is 6
EOF
}

_links_csv() {
cat<<EOF
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
_nodes_csv > $GRAPH_DIR/nodes.csv
_links_csv > $GRAPH_DIR/links.csv

echo "* serve the graph:"
echo "python3 -m http.server --bind localhost 8888"

