#!/usr/bin/env bats

load helpers.sh

setup_file() {
    export NOTESIUM_DIR="$BATS_TEST_DIRNAME/fixtures"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

@test "lines: default" {
    run notesium lines
    echo "$output"
    [ $status -eq 0 ]
    assert_line "6421460b.md:1: # book"
    assert_line "642146c7.md:1: # physicist"
    assert_line "64214930.md:3: a fundamental theory in physics that provides a description of the"
    assert_line "64214930.md:5: particles."
}

@test "lines: prefix title" {
    run notesium lines --prefix=title
    echo "$output"
    [ $status -eq 0 ]
    assert_line "6421460b.md:1: book # book"
    assert_line "642146c7.md:1: physicist # physicist"
    assert_line "64214930.md:3: quantum mechanics a fundamental theory in physics that provides a description of the"
}
