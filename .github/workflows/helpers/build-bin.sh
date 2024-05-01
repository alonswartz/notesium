#!/bin/sh
set -e

SCRIPT_NAME="$(basename "$0")"
fatal() { echo "[$SCRIPT_NAME] FATAL: $*" 1>&2; exit 1; }
info() { echo "[$SCRIPT_NAME] INFO: $*"; }

usage() {
cat<<EOF
Syntax: $SCRIPT_NAME /path/to/outdir all|os-arch
Helper script to build release binaries
EOF
exit 1
}

_build_binary() {
    local os=$1 arch=$2
    local flags="-s -w -X main.version=$GIT_VERSION"
    local outfile="notesium-${os}-${arch}"
    [ "$os" = "windows" ] && outfile="${outfile}.exe"

    info "building $outfile ($GIT_VERSION) ..."
    GOOS=$os GOARCH=$arch go build -o $OUTDIR/$outfile -ldflags "$flags"
}

_generate_checksums() {
    cd $OUTDIR
    sha256sum notesium-* | tee checksums.txt
}

main() {
    case $1 in ''|-h|--help|help) usage;; esac
    command -v go >/dev/null || fatal "go not found"
    command -v git >/dev/null || fatal "git not found"
    command -v sha256sum >/dev/null || fatal "sha256sum not found"

    [ -n "$GITHUB_WORKSPACE" ] || fatal "GITHUB_WORKSPACE not set"
    cd "$GITHUB_WORKSPACE"

    OUTDIR="$(realpath "$1")"
    [ -d "$OUTDIR" ] || mkdir -p "$OUTDIR"

    GIT_VERSION="$(git describe --tags | sed 's/^v//; s/-/+/')"
    [ -n "$GIT_VERSION" ] || fatal "could not determine GIT_VERSION"

    case "$2" in
        all)                    _build_binary linux amd64;
                                _build_binary darwin amd64;
                                _build_binary windows amd64;;
        linux-amd64)            _build_binary linux amd64;;
        darwin-amd64)           _build_binary darwin amd64;;
        windows-amd64)          _build_binary windows amd64;;
        *)                      fatal "unrecognized os-arch: $2";;
    esac

    info "generating checksums.txt ..."
    _generate_checksums

    info "listing $OUTDIR/"
    ls -lh $OUTDIR
}

main "$@"
