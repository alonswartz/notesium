#!/usr/bin/env bats

_shellcheck_count() {
    shellcheck --format=gcc $SCRIPT | awk '{print $NF}' | sort | uniq -c
}

setup_file() {
    export SCRIPT="$(realpath $BATS_TEST_DIRNAME/../notesium.sh)"
}

@test "shellcheck: exclude" {
    command -v shellcheck >/dev/null || skip "not found"
    run shellcheck --exclude=SC2012,SC2035,SC2046,SC2068,SC2086 $SCRIPT
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "" ]
}

@test "shellcheck: count" {
    command -v shellcheck >/dev/null || skip "not found"
    run _shellcheck_count
    echo "$output"
    [ "${lines[0]}" == "      1 [SC2012]" ]
    [ "${lines[1]}" == "     29 [SC2035]" ]
    [ "${lines[2]}" == "      7 [SC2046]" ]
    [ "${lines[3]}" == "      7 [SC2068]" ]
    [ "${lines[4]}" == "      8 [SC2086]" ]
    [ "${lines[5]}" == "" ]
}

