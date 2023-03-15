#!/bin/sh
set -e

fatal() { echo "Fatal: $*" 1>&2; exit 1; }

usage() {
cat<<EOF
Usage: $(basename "$0") COMMAND

Commands:
  new               Print path for a new note
  home              Print path to notes directory 
  list              Print list of notes

Environment:
  NOTESIUM_DIR      Path to notes directory (default: \$HOME/notes)

EOF
exit 1
}

main() {
    case $1 in ""|-h|--help|help) usage;; esac

    NOTESIUM_DIR="${NOTESIUM_DIR:=$HOME/notes}"
    NOTESIUM_DIR="$(realpath $NOTESIUM_DIR)"
    [ -d "$NOTESIUM_DIR" ] || fatal "NOTESIUM_DIR does not exist: $NOTESIUM_DIR"
    cd $NOTESIUM_DIR

    case $1 in
        new)    echo "$NOTESIUM_DIR/$(mcookie | head -c8).md";;
        home)   echo "$NOTESIUM_DIR";;
        list)   awk 'FNR==1{print FILENAME ":1:", substr($0,3)}' *.md;;
        *)      fatal "unrecognized command: $1";;
    esac
}

main "$@"
