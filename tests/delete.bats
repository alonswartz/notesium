#!/usr/bin/env bats

load helpers.sh

URL="http://localhost:8881"
_get_jq()    { curl -qs ${URL}/${1} | jq -r "${2}" ; }
_delete_jq() { curl -qs -X DELETE -d "${2}" ${URL}/${1} | jq -r "${3}" ; }

setup_file() {
    command -v jq >/dev/null
    command -v curl >/dev/null
    [ "$(pgrep -x notesium)" == "" ]
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

@test "delete: start with custom port, stop-on-idle, writable" {
    run notesium web  --port=8881 --stop-on-idle --writable &
    echo "$output"
}

@test "delete: note that does not exist" {
    run _delete_jq 'api/notes/aaaaaaaa.md' '{"LastMtime": "2023-01-16T05:05:00+02:00"}' '.Error'
    echo "$output"
    [ "${lines[0]}" == "Note not found" ]
}

@test "delete: note with incorrect last-mtime" {
    run _delete_jq 'api/notes/642146c7.md' '{"LastMtime": "2023-01-16T05:05:00+02:00"}' '.Error'
    echo "$output"
    [ "${lines[0]}" == "Refusing to delete. File changed on disk." ]
}

@test "delete: note with malformed last-mtime" {
    run _delete_jq 'api/notes/642146c7.md' '{"LastMtime": "2023-01-16"}' '.Code'
    echo "$output"
    [ "${lines[0]}" == "400" ]
}

@test "delete: note with incoming links" {
    run _get_jq 'api/notes/642146c7.md' '.Mtime'
    LastMtime="$output"
    echo "$output"
    [ $status -eq 0 ]

    run _delete_jq 'api/notes/642146c7.md' '{"LastMtime": "'"$LastMtime"'"}' '.Error'
    echo "$output"
    [ "${lines[0]}" == "Refusing to delete. Note has IncomingLinks." ]
}

@test "delete: verify incoming links of linked note pre deletion" {
    run _get_jq 'api/notes/642146c7.md' '.IncomingLinks | length'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "2" ]
}

@test "delete: note without incoming links" {
    run _get_jq 'api/notes/64218088.md' '.Mtime'
    LastMtime="$output"
    echo "$output"
    [ $status -eq 0 ]

    run _delete_jq 'api/notes/64218088.md' '{"LastMtime": "'"$LastMtime"'"}' '.Deleted'
    echo "$output"
    [ "${lines[0]}" == "true" ]
}

@test "delete: verify incoming links of linked note post deletion" {
    run _get_jq 'api/notes/642146c7.md' '.IncomingLinks | length'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "1" ]
}

@test "delete: verify note removed from cache" {
    run _get_jq 'api/notes/64218088.md' '.Error'
    echo "$output"
    [ "${lines[0]}" == "Note not found" ]
    [ $status -eq 0 ]
}

@test "delete: verify note deleted on disk" {
    run cat $NOTESIUM_DIR/64218088.md
    echo "$output"
    [ $status -eq 1 ]
}

@test "delete: stop by sending terminate signal" {
    # force stop otherwise bats will block until timeout (bats-core/issues/205)
    run pgrep -x notesium
    echo "$output"
    echo "could not get pid"
    [ $status -eq 0 ]

    run kill "$(pgrep -x notesium)"
    echo "$output"
    [ $status -eq 0 ]

    run pgrep -x notesium
    echo "$output"
    [ $status -eq 1 ]
}

