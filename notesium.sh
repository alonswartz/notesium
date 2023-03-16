#!/bin/sh
set -e

fatal() { echo "Fatal: $*" 1>&2; exit 1; }

usage() {
cat<<EOF
Usage: $(basename "$0") COMMAND [ARGS] [OPTS]

Commands:
  new               Print path for a new note
  home              Print path to notes directory 

  list              Print list of notes
    --color         Color code prefix using ansi escape sequences
    --sort=title    Sort the list by title
    --sort=mtime    Sort the list by modification time
    --prefix=label  Prefix title with linked labels (label == one word title)
    --prefix=mtime  Prefix title with the modification date

  match PATTERN     Print list of notes where pattern appears (eg. backlinks)
    --sort=title    Sort the list by title
    --sort=mtime    Sort the list by modification time

  orphans           Print list of notes without forward or back links
    --sort=title    Sort the list by title
    --sort=mtime    Sort the list by modification time

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
_list_prefix_mtime() {
    ls -l $1 --time-style=long-iso *.md \ |
        awk -v fname_col=8 '{fname=$fname_col; getline firstline < fname; print fname ":1:", $6, substr(firstline,3)}'
}
_list_prefix_label() {
    labels="$(awk 'FNR==1 && NF==2 {printf "-e %s ", FILENAME}' *.md)"
    grep --only-matching $labels $@ | \
        awk -F ":" -v fname_col=2 '{fname=$fname_col; getline firstline < fname; print $1 ":" substr(firstline,3); close(fname)}' | \
        awk -F ":" -v fname_col=1 '{fname=$fname_col; getline firstline < fname; print fname ":1:", $2, substr(firstline,3); close(fname)}'
}
_list_nolabel() {
    labels="$(awk 'FNR==1 && NF==2 {printf "-e %s ", FILENAME}' *.md)"
    _list $(grep --files-without-match $labels $@)
}
_match() {
    pattern="$1"; shift
    grep --line-number --only-matching $pattern $@ | \
        awk -F ":" -v fname_col=1 '{fname=$fname_col; getline firstline < fname; print $1 ":" $2 ":", substr(firstline,3); close(fname)}'
}
_orphans() {
    existing_links="$(grep --no-filename --only-match '[[:alnum:]]\{8\}\.md' *.md | awk '{printf "-e %s ", $0}')"
    _list $(grep --files-without-match '\([[:alnum:]]\{8\}\.md\)' $@ | grep -v $existing_links)
}

notesium_list() {
    while [ "$1" != "" ]; do
        case $1 in
            --color)            Color="Color";;
            --sort=title)       Sort="SortTitle";;
            --sort=mtime)       Sort="SortMtime";;
            --prefix=label)     Prefix="PrefixLabel";;
            --prefix=mtime)     Prefix="PrefixMtime";;
            *)                  fatal "unrecognized option: $1";;
        esac
        shift
    done
    case List${Prefix}${Sort}${Color} in
        List)                           _list *.md;;
        ListSortTitle)                  _list *.md | sort -k2;;
        ListSortMtime)                  _list $(ls -t *.md);;
        ListPrefixLabel)                _list_prefix_label *.md; _list_nolabel *.md;;
        ListPrefixLabelColor)           _list_prefix_label *.md | _colorcol 2; _list_nolabel *.md;;
        ListPrefixLabelSortTitle)       _list_prefix_label *.md | sort -k2; _list_nolabel *.md | sort -k2;;
        ListPrefixLabelSortTitleColor)  _list_prefix_label *.md | sort -k2 | _colorcol 2; _list_nolabel *.md | sort -k2;;
        ListPrefixLabelSortMtime)       _list_prefix_label $(ls -t *.md); _list_nolabel $(ls -t *.md);;
        ListPrefixLabelSortMtimeColor)  _list_prefix_label $(ls -t *.md) | _colorcol 2; _list_nolabel $(ls -t *.md);;
        ListPrefixMtime)                _list_prefix_mtime;;
        ListPrefixMtimeColor)           _list_prefix_mtime | _colorcol 2;;
        ListPrefixMtimeSortTitle)       _list_prefix_mtime | sort -k3;;
        ListPrefixMtimeSortTitleColor)  _list_prefix_mtime | sort -k3 | _colorcol 2;;
        ListPrefixMtimeSortMtime)       _list_prefix_mtime -t;;
        ListPrefixMtimeSortMtimeColor)  _list_prefix_mtime -t | _colorcol 2;;
        *)                              fatal "unsupported option grouping";;
    esac
}

notesium_match() {
    unset pattern
    while [ "$1" != "" ]; do
        case $1 in
            --sort=title)   Sort="SortTitle";;
            --sort=mtime)   Sort="SortMtime";;
            *)              if [ -n "$pattern" ]; then fatal "unrecognized option: $1"; else pattern=$1; fi;;
        esac
        shift
    done
    [ "$pattern" ] || fatal "pattern not specified"
    case Match${Sort} in
        Match)              _match $pattern *.md;;
        MatchSortTitle)     _match $pattern *.md | sort -k2;;
        MatchSortMtime)     _match $pattern $(ls -t *.md);;
        *)                  fatal "unsupported option grouping";;
    esac
}

notesium_orphans() {
    while [ "$1" != "" ]; do
        case $1 in
            --sort=title)   Sort="SortTitle";;
            --sort=mtime)   Sort="SortMtime";;
            *)              fatal "unrecognized option: $1";;
        esac
        shift
    done
    case Orphan${Sort} in
        Orphan)             _orphans *.md;;
        OrphanSortTitle)    _orphans *.md | sort -k2;;
        OrphanSortMtime)    _orphans $(ls -t *.md);;
        *)                  fatal "unsupported option grouping";;
    esac
}

main() {
    case $1 in ""|-h|--help|help) usage;; esac

    NOTESIUM_DIR="${NOTESIUM_DIR:=$HOME/notes}"
    NOTESIUM_DIR="$(realpath $NOTESIUM_DIR)"
    [ -d "$NOTESIUM_DIR" ] || fatal "NOTESIUM_DIR does not exist: $NOTESIUM_DIR"
    cd $NOTESIUM_DIR

    case $1 in
        new)        echo "$NOTESIUM_DIR/$(mcookie | head -c8).md";;
        home)       echo "$NOTESIUM_DIR";;
        list)       shift; notesium_list $@;;
        match)      shift; notesium_match $@;;
        orphans)    shift; notesium_orphans $@;;
        *)          fatal "unrecognized command: $1";;
    esac
}

main "$@"
