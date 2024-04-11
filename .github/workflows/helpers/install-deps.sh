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

_install_tailwindcss() {
    info "installing tailwindcss ..."
    URL="https://github.com/tailwindlabs/tailwindcss/releases/download/v3.1.6/tailwindcss-linux-x64"
    HASH="ebb892a4749798f94a32915d50298c5fac54b6a5143fc49243d37343fe7b9227"
    curl -sLo $HOME/tailwindcss $URL
    chmod +x $HOME/tailwindcss
    echo -n "$HASH  $HOME/tailwindcss" | sha256sum --strict --check -
    sudo mv $HOME/tailwindcss /usr/local/bin/
}

main() {
    case $1 in -h|--help|help) usage;; esac
    command -v git >/dev/null || fatal "git not found"
    command -v curl >/dev/null || fatal "curl not found"
    command -v sha256sum >/dev/null || fatal "sha256sum not found"

    [ -n "$GITHUB_WORKSPACE" ] || fatal "GITHUB_WORKSPACE not set"
    cd "$GITHUB_WORKSPACE"

    _install_bats_core
    _install_tailwindcss
}

main "$@"
