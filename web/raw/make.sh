#!/bin/bash -e

fatal() { echo "Fatal: $*" 1>&2; exit 1; }

usage() {
cat<<EOF
Usage: $0 COMMAND [OPTIONS]

Commands:
  vendor                download, verify and concatenate vendor files

EOF
exit 1
}

_vendor_files() {
CODEMIRROR="https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7"
cat<<EOF
628497cb69df7b1d31236479cad68c9bb3f265060afd5506a0c004b394dfa47e https://unpkg.com/vue@3.3.4/dist/vue.global.prod.js
458689ce1e2e10b9e363c4d6ef5e6edbfaf2fb42ccc38871c259a9092d75c7c6 $CODEMIRROR/codemirror.min.js
11077112ab6955d29fe41085c62365c7d4a2f00a570c7475e2aec2a8cbc85fc4 $CODEMIRROR/codemirror.min.css
6d31310a4719d151d198b604864fa7cb7dcaa5013888863585e06d7c7085f3d8 $CODEMIRROR/mode/markdown/markdown.min.js
f34f273fc3cb90d1be6556b9588e388aade167e11ee635f8b9637241b3788241 $CODEMIRROR/mode/gfm/gfm.min.js
2d2fc6f219c5ec536fe6bfe38fa241a8aba9045cf79b6e3599c906995644487b $CODEMIRROR/addon/mode/overlay.min.js
bbca0b4ba03a94163a1eaa604b45ef038c12d8572b7cc16a41dd287b40cc998c $CODEMIRROR/addon/selection/active-line.min.js
60e02d1780eb8a3c337f9d65af3229c5e73902c07e21ece8b6823efb83990ef2 $CODEMIRROR/addon/display/placeholder.min.js
EOF
}

_vendor_get_verify() {
    SRC="$1"
    DST="$2"
    HASH="$3"
    if [ -f "$DST" ]; then
        echo -n "$HASH  $DST" | sha256sum --strict --check -
        return 0
    fi
    curl -qs $SRC -o $DST.tmp
    echo -n "$HASH  $DST.tmp" | sha256sum --strict --check -
    mv $DST.tmp $DST
}

_vendor() {
    mkdir -p vendor
    rm -f vendor.js vendor.css
    command -v curl >/dev/null || fatal "curl not found"
    command -v sha256sum >/dev/null || fatal "sha256sum not found"

    while IFS=' ' read -r HASH SRC; do
        local DST="vendor/$(basename $SRC)"
        _vendor_get_verify "$SRC" "$DST" "$HASH"
        case "$DST" in
            *.js)  cat "$DST" >> vendor.js ;;
            *.css) cat "$DST" >> vendor.css ;;
        esac
    done < <(_vendor_files)
    sha256sum vendor.js
    sha256sum vendor.css
}

main() {
    cd $(dirname $(realpath $0))
    case $1 in
        ""|-h|--help|help)      usage;;
        vendor)                 _vendor;;
        *)                      fatal "unrecognized command: $1";;
    esac
}

main "$@"
