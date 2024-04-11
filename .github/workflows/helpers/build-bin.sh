#!/bin/sh
set -e

SCRIPT_NAME="$(basename "$0")"
fatal() { echo "[$SCRIPT_NAME] FATAL: $*" 1>&2; exit 1; }
info() { echo "[$SCRIPT_NAME] INFO: $*"; }

usage() {
cat<<EOF
Syntax: $SCRIPT_NAME /path/to/outdir
Helper script to build release binaries
EOF
exit 1
}

main() {
    case $1 in ''|-h|--help|help) usage;; esac
    command -v go >/dev/null || fatal "go not found"
    command -v git >/dev/null || fatal "git not found"

    [ -n "$GITHUB_WORKSPACE" ] || fatal "GITHUB_WORKSPACE not set"
    cd "$GITHUB_WORKSPACE"

    OUTDIR="$(realpath "$1")"
    [ -d "$OUTDIR" ] || mkdir -p "$OUTDIR"

    GIT_VERSION="$(git describe --tags | sed 's/^v//; s/-/+/')"
    [ -n "$GIT_VERSION" ] || fatal "could not determine GIT_VERSION"

    info "building notesium-linux-amd64 ($GIT_VERSION) ..."
    GOOS=linux GOARCH=amd64 go build \
        -o $OUTDIR/notesium-linux-amd64 \
        -ldflags "-s -w -X main.version=$GIT_VERSION"

    info "listing $OUTDIR/"
    ls -lh $OUTDIR
}

main "$@"
