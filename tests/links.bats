#!/usr/bin/env bats

load helpers.sh

setup_file() {
    export NOTESIUM_DIR="$BATS_TEST_DIRNAME/fixtures"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

@test "links: default without filename" {
    run notesium links
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 7 ]
    assert_line "64218088.md:3: albert einstein → physicist"
    assert_line "64218088.md:7: albert einstein → quantum mechanics"
    assert_line "64214a1d.md:3: richard feynman → physicist"
    assert_line "64214a1d.md:5: richard feynman → quantum mechanics"
    assert_line "64218087.md:3: surely you're joking mr. feynman → book"
    assert_line "64218087.md:3: surely you're joking mr. feynman → richard feynman"
    assert_line "64218087.md:3: surely you're joking mr. feynman → 12345678.md"
}

@test "links: default with filename" {
    run notesium links 64214a1d.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 3 ]
    assert_line "642146c7.md:1: outgoing physicist"
    assert_line "64214930.md:1: outgoing quantum mechanics"
    assert_line "64218087.md:3: incoming surely you're joking mr. feynman"
}

@test "links: outgoing with filename" {
    run notesium links --outgoing 64214a1d.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 2 ]
    assert_line "642146c7.md:1: physicist"
    assert_line "64214930.md:1: quantum mechanics"
}

@test "links: outgoing without filename" {
    run notesium links --outgoing
    echo "$output"
    [ $status -eq 1 ]
    [[ "${lines[0]}" =~ 'filename is required' ]]
}

@test "links: incoming with filename" {
    run notesium links --incoming 642146c7.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 2 ]
    assert_line "64218088.md:3: albert einstein"
    assert_line "64214a1d.md:3: richard feynman"
}

@test "links: incoming without filename" {
    run notesium links --incoming
    echo "$output"
    [ $status -eq 1 ]
    [[ "${lines[0]}" =~ 'filename is required' ]]
}

@test "links: incoming and outgoing with filename" {
    run notesium links --incoming --outgoing 64214a1d.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 3 ]
    assert_line "642146c7.md:1: outgoing physicist"
    assert_line "64214930.md:1: outgoing quantum mechanics"
    assert_line "64218087.md:3: incoming surely you're joking mr. feynman"
}

@test "links: incoming and outgoing without filename" {
    run notesium links --incoming --outgoing
    echo "$output"
    [ $status -eq 1 ]
    [[ "${lines[0]}" =~ 'filename is required' ]]
}

@test "links: dangling with filename" {
    run notesium links --dangling 64218087.md
    echo "$output"
    [ $status -eq 1 ]
    [[ "${lines[0]}" =~ 'filename not supported' ]]
}

@test "links: dangling without filename" {
    run notesium links --dangling
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "64218087.md:3: surely you're joking mr. feynman → 12345678.md" ]
}
