#!/bin/sh
set -e

SCRIPT_NAME="$(basename "$0")"
fatal() { echo "[$SCRIPT_NAME] FATAL: $*" 1>&2; exit 1; }
info() { echo "[$SCRIPT_NAME] INFO: $*"; }

usage() {
cat<<EOF
Syntax: $SCRIPT_NAME
Helper script to install dependencies: bats-core
EOF
exit 1
}

_install_bats_core() {
    info "installing bats-core ..."
    URL="https://github.com/bats-core/bats-core.git"
    COMMIT_ID="b81de286448ae3a11e3342783dcdc1b08765a421"
    git clone $URL $HOME/bats-core
    cd $HOME/bats-core
    git checkout $COMMIT_ID
    sudo ./install.sh /usr/local
}

main() {
    case $1 in -h|--help|help) usage;; esac
    command -v git >/dev/null || fatal "git not found"

    [ -n "$GITHUB_WORKSPACE" ] || fatal "GITHUB_WORKSPACE not set"
    cd "$GITHUB_WORKSPACE"

    _install_bats_core
}

main "$@"
