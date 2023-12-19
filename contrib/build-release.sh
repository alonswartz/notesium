#!/bin/sh
set -e

fatal() { echo "FATAL: $*" 1>&2; exit 1; }

usage() {
cat<<EOF
Usage: $(basename "$0")

EOF
exit 1
}

_build() {
    os="$1"
    arch="$2"
    # flags="-X main.version=$VERSION_GIT"
    flags="-s -w -X main.version=$VERSION_GIT"
    outfile="build/${VERSION_GIT}/notesium-${os}-${arch}"
    [ "$os" = "windows" ] && outfile="$outfile.exe"
    echo "info: $outfile ..."
    GOOS="$os" GOARCH="$arch" go build -o $outfile -ldflags "$flags"
}

_checksums() {
    cd build/${VERSION_GIT}
    echo "info: build/checksums.txt ..."
    sha256sum notesium-* | tee checksums.txt
    cd -
}

_verify_version() {
    echo "info: version.git:       $VERSION_GIT"
    echo "info: version.changelog: $VERSION_CHANGELOG"
    [ "$VERSION_GIT" = "$VERSION_CHANGELOG" ] && return 0
    return 1
}

_verify_branch() {
    branch="$(git rev-parse --abbrev-ref HEAD)"
    echo "info: branch: $branch"
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

_release_notes() {
    gh_url="https://github.com/alonswartz/notesium"
    echo "${gh_url}/releases/new?tag=v${VERSION_CHANGELOG}\n"

    anchor="$(echo $VERSION_CHANGELOG | sed 's/\.//g')"
    changelog="${gh_url}/blob/master/CHANGELOG.md#${anchor}"
    echo "The changelog for this release is available [here]($changelog).\n" 
    echo "Note: These binaries are not CI built, and are only provided for convenience.\n"

    echo "\n$(pwd)/build/${VERSION_GIT}"
    ls -lh build/${VERSION_GIT}
}

_ask() {
    echo "\n$@"
    read -p "Proceed anyway? [y/N]: " proceed
    [ "$proceed" != "y" ] && fatal "user abort"
    return 0
}

main() {
    case $1 in -h|--help|help) usage;; esac
    command -v go >/dev/null || fatal "go not found"
    command -v git >/dev/null || fatal "git not found"
    command -v bats >/dev/null || fatal "bats not found"
    command -v sha256sum >/dev/null || fatal "sha256sum not found"
    cd "$(dirname "$(dirname "$(realpath "$0")")")"

    [ -e "CHANGELOG.md" ] || fatal "CHANGELOG.md not found"
    VERSION_CHANGELOG="$(awk 'FNR==1{print $2}' CHANGELOG.md)"
    VERSION_GIT="$(git describe | sed 's/^v//; s/-/+/')"

    _verify_version || _ask "WARNING: version mismatch"
    _verify_branch || _ask "WARNING: branch not master"
    _verify_branch_clean || _ask "WARNING: branch is dirty"

    echo "info: web/graph/make.sh all\n"
    ./web/graph/make.sh all

    echo "info: web/app/make.sh all\n"
    ./web/app/make.sh all

    mkdir -p build/$VERSION_GIT
    _build "linux" "amd64"
    _build "darwin" "amd64"
    _build "windows" "amd64"
    _checksums

    _ask "WARNING: about to overwrite notesium binary and perform tests"
    echo "\ninfo: testing ${VERSION_GIT}/notesium-linux-amd64 ..."
    cp build/${VERSION_GIT}/notesium-linux-amd64 notesium
    bats tests/

    [ "$(./notesium version)" = "$VERSION_GIT" ] || fatal "VERSION CMD FAIL"
    _verify_version >/dev/null || fatal "VERSION MISMATCH - DO NOT RELEASE!"

    echo "info: release notes\n"
    _release_notes
}

main "$@"
