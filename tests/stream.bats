#!/usr/bin/env bats

load helpers.sh

_curl()    { curl -qs "http://localhost:8881/${1}" ; }

setup_file() {
    command -v curl >/dev/null
    export NOTESIUM_DIR="$BATS_TEST_DIRNAME/fixtures"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
    [ "$(pidof notesium)" == "" ]
}

@test "stream: start with custom port and stop-on-idle" {
    run notesium web  --port=8881 --stop-on-idle &
    echo "$output"
}

@test "stream: list default" {
    run _curl 'api/stream/list'
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 8 ]
    assert_line "6421460b.md:1: book"
    assert_line "642146c7.md:1: physicist"
    assert_line "64214930.md:1: quantum mechanics"
    assert_line "64214a1d.md:1: richard feynman"
    assert_line "642176a6.md:1: lorem ipsum"
    assert_line "64217712.md:1: empty note"
    assert_line "64218087.md:1: surely you're joking mr. feynman"
    assert_line "64218088.md:1: albert einstein"
}

@test "stream: no command specified error" {
    run _curl 'api/stream/'
    echo "$output"
    [ $status -eq 0 ]
    [[ "${lines[0]}" =~ 'no command specified' ]]
}

@test "stream: unrecognized command error" {
    run _curl 'api/stream/foo'
    echo "$output"
    [ $status -eq 0 ]
    [[ "${lines[0]}" =~ 'unrecognized command: foo' ]]
}

@test "stream: stop by sending terminate signal" {
    # force stop otherwise bats will block until timeout (bats-core/issues/205)
    run pidof notesium
    echo "$output"
    echo "could not get pid"
    [ $status -eq 0 ]

    run kill "$(pidof notesium)"
    echo "$output"
    [ $status -eq 0 ]

    run pidof notesium
    echo "$output"
    [ $status -eq 1 ]
}

