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
    --orphans       Limit list to notes without outgoing or incoming links
    --match=PATTERN Limit list to notes where pattern appears
    --sort=WORD     Sort list by title or modification time (mtime|title)
    --prefix=WORD   Include linked labels or modification date (mtime|label)
  links [filename]  Print list of links
    --color         Color code using ansi escape sequences
    --outgoing      Limit list to outgoing links related to filename
    --incoming      Limit list to incoming links related to filename
    --dangling      Limit list to broken links
  lines             Print all lines of notes (ie. fulltext search)
    --color         Color code prefix using ansi escape sequences
    --prefix=title  Include note title as prefix of each line
  stats             Print statistics
    --color         Color code using ansi escape sequences
    --table         Format as table with whitespace delimited columns
    --fmtnum        Format counts with thousands separator using a comma
  graph             Print graph data
    --encoded-url   Encode graph data in base64 and append to graph file url
    --href=FORMAT   Node links format (default: file://%:p:h/%:t)

Environment:
  NOTESIUM_DIR      Path to notes directory (default: \$HOME/notes)

EOF
exit 1
}


_list() {
    awk 'FNR==1{print FILENAME ":1:", substr($0,3)}' "$@"
}
_list_prefix_mtime() {
    ls -l $1 --time-style=long-iso *.md | \
        awk -v C="$Color" -v R="$Reset" '
            {getline title < $8; close($8)}
            {print $8 ":1:", C $6 R, substr(title,3)}'
}
_list_prefix_label_awk() {
    awk -F ":" -v C="$Color" -v R="$Reset" '
        {getline title < $1; close($1)}
        {getline label < $2; close($2)}
        {print $1 ":1:", C substr(label,3) R, substr(title,3)}'
}
_list_prefix_label_sort() {
    labels="$(awk 'FNR==1 && NF==2 {printf "-e %s ", FILENAME}' *.md)"
    if [ -z "$labels" ]; then _list $@ | sort -k2; return 0; fi
    grep --only-matching $labels "$@" | _list_prefix_label_awk | sort -k2
    _list $(grep --files-without-match $labels "$@") | sort -k2
}
_list_prefix_label() {
    labels="$(awk 'FNR==1 && NF==2 {printf "-e %s ", FILENAME}' *.md)"
    if [ -z "$labels" ]; then _list $@; return 0; fi
    grep --only-matching $labels "$@" | _list_prefix_label_awk
    _list $(grep --files-without-match $labels "$@")
}
_list_match() {
    pattern="$1"; shift
    [ "$pattern" ] || fatal "pattern not specified"
    grep --line-number --only-matching "$pattern" "$@" | \
        awk -F ":" '
            {getline title < $1; close($1)}
            {print $1 ":" $2 ":", substr(title,3)}' | uniq
}
_list_labels() {
    awk 'FNR==1 && NF==2 {print FILENAME ":1:", substr($0,3)}' "$@"
}
_list_orphans() {
    links=$(grep -oP "$link_re" "$@" | awk -F ":" '{printf "-e %s ", $2}')
    if [ -z "$links" ]; then _list "$@"; return 0; fi
    orphans=$(grep --files-without-match -P "$link_re" "$@" | grep -v $links)
    [ "$orphans" ] || return 0
    _list $orphans
}
_links() {
    grep --with-filename --line-number -oP "$link_re" "$@" | \
        awk -F ":" -v C="$Color" -v R="$Reset" '
            {getline source < $1; close($1)}
            {getline target < $3; close($3)}
            {print $1 ":" $2 ":", C substr(source,3) R, "→", substr(target,3)}'
}
_links_dangling() {
    grep --with-filename --line-number -oP "$link_re" "$@" | \
        awk -F ":" -v C="$Color" -v R="$Reset" '
            {getline source < $1; close($1)}
            {if (getline < $3 < 0)
                print $1 ":" $2 ":", C substr(source,3) R, "→", $3}'
}
_links_outgoing() {
    outgoing="$(grep -oP "$link_re" "$1" || true)"
    [ "$outgoing" ] || return 0
    _list $outgoing
}
_links_incoming() {
    _list_match ]\("$1"\) *.md
}
_links_outgoing_prefix() {
    _links_outgoing "$1" | \
        awk -v C="$Color" -v R="$Reset" '{$1=$1 " " C "outgoing" R}1'
}
_links_incoming_prefix() {
    _links_incoming "$1" | \
        awk -v C="$Color" -v R="$Reset" '{$1=$1 " " C "incoming" R}1'
}
_lines() {
    awk 'NF {print FILENAME ":" FNR ": " $0}' "$@"
}
_lines_prefix_title() {
    awk -v C="$Color" -v R="$Reset" '
        FNR == 1 { title=substr($0,3) }
        NF {print FILENAME ":" FNR ":", C title R, $0}' "$@"
}
_stats() {
    echo "notes $(_list "$@" | wc -l)"
    echo "labels $(_list_labels "$@" | wc -l)"
    echo "orphans $(_list_orphans "$@" | wc -l)"
    echo "links $(_links "$@" | wc -l)"
    echo "dangling $(_links_dangling "$@" | wc -l)"
    echo "lines $(awk 'NF {print $0}' "$@" | wc -l)"
    echo "words $(awk 'NF {print $0}' "$@" | wc --words)"
    echo "chars $(awk 'NF {print $0}' "$@" | wc --chars)"
}
_graph_csv() {
    echo "$1" | sed "s|\%:p:h|$NOTESIUM_DIR|"; shift
    echo "-----"
    echo "id,title"
    awk -vOFS="," 'FNR==1{print FILENAME, substr($0,3)}' "$@"
    echo "-----"
    echo "source,target"
    grep --with-filename -oP "$link_re" "$@" | \
        awk -F ":" -vOFS="," '{print $1, $2}'
}

