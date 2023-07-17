#!/usr/bin/env bats

load helpers.sh

setup_file() {
    export NOTESIUM_DIR="$BATS_TEST_DIRNAME/fixtures"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

@test "extract: list files" {
    run notesium extract
    echo "$output"
    [ $status -eq 0 ]
    assert_line "completion.bash"
    assert_line "web/graph/index.html"
}

@test "extract: print file content" {
    run notesium extract web/graph/index.html
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "<!DOCTYPE html>" ]
}
