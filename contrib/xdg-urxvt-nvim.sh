#!/bin/sh
set -e

fatal() { echo "Fatal: $*" 1>&2; exit 1; }

usage() {
cat<<EOF
Usage: $(basename "$0") notesium:///path/to/dir/[xxxxxxxx.md]

EOF
exit 1
}

_open_absolute() {
    [ -f "$1" ] || fatal "$1 does not exist or not file"
    export BAT_STYLE="plain"
    export NOTESIUM_DIR="$(dirname "$1")"
    opts="-title Notesium -geometry 120x45+250+0"
    if [ "$THEME" = "light" ]; then
        export BAT_THEME="OneHalfLight"
        opts="$opts -name URxvtlight"
    fi
    urxvt $opts -e nvim $1 2>/dev/null &
}

_list_absolute() {
    [ -d "$1" ] || fatal "$1 does not exist or not directory"
    [ "$1" = "/" ] && fatal "directory not specified"
    export BAT_STYLE="plain"
    export NOTESIUM_DIR="$1"
    vimcmd="NotesiumList --prefix=label --sort=alpha --color"
    opts="-title Notesium -geometry 150x45+50+0"
    if [ "$THEME" = "light" ]; then
        export BAT_THEME="OneHalfLight"
        opts="$opts -name URxvtlight"
    fi
    urxvt $opts -e nvim -c "$vimcmd" 2>/dev/null &
}

main() {
    case $1 in ''|-h|--help|help) usage;; esac
    command -v nvim >/dev/null || fatal "nvim not found"
    command -v urxvt >/dev/null || fatal "urxvt not found"

    case $1 in
        notesium:///*.md)       _open_absolute "${1#notesium://}";;
        notesium:///*)          _list_absolute "${1#notesium://}";;
        *)                      fatal "unrecognized uri scheme: $1";;
    esac
}

main "$@"