notesium_new() {
    epoch_int="$(date +%s)"
    epoch_hex="$(printf '%x' "$epoch_int")"
    echo "$NOTESIUM_DIR/$epoch_hex.md"
}

notesium_list() {
    while [ "$1" != "" ]; do
        case $1 in
            --color)                Color="\033[0;36m"; Reset="\033[0m";;
            --sort=title)           Sort="SortTitle";;
            --sort=mtime)           Sort="SortMtime";;
            --prefix=label)         Prefix="PrefixLabel";;
            --prefix=mtime)         Prefix="PrefixMtime";;
            --labels)               Limit="LimitLabels";;
            --orphans)              Limit="LimitOrphans";;
            --match=*)              Limit="LimitMatch"; pattern="${1##*=}";;
            *)                      fatal "unrecognized option: $1";;
        esac
        shift
    done
    case List${Limit}${Prefix}${Sort} in
        List)                       _list *.md;;
        ListSortTitle)              _list *.md | sort -k2;;
        ListSortMtime)              _list $(ls -t *.md);;
        ListPrefixLabel)            _list_prefix_label *.md;;
        ListPrefixLabelSortTitle)   _list_prefix_label_sort *.md;;
        ListPrefixLabelSortMtime)   _list_prefix_label $(ls -t *.md);;
        ListPrefixMtime)            _list_prefix_mtime;;
        ListPrefixMtimeSortTitle)   _list_prefix_mtime | sort -k3;;
        ListPrefixMtimeSortMtime)   _list_prefix_mtime -t;;
        ListLimitLabels)            _list_labels *.md;;
        ListLimitLabelsSortTitle)   _list_labels *.md | sort -k2;;
        ListLimitLabelsSortMtime)   _list_labels $(ls -t *.md);;
        ListLimitOrphans)           _list_orphans *.md;;
        ListLimitOrphansSortTitle)  _list_orphans *.md | sort -k2;;
        ListLimitOrphansSortMtime)  _list_orphans $(ls -t *.md);;
        ListLimitMatch)             _list_match "$pattern" *.md;;
        ListLimitMatchSortTitle)    _list_match "$pattern" *.md | sort -k2;;
        ListLimitMatchSortMtime)    _list_match "$pattern" $(ls -t *.md);;
        *)                          fatal "unsupported option grouping";;
    esac
}

