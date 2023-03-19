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
    --color         Color code prefix using ansi escape sequences
    --labels        Limit list to only label notes (ie. one word title)
    --orphans       Limit list to notes without forward or back links
    --match=PATTERN Limit list to notes where pattern appears (eg. backlinks)
    --sort=WORD     Sort list by title or modification time (mtime|title)
    --prefix=WORD   Include linked labels or modification date (mtime|label)
  lines             Print all lines of notes (ie. fulltext search)
    --color         Color code prefix using ansi escape sequences
    --prefix=title  Include note title as prefix of each line

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
_list_match() {
    pattern="$1"; shift
    [ "$pattern" ] || fatal "pattern not specified"
    grep --line-number --only-matching $pattern $@ | \
        awk -F ":" -v fname_col=1 '{fname=$fname_col; getline firstline < fname; print $1 ":" $2 ":", substr(firstline,3); close(fname)}'
}
_list_labels() {
    awk 'FNR==1 && NF==2 {print FILENAME ":1:", substr($0,3)}' $@
}
_list_orphans() {
    existing_links="$(grep --no-filename --only-match '[[:alnum:]]\{8\}\.md' *.md | awk '{printf "-e %s ", $0}')"
    _list $(grep --files-without-match '\([[:alnum:]]\{8\}\.md\)' $@ | grep -v $existing_links)
}
_lines() {
    awk 'NF {print FILENAME ":" FNR ":" $0}' $@
}
_lines_prefix_title() {
    awk 'NF {print FILENAME ";" FNR ";" $0}' $@ | awk -F ";" -v fname_col=1 '
        {fname=$fname_col; getline firstline < fname; printf "%s:%s: %s: %s\n", $1, $2, substr(firstline,3), $3; close(fname)}'
}
_lines_prefix_title_color() {
    awk 'NF {print FILENAME ";" FNR ";" $0}' $@ | awk -F ";" -v fname_col=1 'BEGIN{C="\033[0;36m";R="\033[0m"}
        {fname=$fname_col; getline firstline < fname; printf "%s:%s: %s%s%s %s\n", $1, $2, C, substr(firstline,3), R, $3; close(fname)}'
}


notesium_list() {
    while [ "$1" != "" ]; do
        case $1 in
            --color)            Color="Color";;
            --sort=title)       Sort="SortTitle";;
            --sort=mtime)       Sort="SortMtime";;
            --prefix=label)     Prefix="PrefixLabel";;
            --prefix=mtime)     Prefix="PrefixMtime";;
            --labels)           Limit="LimitLabels";;
            --orphans)          Limit="LimitOrphans";;
            --match=*)          Limit="LimitMatch"; match_pattern="${1##*=}";;
            *)                  fatal "unrecognized option: $1";;
        esac
        shift
    done
    case List${Limit}${Prefix}${Sort}${Color} in
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
        ListLimitLabels)                _list_labels *.md;;
        ListLimitLabelsSortTitle)       _list_labels *.md | sort -k2;;
        ListLimitLabelsSortMtime)       _list_labels $(ls -t *.md);;
        ListLimitOrphans)               _list_orphans *.md;;
        ListLimitOrphansSortTitle)      _list_orphans *.md | sort -k2;;
        ListLimitOrphansSortMtime)      _list_orphans $(ls -t *.md);;
        ListLimitMatch)                 _list_match $match_pattern *.md;;
        ListLimitMatchSortTitle)        _list_match $match_pattern *.md | sort -k2;;
        ListLimitMatchSortMtime)        _list_match $match_pattern $(ls -t *.md);;
        *)                              fatal "unsupported option grouping";;
    esac
}

notesium_lines() {
    while [ "$1" != "" ]; do
        case $1 in
            --color)            Color="Color";;
            --prefix=title)     Prefix="PrefixTitle";;
            *)                  fatal "unrecognized option: $1";;
        esac
        shift
    done
    case Lines${Prefix}${Color} in
        Lines)                          _lines *.md;;
        LinesPrefixTitle)               _lines_prefix_title *.md;;
        LinesPrefixTitleColor)          _lines_prefix_title_color *.md;;
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
        new)        echo "$NOTESIUM_DIR/$(mcookie | head -c8).md";;
        home)       echo "$NOTESIUM_DIR";;
        list)       shift; notesium_list $@;;
        lines)      shift; notesium_lines $@;;
        *)          fatal "unrecognized command: $1";;
    esac
}

main "$@"
