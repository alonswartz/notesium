#!/bin/sh

# Prior to v0.2.0, 8 RANDOM hexidecimal digits were used for filenames.
# Since v0.2.0, the UNIX epoch time is used, and encoded in hexidecimal.
#
# To aid in conversion, this script can be used to rename all files
# to the new format as well as update all links. The ctime used will
# be that of the first git commit or mtime of the file, whichever
# is eariler.

set -e

fatal() { echo "Fatal: $*" 1>&2; exit 1; }

usage() {
cat<<EOF
==========================================================================
WARNING: POTENTIAL DATA LOSS. PLEASE BACKUP. TRY FIRST IN A DUPLICATE COPY
==========================================================================

Usage: $(basename "$0") COMMAND
Rename files to ctimehex format and update links
The ctime used will be first commit or mtime of file, whichever is earlier

Commands:
  0-dates        print dates to see if conversion is required
  1-list         create list for conversion
  2-convert      update links and rename files

Environment:
  NOTESIUM_DIR   path to notes directory (required)

Requirements:
  git and notesium in \$PATH
  \$NOTESIUM_DIR/*.md are tracked by git

EOF
exit 1
}

_verify_ctimehex_list() {
    for line in $(cat "$CTIMEHEX_LIST"); do
        fname_old="$(echo "$line" | awk -F ":" '{print $1}')"
        fname_new="$(echo "$line" | awk -F ":" '{print $2}')"
        [ -e "$fname_old" ] || fatal "$fname_old does not exist"
        [ -e "$fname_new" ] && fatal "$fname_new already exists"
    done
    d1="$(cat "$CTIMEHEX_LIST" |awk -F ":" '{print $1}' |sort |uniq -D)"
    d2="$(cat "$CTIMEHEX_LIST" |awk -F ":" '{print $2}' |sort |uniq -D)"
    [ "${d1}${d2}" ] && fatal "duplicates found, aborting: $d1 $d2"
    return 0
}

_verify_git_tracked() {
    for f in *.md; do
        epoch_git="$(git log --format="format:%ct" --reverse "$f" | head -1)"
        [ "$epoch_git" ] || fatal "$f not tracked by git, aborting..."
    done
}

_list_git_mtime() {
    # use either first commit of file or modtime, whichever is earlier
    # increment 1s for duplicates
    used="$(ls *.md)"
    for f in *.md; do
        epoch_mod="$(ls -l --time-style="+%s" "$f" | awk '{print $6}')"
        epoch_git="$(git log --format="format:%ct" --reverse "$f" | head -1)"
        epoch="$epoch_mod"
        [ "$epoch_git" ] || epoch_git="9999999999"
        [ "$epoch_git" -lt "$epoch_mod" ] && epoch="$epoch_git"
        fname_new="$(printf '%x' "$epoch").md"
        while [ "$(echo "$used" | grep "$fname_new")" ]; do
            epoch="$((epoch + 1))"
            fname_new="$(printf '%x' "$epoch").md"
        done
        used="$used $fname_new"
        echo "$f:$fname_new:$epoch:$epoch_mod:$epoch_git"
    done
}

ctimehex_dates() {
    ls *.md | awk -F "." '{printf "@%d\n", "0x" $1}' | date --file=- "+%F" 
    echo -n "\n* if the above dates are way in the past or future,"
    echo " conversion is recommended."
}

ctimehex_list() {
    [ -e "$CTIMEHEX_LIST" ] && fatal "$CTIMEHEX_LIST already exists"
    _verify_git_tracked
    _list_git_mtime | tee -a "$CTIMEHEX_LIST"
    _verify_ctimehex_list
    echo "\n* saved to: $CTIMEHEX_LIST\n  please verify before proceeding..."
}

ctimehex_convert() {
    [ -e "$CTIMEHEX_LIST" ] || fatal "$CTIMEHEX_LIST not found"
    [ -e "$CTIMEHEX_LINKS1" ] && fatal "$CTIMEHEX_LINKS1 already exists"
    [ -e "$CTIMEHEX_LINKS2" ] && fatal "$CTIMEHEX_LINKS2 already exists"
    _verify_ctimehex_list

    echo "* snapshot: $CTIMEHEX_LINKS1"
    NOTESIUM_DIR=. notesium links | cut -d: -f2- > "$CTIMEHEX_LINKS1"

    for line in $(cat "$CTIMEHEX_LIST"); do
        fname_old="$(echo "$line" | awk -F ":" '{print $1}')"
        fname_new="$(echo "$line" | awk -F ":" '{print $2}')"
        echo "* updating $fname_old to $fname_new"
        sed -i "s|]($fname_old)|]($fname_new)|g" *.md
        git mv "$fname_old" "$fname_new"
    done

    # restore modification time?
    # for line in $(cat "$CTIMEHEX_LIST"); do
    #     fname_new="$(echo "$line" | awk -F ":" '{print $2}')"
    #     epoch_mod="$(echo "$line" | awk -F ":" '{print $4}')"
    #     mtime_mod="$(date -d "@$epoch_mod" "+%Y%m%d%H%M.%S")"
    #     touch -m -t "$mtime_mod" "$fname_new"
    #     git add "$fname_new"
    # done

    echo "* snapshot: $CTIMEHEX_LINKS1"
    NOTESIUM_DIR=. notesium links | cut -d: -f2- > "$CTIMEHEX_LINKS2"

    echo "* snapshot: comparison diff"
    if [ "$(diff "$CTIMEHEX_LINKS1" "$CTIMEHEX_LINKS2")" ]; then
        echo "* Error: post conversion test failed, files differ:" 1>&2
        echo "  - $CTIMEHEX_LINKS1" 1>&2
        echo "  - $CTIMEHEX_LINKS2" 1>&2
        return 1
    fi
    echo "* conversion complete. please verify, commit changes, and remove:"
    echo "  - $CTIMEHEX_LIST"
    echo "  - $CTIMEHEX_LINKS1"
    echo "  - $CTIMEHEX_LINKS2"
    return 0
}

main() {
    case $1 in ""|-h|--help|help) usage;; esac

    [ "$NOTESIUM_DIR" ] || fatal "NOTESIUM_DIR not set in environment"
    [ -d "$NOTESIUM_DIR" ] || fatal "$NOTESIUM_DIR does not exist"
    NOTESIUM_DIR="$(realpath "$NOTESIUM_DIR")"
    CTIMEHEX_LIST="$NOTESIUM_DIR/ctimehex-list.txt"
    CTIMEHEX_LINKS1="$NOTESIUM_DIR/ctimehex-links1.txt"
    CTIMEHEX_LINKS2="$NOTESIUM_DIR/ctimehex-links2.txt"
    cd "$NOTESIUM_DIR"

    command -v git >/dev/null || fatal "git not found"
    command -v notesium >/dev/null || fatal "notesium not found"
    git rev-parse --is-inside-work-tree >/dev/null

    case $1 in
        0-dates)            ctimehex_dates;;
        1-list)             ctimehex_list;;
        2-convert)          ctimehex_convert;;
        *)                  fatal "unrecognized command: $1";;
    esac
}

main "$@"
