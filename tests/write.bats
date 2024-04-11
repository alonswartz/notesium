#!/usr/bin/env bats

load helpers.sh

URL="http://localhost:8881"
_get()      { curl -qs ${URL}/${1} ; }
_get_jq()   { curl -qs ${URL}/${1} | jq -r "${2}" ; }
_post()     { curl -qs -X POST -d "${2}" ${URL}/${1} ; }
_post_jq()  { curl -qs -X POST -d "${2}" ${URL}/${1} | jq -r "${3}" ; }
_patch()    { curl -qs -X PATCH -d "${2}" ${URL}/${1} ; }
_patch_jq() { curl -qs -X PATCH -d "${2}" ${URL}/${1} | jq -r "${3}" ; }

_set_deterministic_mtimes() {
    touch -m -t 202301250505 "/tmp/notesium-test-corpus/64218088.md"
    touch -m -t 202301240505 "/tmp/notesium-test-corpus/64217712.md"
    touch -m -t 202301240504 "/tmp/notesium-test-corpus/642146c7.md"
    touch -m -t 202301220505 "/tmp/notesium-test-corpus/642176a6.md"
    touch -m -t 202301220504 "/tmp/notesium-test-corpus/64214930.md"
    touch -m -t 202301180505 "/tmp/notesium-test-corpus/64218087.md"
    touch -m -t 202301160505 "/tmp/notesium-test-corpus/64214a1d.md"
    touch -m -t 202301130505 "/tmp/notesium-test-corpus/6421460b.md"
}

setup_file() {
    command -v jq >/dev/null
    command -v curl >/dev/null
    [ "$(pidof notesium)" == "" ]
    [ -e "/tmp/notesium-test-corpus" ] && exit 1
    run mkdir /tmp/notesium-test-corpus
    run cp $BATS_TEST_DIRNAME/fixtures/*.md /tmp/notesium-test-corpus/
    run _set_deterministic_mtimes
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

@test "write: start with custom port, stop-on-idle, NOT writable" {
    run notesium web  --port=8881 --stop-on-idle &
    echo "$output"
}

@test "write: change note should fail" {
    run _patch_jq 'api/notes/64214a1d.md' '{"Content": "# mr. richard feynman"}' '.Error'
    echo "$output"
    [ "${lines[0]}" == "NOTESIUM_DIR is set to read-only mode" ]
}

@test "write: stop NOT writable by sending terminate signal" {
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

@test "write: start with custom port, stop-on-idle, writable" {
    run notesium web  --port=8881 --stop-on-idle --writable &
    echo "$output"
}

@test "write: verify incoming links pre change" {
    run _get_jq 'api/notes/642146c7.md' '.IncomingLinks | length'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "2" ]
}

@test "write: change note" {
    run _get_jq 'api/notes/64214a1d.md' '.Mtime'
    LastMtime="$output"
    echo "$output"
    [ $status -eq 0 ]

    run _patch_jq 'api/notes/64214a1d.md' '{"Content": "# mr. richard feynman", "LastMtime": "'"$LastMtime"'"}' '.Title'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "mr. richard feynman" ]
}

@test "write: verify note changed in cache" {
    run _get_jq 'api/notes/64214a1d.md' '.Content'
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
    run _get_jq 'api/notes/642146c7.md' '.IncomingLinks | length'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "1" ]
}

@test "write: change note with incorrect mtime" {
    run _patch_jq 'api/notes/64214a1d.md' '{"Content": "# mr. richard feynman", "LastMtime": "2023-01-16T05:05:00+02:00"}' '.Error'
    echo "$output"
    [ "${lines[0]}" == "Refusing to overwrite. File changed on disk." ]
}

@test "write: change note without specifying params" {
    run _patch_jq 'api/notes/64214a1d.md' '{}' '.Error'
    echo "$output"
    [ "${lines[0]}" == "Content field is required" ]
}

@test "write: change note that does not exist" {
    run _patch_jq 'api/notes/aaaaaaaa.md' '{"Content": "# test", "LastMtime": "2023-01-16T05:05:00+02:00"}' '.Error'
    echo "$output"
    [ "${lines[0]}" == "Note not found" ]
}

@test "write: new note" {
    run _post_jq 'api/notes/' '{"Content": "# new note"}' '.Title'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "new note" ]
}

@test "write: new note with filename" {
    run _post_jq 'api/notes/aaaaaaaa.md' '{"Content": "# new note"}' '.Error'
    echo "$output"
    [ "${lines[0]}" == "Filename should not be specified" ]
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

