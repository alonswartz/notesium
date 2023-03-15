#!/bin/sh
set -e

fatal() { echo "Fatal: $*" 1>&2; exit 1; }

usage() {
cat<<EOF
Usage: $(basename "$0") COMMAND [OPTIONS]

Commands:
  new               Print path for a new note
  home              Print path to notes directory 
  list              Print list of notes
    --color         Color code include using ansi escape sequences
    --sort=title    Sort the list by title
    --sort=mtime    Sort the list by modification time
    --include=mtime Include the modification date

Environment:
  NOTESIUM_DIR      Path to notes directory (default: \$HOME/notes)

EOF
exit 1
}


_colorcol() { column=$1; echo "$(cat - | sed "s/[^[:blank:]]\{1,\}/\\\e[0;36m&\\\e[0m/$column")"; }
_list() { awk 'FNR==1{print FILENAME ":1:", substr($0,3)}' $@; }
_list_include_mtime() { awk -v fname_col=8 '{fname=$fname_col; getline firstline < fname; print fname ":1:", $6, substr(firstline,3)}'; }

notesium_list() {
    while [ "$1" != "" ]; do
        case $1 in
            --color)            Color="Color";;
            --sort=title)       Sort="SortTitle";;
            --sort=mtime)       Sort="SortMtime";;
            --include=mtime)    Include="IncludeMtime";;
            *)                  fatal "unrecognized option: $1";;
        esac
        shift
    done
    case List${Include}${Sort}${Color} in
        List)                           _list *.md;;
        ListSortTitle)                  _list *.md | sort -k2;;
        ListSortMtime)                  _list $(ls -t *.md);;
        ListIncludeMtime)               ls -l  --time-style=long-iso *.md | _list_include_mtime;;
        ListIncludeMtimeSortMtime)      ls -lt --time-style=long-iso *.md | _list_include_mtime;;
        ListIncludeMtimeSortTitle)      ls -l  --time-style=long-iso *.md | _list_include_mtime | sort -k3;;
        ListIncludeMtimeColor)          ls -l  --time-style=long-iso *.md | _list_include_mtime | _colorcol 2;;
        ListIncludeMtimeSortMtimeColor) ls -lt --time-style=long-iso *.md | _list_include_mtime | _colorcol 2;;
        ListIncludeMtimeSortTitleColor) ls -l  --time-style=long-iso *.md | _list_include_mtime | sort -k3 | _colorcol 2;;
        *)                              fatal "unsupported option grouping";;
    esac
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
        list)   shift; notesium_list $@;;
        *)      fatal "unrecognized command: $1";;
    esac
}

main "$@"
