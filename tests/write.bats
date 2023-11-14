#!/usr/bin/env bats

load helpers.sh

_curl()    { curl -qs http://localhost:8881/${1} ; }
_curl_jq() { curl -qs http://localhost:8881/${1} | jq -r "${2}" ; }
_post()    { curl -qs -X POST -d "${2}" http://localhost:8881/${1} ; }
_post_jq() { curl -qs -X POST -d "${2}" http://localhost:8881/${1} | jq ; }

setup_file() {
    command -v jq >/dev/null
    command -v curl >/dev/null
    [ "$(pidof notesium)" == "" ]
    [ -e "/tmp/notesium-test-corpus" ] && exit 1
    run mkdir /tmp/notesium-test-corpus
    run cp $BATS_TEST_DIRNAME/fixtures/*.md /tmp/notesium-test-corpus/
    export NOTESIUM_DIR="/tmp/notesium-test-corpus"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

teardown_file() {
    if [ "$PAUSE" ]; then
        echo "# NOTESIUM_DIR=$NOTESIUM_DIR" >&3
        echo "# PAUSED: Press enter to continue with teardown... " >&3
        run read -p "paused: " choice
    fi
    run rm /tmp/notesium-test-corpus/*.md
    run rmdir /tmp/notesium-test-corpus
}

@test "write: start with custom port, stop-on-idle" {
    run notesium web  --port=8881 --stop-on-idle &
    echo "$output"
}

@test "write: verify incoming links pre change" {
    run _curl_jq 'api/notes/642146c7.md' '.IncomingLinks | length'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "2" ]
}

@test "write: change note" {
    run _post_jq 'api/notes/64214a1d.md' '{"Content": "# mr. richard feynman"}'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[2]}" == '  "Title": "mr. richard feynman",' ]
}

@test "write: verify note changed in cache" {
    run _curl_jq 'api/notes/64214a1d.md' '.Content'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "# mr. richard feynman" ]
}

@test "write: verify note changed on disk" {
    run cat $NOTESIUM_DIR/64214a1d.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "# mr. richard feynman" ]
}

@test "write: verify incoming links post change" {
    run _curl_jq 'api/notes/642146c7.md' '.IncomingLinks | length'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "1" ]
}

@test "write: change note without specifying content" {
    run _post 'api/notes/64214a1d.md' '{"Content": ""}'
    echo "$output"
    [ "${lines[0]}" == "Content field is required" ]
}

@test "write: change note that does not exist" {
    run _post 'api/notes/xxxxxxxx.md' '{"Content": "# test"}'
    echo "$output"
    [ "${lines[0]}" == "Note not found" ]
}

@test "write: stop by sending terminate signal" {
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

