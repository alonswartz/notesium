#!/bin/sh
set -e

SCRIPT_NAME="$(basename "$0")"
fatal() { echo "[$SCRIPT_NAME] FATAL: $*" 1>&2; exit 1; }
info() { echo "[$SCRIPT_NAME] INFO: $*"; }

usage() {
cat<<EOF
Syntax: $SCRIPT_NAME /path/to/notesium-binary
Helper script to test release binary
EOF
exit 1
}

main() {
    case $1 in ''|-h|--help|help) usage;; esac
    command -v bats >/dev/null || fatal "bats not found"

    [ -n "$GITHUB_WORKSPACE" ] || fatal "GITHUB_WORKSPACE not set"
    cd "$GITHUB_WORKSPACE"

    BINARY="$(realpath "$1")"
    [ -x "$BINARY" ] || fatal "does not exist or not executable: $BINARY"

    info "copying binary to $GITHUB_WORKSPACE/notesium"
    cp $BINARY $GITHUB_WORKSPACE/notesium

    info "running bats tests ..."
    bats tests/
}

main "$@"
