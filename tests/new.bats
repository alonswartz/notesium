#!/usr/bin/env bats

setup_file() {
    [ -e "/tmp/notesium-test-corpus" ] && exit 1
    run mkdir /tmp/notesium-test-corpus
    export NOTESIUM_DIR="/tmp/notesium-test-corpus"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

teardown_file() {
    run rmdir /tmp/notesium-test-corpus
}

@test "new: dirname equal to NOTESIUM_DIR realpath" {
    run notesium new
    echo "$output"
    [ $status -eq 0 ]
    [ "$(dirname $output)" == "/tmp/notesium-test-corpus" ]
}

@test "new: basename is 8 chars plus .md extension" {
    run notesium new
    echo "$output"
    [ $status -eq 0 ]
    [ "$(basename $output | tr -d '\n' | wc -c)" == "11" ]
    [ "$(basename --suffix=.md $output | tr -d '\n' | wc -c)" == "8" ]
}

@test "new: basename is hex for now epoch (within 10s range)" {
    run notesium new
    echo "$output"
    [ $status -eq 0 ]
    epoch="$(printf '%d' 0x$(basename --suffix=.md $output))"
    [ "$epoch" -gt "$(date -d "-5 seconds" +%s)" ]
    [ "$epoch" -lt "$(date -d "+5 seconds" +%s)" ]
}

@test "new: basename is hex for specified ctime epoch" {
    run notesium new --ctime=2023-01-16T05:05:00
    echo "$output"
    [ $status -eq 0 ]
    epoch="$(printf '%d' 0x$(basename --suffix=.md $output))"
    [ "$(date --date=@${epoch} '+%FT%T')" == "2023-01-16T05:05:00" ]
}

@test "new: verbose output for specified ctime" {
    run notesium new --ctime=2023-01-16T05:05:00 --verbose
    echo "$output"
    [ "${lines[0]}" == "path:/tmp/notesium-test-corpus/63c4bedc.md" ]
    [ "${lines[1]}" == "filename:63c4bedc.md" ]
    [ "${lines[2]}" == "epoch:1673838300" ]
    [ "${lines[3]}" == "ctime:$(date --date=@1673838300 '+%FT%T%:z')" ]
}

@test "new: invalid specified ctime" {
    run notesium new --ctime=2023-01-16
    echo "$output"
    [ $status -eq 1 ]
}
