#!/bin/sh
set -e

SCRIPT_NAME="$(basename "$0")"
fatal() { echo "[$SCRIPT_NAME] FATAL: $*" 1>&2; exit 1; }
info() { echo "[$SCRIPT_NAME] INFO: $*"; }

usage() {
cat<<EOF
Usage: $SCRIPT_NAME COMMAND [ARGS]

Commands:
  commits       Print commits as reference for new changelog entry
  build         Mimic gh-action build and test
  tag SEMVER    Verify, tag release and push to trigger gh-action (vX.Y.Z)
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

_verify_gitver_matches_changelog() {
    info "verify gitversion matches changelog ..."
    [ -e "CHANGELOG.md" ] || fatal "CHANGELOG.md not found"
    version_changelog="$(awk 'FNR==1{print $2}' CHANGELOG.md)"
    version_git="$(git describe --tags | sed 's/^v//; s/-/+/')"
    [ "${version_changelog}" = "${version_git}" ] && return 0
    return 1
}

_verify_branch_master() {
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
    gh="https://api.github.com/repos/alonswartz/notesium"
    remote_sha="$(curl -s "$gh/branches/master" | jq -r '.commit.sha')"
    local_sha="$(git rev-parse HEAD)"
    [ "$local_sha" = "$remote_sha" ] && return 0
    echo "local_sha: $local_sha"
    echo "remote_sha: $remote_sha"
    return 1
}

print_commits() {
    export GITHUB_WORKSPACE="$(pwd)"
    gref="refs/heads/$(git rev-parse --abbrev-ref HEAD)"
    .github/workflows/helpers/release-notes.sh $gref
}

build_release() {
    export GITHUB_WORKSPACE="$(pwd)"

    version_git="$(git describe --tags | sed 's/^v//; s/-/+/')"
    [ -n "$version_git" ] || fatal "could not determine version_git"

    version_changelog="$(awk 'FNR==1{print $2}' CHANGELOG.md)"
    [ -n "$version_changelog" ] || fatal "could not determine version_chl"

    outdir="build/$version_git"
    [ -e "$outdir" ] && fatal "$outdir already exists"

    info "version.git:       $version_git"
    info "version.changelog: $version_changelog"
    if [ "${version_git}" = "${version_changelog}" ]; then
        gref="refs/tags/v${version_git}"
    else
        gref="refs/heads/$(git rev-parse --abbrev-ref HEAD)"
        _ask "WARNING: version mismatch"
    fi

    _verify_branch_master || _ask "WARNING: branch not master"
    _verify_branch_clean || _ask "WARNING: branch is dirty"

    info "Build web"
    ./web/app/make.sh all

    info "Build binaries"
    .github/workflows/helpers/build-bin.sh $outdir/ all

    info "Run tests"
    .github/workflows/helpers/run-tests.sh $outdir/notesium-linux-amd64

    info "Generate release notes"
    .github/workflows/helpers/release-notes.sh $gref > $outdir/release-notes.md

    info "$outdir/"
    ls -lh $outdir/
}

tag_release() {
    command -v jq >/dev/null || fatal "jq not found"
    command -v curl >/dev/null || fatal "curl not found"

    REQUESTED_TAG="$1"
    [ -n "$REQUESTED_TAG" ] || fatal "REQUESTED_TAG not specified"

    _verify_branch_clean || _ask "WARNING: branch is dirty"
    _verify_tag_does_not_exist || fatal "tag already exists"
    _verify_tag_matches_changelog || fatal "tag changelog mismatch"
    _verify_branch_master || fatal "branch not master"
    _verify_changelog_diff || fatal "changelog has changes"
    _verify_local_remote || fatal "local_remote mismatch"
    _verify_actual_remote || fatal "actual_remote mismatch"

    _ask "WARNING: about to create tag: $REQUESTED_TAG"
    git tag "$REQUESTED_TAG" -a -m "$REQUESTED_TAG" || fatal "tagging failed"

    _verify_gitver_matches_changelog || fatal "gitversion changelog mismatch"

    _ask "WARNING: about to push tag: $REQUESTED_TAG"
    git push github "$REQUESTED_TAG" || fatal "pushing tag failed"

    echo "https://github.com/alonswartz/notesium/actions"
    echo "https://github.com/alonswartz/notesium/releases"
}

main() {
    case $1 in ''|-h|--help|help) usage;; esac
    cd "$(dirname "$(dirname "$(realpath "$0")")")"

    case $1 in
        commits)    shift; print_commits $@;;
        build)      shift; build_release $@;;
        tag)        shift; tag_release $@;;
        *)          fatal "unrecognized command: $1";;
    esac
}

main "$@"
