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
    skip
    run notesium links 64214a1d.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "642146c7.md:1: outgoing physicist" ]
    [ "${lines[1]}" == "64214930.md:1: outgoing quantum mechanics" ]
    [ "${lines[2]}" == "64218087.md:3: incoming surely you're joking mr. feynman" ]
}

@test "links: outgoing with filename" {
    skip
    run notesium links --outgoing 64214a1d.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "642146c7.md:1: physicist" ]
    [ "${lines[1]}" == "64214930.md:1: quantum mechanics" ]
}

@test "links: outgoing without filename" {
    skip
    run notesium links --outgoing
    echo "$output"
    [ $status -eq 1 ]
    [ "${lines[0]}" == "Fatal: filename not specified" ]
}

@test "links: incoming with filename" {
    skip
    run notesium links --incoming 642146c7.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "64218088.md:3: albert einstein" ]
    [ "${lines[1]}" == "64214a1d.md:3: richard feynman" ]
}

@test "links: incoming without filename" {
    skip
    run notesium links --incoming
    echo "$output"
    [ "${lines[0]}" == "Fatal: filename not specified" ]
}

@test "links: incoming and outgoing with filename" {
    skip
    run notesium links --incoming --outgoing 64214a1d.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "642146c7.md:1: outgoing physicist" ]
    [ "${lines[1]}" == "64214930.md:1: outgoing quantum mechanics" ]
    [ "${lines[2]}" == "64218087.md:3: incoming surely you're joking mr. feynman" ]
}

@test "links: incoming and outgoing without filename" {
    skip
    run notesium links --incoming --outgoing
    echo "$output"
    [ $status -eq 1 ]
    [ "${lines[0]}" == "Fatal: filename not specified" ]
}

@test "links: dangling with filename" {
    skip
    run notesium links --dangling 64218087.md
    echo "$output"
    [ $status -eq 1 ]
    [ "${lines[0]}" == "Fatal: dangling filename not supported" ]
}

@test "links: dangling without filename" {
    skip
    run notesium links --dangling
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "64218087.md:3: surely you're joking mr. feynman → 12345678.md" ]
}
