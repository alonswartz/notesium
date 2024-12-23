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

@test "lines: filter case insensitive" {
    run notesium lines --filter='Einstein'
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 3 ]
    assert_line "64218088.md:1: # albert einstein"
    assert_line "64218088.md:3: albert einstein was a german-born theoretical [physicist](642146c7.md),"
    assert_line "64218088.md:5: physicists of all time. einstein is best known for developing the"
}

@test "lines: filter AND" {
    run notesium lines --filter='einstein albert'
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 2 ]
    assert_line "64218088.md:1: # albert einstein"
    assert_line "64218088.md:3: albert einstein was a german-born theoretical [physicist](642146c7.md),"
}

@test "lines: filter OR" {
    run notesium lines --filter='american|german'
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 2 ]
    assert_line "64214a1d.md:3: richard phillips feynman was an american theoretical [physicist](642146c7.md),"
    assert_line "64218088.md:3: albert einstein was a german-born theoretical [physicist](642146c7.md),"
}

@test "lines: filter NOT" {
    run notesium lines --filter='einstein !physicist'
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 1 ]
    assert_line "64218088.md:1: # albert einstein"
}

@test "lines: filter OR AND NOT" {
    run notesium lines --filter='theory|model quantum !development'
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 1 ]
    assert_line "64214a1d.md:5: [quantum mechanics](64214930.md), the theory of quantum electrodynamics,"
}

@test "lines: filter OR AND NOT and prefix title" {
    run notesium lines --filter='theory|model quantum !development' --prefix=title
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 1 ]
    assert_line "64214a1d.md:5: richard feynman [quantum mechanics](64214930.md), the theory of quantum electrodynamics,"
}
