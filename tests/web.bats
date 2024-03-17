#!/usr/bin/env bats

load helpers.sh

_curl()    { curl -qs http://localhost:8881/${1} ; }
_curl_jq() { curl -qs http://localhost:8881/${1} | jq -r "${2}" ; }

setup_file() {
    command -v jq >/dev/null
    command -v curl >/dev/null
    export NOTESIUM_DIR="$BATS_TEST_DIRNAME/fixtures"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
    [ "$(pidof notesium)" == "" ]
}

@test "web: start with custom port and stop-on-idle" {
    run notesium web  --port=8881 --stop-on-idle &
    echo "$output"
}

@test "web: api/heartbeat" {
    run _curl 'api/heartbeat'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "Heartbeat received." ]
}

@test "web: api/notes count" {
    run _curl_jq 'api/notes' '. | length'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "8" ]
}

@test "web: api/notes filenames and titles" {
    run _curl_jq 'api/notes' '.[] | "\(.Filename) \(.Title)"'
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 8 ]
    assert_line "6421460b.md book"
    assert_line "642146c7.md physicist"
    assert_line "64214930.md quantum mechanics"
    assert_line "64214a1d.md richard feynman"
    assert_line "642176a6.md lorem ipsum"
    assert_line "64217712.md empty note"
    assert_line "64218087.md surely you're joking mr. feynman"
    assert_line "64218088.md albert einstein"
}

@test "web: api/notes specific note incoming link filename" {
    run _curl_jq 'api/notes' '.["64214a1d.md"].IncomingLinks[].Filename'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "64218087.md" ]
}

@test "web: api/notes specific note incoming link title" {
    run _curl_jq 'api/notes' '.["64214a1d.md"].IncomingLinks[].Title'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "surely you're joking mr. feynman" ]
}

@test "web: api/notes specific note outgoing link titles" {
    run _curl_jq 'api/notes' '.["64214a1d.md"].OutgoingLinks[].Title'
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 2 ]
    assert_line "physicist"
    assert_line "quantum mechanics"
}

@test "web: api/notes/filename content" {
    run _curl_jq 'api/notes/642146c7.md' '.Content'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "# physicist" ]
}

@test "web: api/notes/filename not found" {
    run _curl_jq 'api/notes/aaaaaaaa.md' '.Error'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "Note not found" ]
}

@test "web: stop by sending terminate signal" {
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

