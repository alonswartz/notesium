#!/bin/sh
set -e

SCRIPT_NAME="$(basename "$0")"
fatal() { echo "[$SCRIPT_NAME] FATAL: $*" 1>&2; exit 1; }
info() { echo "[$SCRIPT_NAME] INFO: $*"; }

usage() {
cat<<EOF
Usage: $SCRIPT_NAME
Helper script to mimic .github/workflow/main.yml
EOF
exit 1
}

_verify_version() {
    info "version.git:       $GIT_VERSION"
    info "version.changelog: $CHL_VERSION"
    [ "$GIT_VERSION" = "$CHL_VERSION" ] && return 0
    return 1
}

_verify_branch() {
    branch="$(git rev-parse --abbrev-ref HEAD)"
    info "branch: $branch"
    [ "$branch" = "master" ] && return 0
    return 1
}

_verify_branch_clean() {
    if [ "$(git status -s)" ]; then
        git status -s
        return 1
    fi
    return 0
}

_get_gitref() {
    if [ "${GIT_VERSION}" = "${CHL_VERSION}" ]; then
        echo "refs/tags/v${GIT_VERSION}"
    else
        echo "refs/heads/$(git rev-parse --abbrev-ref HEAD)"
    fi
}

_ask() {
    echo "\n$@"
    read -p "Proceed anyway? [y/N]: " proceed
    [ "$proceed" != "y" ] && fatal "user abort"
    return 0
}

main() {
    case $1 in -h|--help|help) usage;; esac
    cd "$(dirname "$(dirname "$(realpath "$0")")")"
    export GITHUB_WORKSPACE="$(pwd)"

    GIT_VERSION="$(git describe --tags | sed 's/^v//; s/-/+/')"
    [ -n "$GIT_VERSION" ] || fatal "could not determine GIT_VERSION"

    CHL_VERSION="$(awk 'FNR==1{print $2}' CHANGELOG.md)"
    [ -n "$CHL_VERSION" ] || fatal "could not determine CHL_VERSION"

    OUTDIR="build/$GIT_VERSION"
    [ -e "$OUTDIR" ] && fatal "$OUTDIR already exists"

    _verify_version || _ask "WARNING: version mismatch"
    _verify_branch || _ask "WARNING: branch not master"
    _verify_branch_clean || _ask "WARNING: branch is dirty"

    info "Build web"
    ./web/app/make.sh all

    info "Build binaries"
    .github/workflows/helpers/build-bin.sh $OUTDIR/ all

    info "Run tests"
    .github/workflows/helpers/run-tests.sh $OUTDIR/notesium-linux-amd64

    gref="$(_get_gitref)"
    info "Generate release notes (${gref})"
    .github/workflows/helpers/release-notes.sh $gref > $OUTDIR/release-notes.md

    info "$OUTDIR/"
    ls -lh $OUTDIR/
}

main "$@"
