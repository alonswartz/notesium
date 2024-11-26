#!/bin/bash -e

fatal() { echo "Fatal: $*" 1>&2; exit 1; }

usage() {
cat<<EOF
Usage: $0 COMMAND [OPTIONS]

Commands:
  all                   handle vendor, tailwind
  vendor                download, verify and concatenate vendor files
  tailwind [--watch]    build tailwind.css

EOF
exit 1
}

_vendor_files() {
CM="https://github.com/alonswartz/notesium-cm5/releases/download"
D3="https://cdnjs.cloudflare.com/ajax/libs/d3"
cat<<EOF
628497cb69df7b1d31236479cad68c9bb3f265060afd5506a0c004b394dfa47e https://unpkg.com/vue@3.3.4/dist/vue.global.prod.js
9571811ec12dbfe62834171349cf64bfa206ebd3d2519c16d2b3be4b5862b966 $CM/v5.65.18-1-3-ga7cb5ef/notesium-cm5.min.js
4d507d755e1d3188bd1e95d67b8bc9efd0094576135006fce68c5e9d44303061 $CM/v5.65.18-1-3-ga7cb5ef/notesium-cm5.min.css
d6b03aefc9f6c44c7bc78713679c78c295028fa914319119e5cc4b4954855b1c $D3/7.8.5/d3.min.js
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
    curl -qsL $SRC -o $DST.tmp
    echo -n "$HASH  $DST.tmp" | sha256sum --strict --check -
    mv $DST.tmp $DST
}

_vendor() {
    mkdir -p .vendor
    rm -f vendor.js vendor.css
    command -v curl >/dev/null || fatal "curl not found"
    command -v sha256sum >/dev/null || fatal "sha256sum not found"

    while IFS=' ' read -r HASH SRC; do
        local DST=".vendor/$(basename $SRC)"
        _vendor_get_verify "$SRC" "$DST" "$HASH"
        case "$DST" in
            *.js)  cat "$DST" >> vendor.js ;;
            *.css) cat "$DST" >> vendor.css ;;
        esac
    done < <(_vendor_files)
    sha256sum vendor.js
    sha256sum vendor.css
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
