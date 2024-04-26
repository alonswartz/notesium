#!/bin/sh
set -e

fatal() { echo "Fatal: $*" 1>&2; exit 1; }

usage() {
cat<<EOF
Usage: $(basename "$0") COMMAND

Commands:
  changelog         Print commits as reference for new changelog entry
  tag               Print commands for new version tagging

EOF
exit 1
}

_changelog() {
    branch="$(git rev-parse --abbrev-ref HEAD)"
    GITHUB_WORKSPACE="$(pwd)" \
        .github/workflows/helpers/release-notes.sh refs/heads/${branch}
}

_tag() {
    fatal "deprecated: use contrib/tag-release.sh"
}

main() {
    case $1 in ''|-h|--help|help) usage;; esac
    command -v git >/dev/null || fatal "git not found"
    cd "$(dirname "$(dirname "$(realpath "$0")")")"

    case $1 in
        changelog)              _changelog $@;;
        tag)                    _tag $@;;
        *)                      fatal "unrecognized command: $1";;
    esac
}

main "$@"
