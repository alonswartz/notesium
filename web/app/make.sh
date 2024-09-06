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
CM="https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7"
D3="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5"
cat<<EOF
628497cb69df7b1d31236479cad68c9bb3f265060afd5506a0c004b394dfa47e https://unpkg.com/vue@3.3.4/dist/vue.global.prod.js
458689ce1e2e10b9e363c4d6ef5e6edbfaf2fb42ccc38871c259a9092d75c7c6 $CM/codemirror.min.js
11077112ab6955d29fe41085c62365c7d4a2f00a570c7475e2aec2a8cbc85fc4 $CM/codemirror.min.css
6d31310a4719d151d198b604864fa7cb7dcaa5013888863585e06d7c7085f3d8 $CM/mode/markdown/markdown.min.js
f34f273fc3cb90d1be6556b9588e388aade167e11ee635f8b9637241b3788241 $CM/mode/gfm/gfm.min.js
2d2fc6f219c5ec536fe6bfe38fa241a8aba9045cf79b6e3599c906995644487b $CM/addon/mode/overlay.min.js
bbca0b4ba03a94163a1eaa604b45ef038c12d8572b7cc16a41dd287b40cc998c $CM/addon/selection/active-line.min.js
60e02d1780eb8a3c337f9d65af3229c5e73902c07e21ece8b6823efb83990ef2 $CM/addon/display/placeholder.min.js
5825e6c1565103989ff340733c9a6d7fdf0f5a06302913959f3600d21effd03a $CM/keymap/vim.min.js
d6b03aefc9f6c44c7bc78713679c78c295028fa914319119e5cc4b4954855b1c $D3/d3.min.js
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
