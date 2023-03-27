#!/usr/bin/env bats

setup_file() {
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

@test "cli: print usage if no arguments specified" {
    run notesium.sh
    echo "$output"
    [ $status -eq 1 ]
    [ "${lines[0]}" == 'Usage: notesium.sh COMMAND [OPTIONS]' ]
}

@test "cli: print usage if -h --help help" {
    run notesium.sh -h
    echo "$output"
    [ $status -eq 1 ]
    [ "${lines[0]}" == 'Usage: notesium.sh COMMAND [OPTIONS]' ]

    run notesium.sh --help
    echo "$output"
    [ $status -eq 1 ]
    [ "${lines[0]}" == 'Usage: notesium.sh COMMAND [OPTIONS]' ]

    run notesium.sh help
    echo "$output"
    [ $status -eq 1 ]
    [ "${lines[0]}" == 'Usage: notesium.sh COMMAND [OPTIONS]' ]
}

@test "cli: non-existent command fatal error" {
    run notesium.sh non-existent
    echo "$output"
    [ $status -eq 1 ]
    [ "${lines[0]}" == 'Fatal: unrecognized command: non-existent' ]
}

@test "cli: non-existent option fatal error" {
    run notesium.sh --non-existent
    echo "$output"
    [ $status -eq 1 ]
    [ "${lines[0]}" == 'Fatal: unrecognized option: --non-existent' ]
}

