#!/usr/bin/env bats

setup_file() {
    export NOTESIUM_DIR="$BATS_TEST_DIRNAME/fixtures"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

@test "lines: default" {
    run notesium.sh lines
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "6421460b.md:1: # book" ]
    [ "${lines[1]}" == "642146c7.md:1: # physicist" ]
    [ "${lines[3]}" == "64214930.md:3: a fundamental theory in physics that provides a description of the" ]
    [ "${lines[5]}" == "64214930.md:5: particles." ]
}

@test "lines: prefix title" {
    run notesium.sh lines --prefix=title
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "6421460b.md:1: book # book" ]
    [ "${lines[1]}" == "642146c7.md:1: physicist # physicist" ]
    [ "${lines[3]}" == "64214930.md:3: quantum mechanics a fundamental theory in physics that provides a description of the" ]
}
