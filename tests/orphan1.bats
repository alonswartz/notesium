#!/usr/bin/env bats

setup_file() {
    [ -e "/tmp/notesium-test-corpus" ] && exit 1
    run mkdir /tmp/notesium-test-corpus
    run cp $BATS_TEST_DIRNAME/fixtures/3ec9906f.md /tmp/notesium-test-corpus/
    export NOTESIUM_DIR="/tmp/notesium-test-corpus"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

teardown_file() {
    run rm /tmp/notesium-test-corpus/3ec9906f.md
    run rmdir /tmp/notesium-test-corpus
}

@test "orphan1: list" {
    run notesium.sh list
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "3ec9906f.md:1: empty note" ]
}

@test "orphan1: list labels" {
    run notesium.sh list --labels
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan1: list prefix label" {
    run notesium.sh list --prefix=label
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "3ec9906f.md:1: empty note" ]
}

@test "orphan1: list orphans" {
    run notesium.sh list --orphans
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '3ec9906f.md:1: empty note' ]
}

@test "orphan1: list match" {
    run notesium.sh list --match=foo
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan1: links" {
    run notesium.sh links
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan1: links file" {
    run notesium.sh links 3ec9906f.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan1: links outgoing" {
    run notesium.sh links --outgoing 3ec9906f.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan1: links incoming" {
    run notesium.sh links --incoming 3ec9906f.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan1: links dangling" {
    run notesium.sh links --dangling
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan1: lines" {
    run notesium.sh lines
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '3ec9906f.md:1: # empty note' ]
}

@test "orphan1: lines prefix title" {
    run notesium.sh lines --prefix=title
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '3ec9906f.md:1: empty note # empty note' ]
}
