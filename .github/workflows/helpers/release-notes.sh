#!/bin/sh
set -e

SCRIPT_NAME="$(basename "$0")"
fatal() { echo "[$SCRIPT_NAME] FATAL: $*" 1>&2; exit 1; }
info() { echo "[$SCRIPT_NAME] INFO: $*"; }

usage() {
cat<<EOF
Syntax: $SCRIPT_NAME GIT_REF
Helper script to print changelog entry or commits
EOF
exit 1
}

_print_commits() {
    from="$1"
    to="$2"
    echo "Commits (${from}..${to}):\n"
    git --no-pager log ${from}..${to} --reverse --pretty=format:'- %s'
    echo "\n"
}

_tagged_release() {
    tag="$1"

    [ -e "CHANGELOG.md" ] || fatal "CHANGELOG.md not found"
    changelog_version="$(awk 'FNR==1{print $2}' CHANGELOG.md)"

    if [ "${tag}" = "v${changelog_version}" ]; then
        awk '/^##/{i++} i==1{print} i>1{exit}' CHANGELOG.md
    else
        # fallback: in case changelog has not been updated
        tag1="$(git tag --list | sort -V | tail -n 1)"
        tag2="$(git tag --list | sort -V | tail -n 2 | head -n 1)"
        if [ "$tag" = "$tag1" ]; then
            _print_commits $tag2 $tag
        else
            # this should never happen on a tagged release
            echo "## refs/tags/${tag} is not latest tag: ${tag1}\n"
            _print_commits $tag1 HEAD
        fi
    fi
}

_pre_release() {
    branch="$1"
    GIT_VERSION="$(git describe --tags | sed 's/^v//; s/-/+/')"
    echo "## Pre-release ${GIT_VERSION} (refs/heads/${branch})\n"
    tag1="$(git tag --list | sort -V | tail -n 1)"
    _print_commits $tag1 HEAD
}

main() {
    case $1 in ''|-h|--help|help) usage;; esac
    command -v git >/dev/null || fatal "git not found"

    [ -n "$GITHUB_WORKSPACE" ] || fatal "GITHUB_WORKSPACE not set"
    cd "$GITHUB_WORKSPACE"

    case "$1" in
        refs/tags/*)        _tagged_release $(basename "$1");;
        refs/heads/*)       _pre_release $(basename "$1");;
        *)                  fatal "unsupported GIT_REF: $1";;
    esac
}

main "$@"
