#!/bin/sh
set -e

fatal() { echo "Fatal: $*" 1>&2; exit 1; }

usage() {
cat<<EOF
Usage: $(basename "$0") COMMAND

Commands:
  changelog         Print changelog section reference for new patch version
  tag               Print commands for new version tagging

EOF
exit 1
}

_changelog() {
    t_old="$(git tag --sort=committerdate --list | tail -1)"
    t_new="$(echo "$t_old" | awk -F "." -vOFS="." '{$3++; print $1, $2, $3}')"
    v_new="$(echo "$t_new" | sed 's/^v//')"
    echo "## $v_new\n"
    git --no-pager log ${t_old}..HEAD --reverse --pretty=format:'- %s'
    echo "\n"
}

_tag() {
    [ -e "CHANGELOG.md" ] || "CHANGELOG.md does not exist"
    t_new="v$(awk 'FNR==1{print $2}' CHANGELOG.md)"
    t_old="$(git tag --sort=committerdate --list | tail -1)"
    [ "$t_old" = "$t_new" ] && fatal "changelog and latest tag match: $t_old"
    echo "cd $(pwd)"
    echo "git tag $t_new -a -m \"$t_new\""
    echo "git push $(git remote show) $t_new"
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
