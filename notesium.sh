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
    --include=label Include the label (label == one word title)
    --include=mtime Include the modification date

Environment:
  NOTESIUM_DIR      Path to notes directory (default: \$HOME/notes)

EOF
exit 1
}


_colorcol() {
    column=$1
    echo "$(cat - | sed "s/[^[:blank:]]\{1,\}/\\\e[0;36m&\\\e[0m/$column")"
}
_list() {
    awk 'FNR==1{print FILENAME ":1:", substr($0,3)}' $@
}
_list_include_mtime() {
    ls -l $1 --time-style=long-iso *.md \ |
        awk -v fname_col=8 '{fname=$fname_col; getline firstline < fname; print fname ":1:", $6, substr(firstline,3)}'
}
_list_include_label() {
    labels="$(awk 'FNR==1 && NF==2 {printf "-e %s ", FILENAME}' *.md)"
    grep --only-matching $labels $@ | \
        awk -F ":" -v fname_col=2 '{fname=$fname_col; getline firstline < fname; print $1 ":" substr(firstline,3); close(fname)}' | \
        awk -F ":" -v fname_col=1 '{fname=$fname_col; getline firstline < fname; print fname ":1:", $2, substr(firstline,3); close(fname)}'
}
_list_nolabel() {
    labels="$(awk 'FNR==1 && NF==2 {printf "-e %s ", FILENAME}' *.md)"
    _list $(grep --files-without-match $labels $@)
}

notesium_list() {
    while [ "$1" != "" ]; do
        case $1 in
            --color)            Color="Color";;
            --sort=title)       Sort="SortTitle";;
            --sort=mtime)       Sort="SortMtime";;
            --include=label)    Include="IncludeLabel";;
            --include=mtime)    Include="IncludeMtime";;
            *)                  fatal "unrecognized option: $1";;
        esac
        shift
    done
    case List${Include}${Sort}${Color} in
        List)                           _list *.md;;
        ListSortTitle)                  _list *.md | sort -k2;;
        ListSortMtime)                  _list $(ls -t *.md);;
        ListIncludeLabel)               _list_include_label *.md; _list_nolabel *.md;;
        ListIncludeLabelColor)          _list_include_label *.md | _colorcol 2; _list_nolabel *.md;;
        ListIncludeLabelSortTitle)      _list_include_label *.md | sort -k2; _list_nolabel *.md | sort -k2;;
        ListIncludeLabelSortTitleColor) _list_include_label *.md | sort -k2 | _colorcol 2; _list_nolabel *.md | sort -k2;;
        ListIncludeLabelSortMtime)      _list_include_label $(ls -t *.md); _list_nolabel $(ls -t *.md);;
        ListIncludeLabelSortMtimeColor) _list_include_label $(ls -t *.md) | _colorcol 2; _list_nolabel $(ls -t *.md);;
        ListIncludeMtime)               _list_include_mtime;;
        ListIncludeMtimeColor)          _list_include_mtime | _colorcol 2;;
        ListIncludeMtimeSortTitle)      _list_include_mtime | sort -k3;;
        ListIncludeMtimeSortTitleColor) _list_include_mtime | sort -k3 | _colorcol 2;;
        ListIncludeMtimeSortMtime)      _list_include_mtime -t;;
        ListIncludeMtimeSortMtimeColor) _list_include_mtime -t | _colorcol 2;;
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
