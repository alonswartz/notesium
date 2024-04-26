#!/bin/sh
set -e

SCRIPT_NAME="$(basename "$0")"
fatal() { echo "[$SCRIPT_NAME] FATAL: $*" 1>&2; exit 1; }
info() { echo "[$SCRIPT_NAME] INFO: $*"; }

usage() {
cat<<EOF
Usage: $SCRIPT_NAME vX.Y.Z
Helper script to tag release version with verification
EOF
exit 1
}

_ask() {
    echo "\n$@"
    read -p "Proceed anyway? [y/N]: " proceed
    [ "$proceed" != "y" ] && fatal "user abort"
    return 0
}

_verify_tag_does_not_exist() {
    info "verify requested tag does not exist ..."
    git tag --list | grep -q "^${REQUESTED_TAG}$" && return 1
    return 0
}

_verify_tag_matches_changelog() {
    info "verify requested tag matches changelog ..."
    [ -e "CHANGELOG.md" ] || fatal "CHANGELOG.md not found"
    version_changelog="$(awk 'FNR==1{print $2}' CHANGELOG.md)"
    [ "v${version_changelog}" = "${REQUESTED_TAG}" ] && return 0
    return 1
}

_verify_gitversion_changelog() {
    info "verify gitversion matches changelog ..."
    [ -e "CHANGELOG.md" ] || fatal "CHANGELOG.md not found"
    version_changelog="$(awk 'FNR==1{print $2}' CHANGELOG.md)"
    version_git="$(git describe | sed 's/^v//; s/-/+/')"
    [ "${version_changelog}" = "${version_git}" ] && return 0
    return 1
}

_verify_branch() {
    info "verify branch is master ..."
    branch="$(git rev-parse --abbrev-ref HEAD)"
    [ "$branch" = "master" ] && return 0
    return 1
}

_verify_branch_clean() {
    info "verify branch is clean ..."
    if [ "$(git status -s)" ]; then
        git status -s
        return 1
    fi
    return 0
}

_verify_changelog_diff() {
    info "verify changelog diff ..."
    if [ "$(git --no-pager diff CHANGELOG.md)" ]; then
        git --no-pager diff CHANGELOG.md
        return 1
    fi
    return 0
}

_verify_local_remote() {
    info "verify HEAD matches local remote ..."
    remote_sha="$(git rev-parse remotes/github/master)"
    local_sha="$(git rev-parse HEAD)"
    [ "$local_sha" = "$remote_sha" ] && return 0
    echo "local_sha: $local_sha"
    echo "remote_sha: $remote_sha"
    return 1
}

_verify_actual_remote() {
    info "verify HEAD matches actual remote ..."
    url="https://api.github.com/repos/alonswartz/notesium/branches/master"
    remote_sha=$(curl -s "$url" | jq -r '.commit.sha')
    local_sha="$(git rev-parse HEAD)"
    [ "$local_sha" = "$remote_sha" ] && return 0
    echo "local_sha: $local_sha"
    echo "remote_sha: $remote_sha"
    return 1
}

main() {
    case $1 in ''|-h|--help|help) usage;; esac
    command -v jq >/dev/null || fatal "jq not found"
    command -v git >/dev/null || fatal "git not found"
    command -v curl >/dev/null || fatal "curl not found"
    cd "$(dirname "$(dirname "$(realpath "$0")")")"

    REQUESTED_TAG="$1"

    _verify_branch_clean || _ask "WARNING: branch is dirty"
    _verify_tag_does_not_exist || fatal "tag already exists"
    _verify_tag_matches_changelog || fatal "tag changelog mismatch"
    _verify_branch || fatal "branch not master"
    _verify_changelog_diff || fatal "changelog has changes"
    _verify_local_remote || fatal "local_remote mismatch"
    _verify_actual_remote || fatal "actual_remote mismatch"

    _ask "WARNING: about to create tag: $REQUESTED_TAG"
    git tag "$REQUESTED_TAG" -a -m "$REQUESTED_TAG" || fatal "tagging failed"

    _verify_gitversion_changelog || fatal "gitversion changelog mismatch"

    _ask "WARNING: about to push tag: $REQUESTED_TAG"
    git push github "$REQUESTED_TAG" || fatal "pushing tag failed"

    echo "https://github.com/alonswartz/notesium/actions"
    echo "https://github.com/alonswartz/notesium/releases"
}

main "$@"
