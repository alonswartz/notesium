#!/usr/bin/env bats

setup_file() {
    [ -e "/tmp/notesium-test-corpus" ] && exit 1
    run mkdir /tmp/notesium-test-corpus
    run cp $BATS_TEST_DIRNAME/fixtures/6421460b.md /tmp/notesium-test-corpus/
    export NOTESIUM_DIR="/tmp/notesium-test-corpus"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

teardown_file() {
    run rm /tmp/notesium-test-corpus/6421460b.md
    run rmdir /tmp/notesium-test-corpus
}

@test "orphan2: list" {
    skip
    run notesium list
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "6421460b.md:1: book" ]
}

@test "orphan2: list labels" {
    skip
    run notesium list --labels
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "6421460b.md:1: book" ]
}

@test "orphan2: list prefix label" {
    skip
    run notesium list --prefix=label
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "6421460b.md:1: book" ]
}

@test "orphan2: list orphans" {
    skip
    run notesium list --orphans
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "6421460b.md:1: book" ]
}

@test "orphan2: list match" {
    skip
    run notesium list --match=foo
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan2: links" {
    skip
    run notesium links
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan2: links file" {
    skip
    run notesium links 6421460b.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan2: links outgoing" {
    skip
    run notesium links --outgoing 6421460b.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan2: links incoming" {
    skip
    run notesium links --incoming 6421460b.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan2: links dangling" {
    skip
    run notesium links --dangling
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan2: lines" {
    skip
    run notesium lines
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "6421460b.md:1: # book" ]
}

@test "orphan2: lines prefix title" {
    skip
    run notesium lines --prefix=title
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "6421460b.md:1: book # book" ]
}
