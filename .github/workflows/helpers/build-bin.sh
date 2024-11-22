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
    local outfile="notesium-${os}-${arch}"
    [ "$os" = "windows" ] && outfile="${outfile}.exe"

    info "building $outfile ($GIT_VERSION) ..."
    GOOS=$os GOARCH=$arch CGO_ENABLED=0 go build -o $OUTDIR/$outfile -ldflags "
        -s -w \
        -X main.gitversion=$GIT_VERSION \
        -X main.buildtime=$BUILD_TIME \
    "
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

    GIT_VERSION="$(git describe --tags --long --always --dirty)"
    [ -n "$GIT_VERSION" ] || fatal "could not determine GIT_VERSION"

    BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    [ -n "$BUILD_TIME" ] || fatal "could not determine BUILD_TIME"

    case "$2" in
        all)                    _build_binary linux amd64;
                                _build_binary linux arm64;
                                _build_binary darwin amd64;
                                _build_binary darwin arm64;
                                _build_binary windows amd64;
                                _build_binary windows arm64;;
        linux-amd64)            _build_binary linux amd64;;
        linux-arm64)            _build_binary linux arm64;;
        darwin-amd64)           _build_binary darwin amd64;;
        darwin-arm64)           _build_binary darwin arm64;;
        windows-amd64)          _build_binary windows amd64;;
        windows-arm64)          _build_binary windows arm64;;
        *)                      fatal "unrecognized os-arch: $2";;
    esac

    info "generating checksums.txt ..."
    _generate_checksums

    info "listing $OUTDIR/"
    ls -lh $OUTDIR
}

main "$@"