notesium_links() {
    unset fname
    _set_fname() {
        [ "$fname" ] && fatal "unrecognized option: $1"
        [ -e "$1" ] || fatal "does not exist: $1"
        fname=$1
    }
    while [ "$1" != "" ]; do
        case $1 in
            --color)                Color="\033[0;36m"; Reset="\033[0m";;
            --outgoing)             Outgoing="Outgoing";;
            --incoming)             Incoming="Incoming";;
            --dangling)             Dangling="Dangling";;
            *)                      _set_fname "$1";
        esac
        shift
    done
    if [ "$fname" ]; then
        case ${Dangling}${Outgoing}${Incoming} in
            Dangling*)              fatal "dangling filename not supported";;
            "")                     Outgoing="Outgoing"; Incoming="Incoming";;
        esac
    else
        [ "${Outgoing}${Incoming}" ] && fatal "filename not specified"
    fi
    case Links${Dangling}${Outgoing}${Incoming} in
        Links)                      _links *.md | sort -k2;;
        LinksDangling)              _links_dangling *.md | sort -k2;;
        LinksOutgoing)              _links_outgoing "$fname";;
        LinksIncoming)              _links_incoming "$fname" | sort -k2;;
        LinksOutgoingIncoming)      _links_outgoing_prefix "$fname";
                                    _links_incoming_prefix "$fname" |sort -k3;;
        *)                          fatal "unsupported option grouping";;
    esac
}

notesium_lines() {
    while [ "$1" != "" ]; do
        case $1 in
            --color)                Color="\033[0;36m"; Reset="\033[0m";;
            --prefix=title)         Prefix="PrefixTitle";;
            *)                      fatal "unrecognized option: $1";;
        esac
        shift
    done
    case Lines${Prefix} in
        Lines)                      _lines *.md;;
        LinesPrefixTitle)           _lines_prefix_title *.md;;
        *)                          fatal "unsupported option grouping";;
    esac
}

notesium_stats() {
    _color() { awk -v C="$Color" -v R="$Reset" '{print C $1 R, $2}'; }
    _comma() { sed -e :a -e 's/\(.*[0-9]\)\([0-9]\{3\}\)/\1,\2/;ta'; }
    while [ "$1" != "" ]; do
        case $1 in
            --color)                Color="\033[0;36m"; Reset="\033[0m";;
            --table)                Output="Table";;
            --fmtnum)               FmtNum="FmtNum";;
            *)                      fatal "unrecognized option: $1";;
        esac
        shift
    done
    case Stats${Output}${FmtNum} in
        Stats)                      _stats *.md | _color;;
        StatsTable)                 _stats *.md | _color | column -t;;
        StatsFmtNum)                _stats *.md | _color | _comma;;
        StatsTableFmtNum)           _stats *.md | _color | column -t | _comma;;
        *)                          fatal "unsupported option grouping";;
    esac
}

notesium_graph() {
    Href="file://%:p:h/%:t"
    while [ "$1" != "" ]; do
        case $1 in
            --encoded-url)          Output="EncodedUrl";;
            --href=*)               Href="${1##*=}";;
            *)                      fatal "unrecognized option: $1";;
        esac
        shift
    done
    if [ "$Output" = "EncodedUrl" ]; then
        graph_index="$(dirname "$(realpath "$0")")/graph/index.html"
        [ -e "$graph_index" ] || fatal "$graph_index does not exist"
    fi
    case Graph${Output} in
        Graph)                      _graph_csv "$Href" *.md;;
        GraphEncodedUrl)            printf "file://%s?data=" "$graph_index";
                                    _graph_csv "$Href" *.md | base64 --wrap 0;;
        *)                          fatal "unsupported option grouping";;
    esac
}

main() {
    case $1 in ""|-h|--help|help) usage;; esac

    NOTESIUM_DIR="${NOTESIUM_DIR:=$HOME/notes}"
    NOTESIUM_DIR="$(realpath "$NOTESIUM_DIR")"
    [ -d "$NOTESIUM_DIR" ] || \
        fatal "NOTESIUM_DIR does not exist: $NOTESIUM_DIR"
    cd "$NOTESIUM_DIR"

    # PCRE regular expression for link format
    link_re='(?<=\]\()\b[[:xdigit:]]{8}\.md\b(?=\))'

    case $1 in
        home)       echo "$NOTESIUM_DIR";;
        new)        shift; notesium_new $@;;
        list)       shift; notesium_list $@;;
        links)      shift; notesium_links $@;;
        lines)      shift; notesium_lines $@;;
        stats)      shift; notesium_stats $@;;
        graph)      shift; notesium_graph $@;;
        -*)         fatal "unrecognized option: $1";;
        *)          fatal "unrecognized command: $1";;
    esac
}

main "$@"
