#!/usr/bin/env bats

setup_file() {
    export NOTESIUM_DIR="$BATS_TEST_DIRNAME/fixtures"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

@test "stats: default" {
    run notesium.sh stats
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "notes 8" ]
    [ "${lines[1]}" == "labels 2" ]
    [ "${lines[2]}" == "orphans 2" ]
    [ "${lines[3]}" == "links 7" ]
    [ "${lines[4]}" == "dangling 1" ]
    [ "${lines[5]}" == "lines 28" ]
    [ "${lines[6]}" == "words 213" ]
    [ "${lines[7]}" == "chars 1424" ]
}

@test "stats: fmtnum" {
    run notesium.sh stats --fmtnum
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "notes 8" ]
    [ "${lines[7]}" == "chars 1,424" ]
}

@test "stats: table" {
    run notesium.sh stats --table
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "notes     8" ]
    [ "${lines[7]}" == "chars     1424" ]
}

@test "stats: table fmtnum" {
    run notesium.sh stats --table --fmtnum
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "notes     8" ]
    [ "${lines[7]}" == "chars     1,424" ]
}

