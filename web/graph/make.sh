#!/bin/bash -e

fatal() { echo "Fatal: $*" 1>&2; exit 1; }

usage() {
cat<<EOF
Usage: $0 COMMAND [OPTIONS]

Commands:
  all                   handle vendor, tailwind
  vendor                download and verify vendor files
  tailwind [--watch]    build tailwind.css

EOF
exit 1
}

D3JS_URL="https://d3js.org/d3.v7.min.js"
D3JS_HASH="d6b03aefc9f6c44c7bc78713679c78c295028fa914319119e5cc4b4954855b1c"

__vendor() {
    URL="$1"
    OUT="$(basename "$URL")"
    HASH="$2"
    if [ -e "$OUT" ]; then
        echo -n "$HASH  $OUT" | sha256sum --strict --check -
        return 0
    fi
    curl -qs $URL -o $OUT.tmp
    echo -n "$HASH  $OUT.tmp" | sha256sum --strict --check -
    mv $OUT.tmp $OUT
}

_vendor() {
    command -v curl >/dev/null || fatal "curl not found"
    command -v sha256sum >/dev/null || fatal "sha256sum not found"
    __vendor "$D3JS_URL" "$D3JS_HASH"
}

_tailwind() {
    # tailwindcss v3.1.6
    OPTS="$@"
    command -v tailwindcss >/dev/null || fatal "tailwindcss not found"
    [ -e "tailwind.input.css" ] || fatal "tailwind.input.css not found"
    [ -e "tailwind.config.js" ] || fatal "tailwind.config.js not found"
    tailwindcss $OPTS --minify -i tailwind.input.css -o tailwind.css
}

main() {
    cd $(dirname $(realpath $0))
    case $1 in
        ""|-h|--help|help)      usage;;
        all)                    _vendor; _tailwind;;
        vendor)                 _vendor;;
        tailwind)               shift; _tailwind $@;;
        *)                      fatal "unrecognized command: $1";;
    esac
}

main "$@"
