#!/usr/bin/env bats

setup_file() {
    [ -e "/tmp/notesium-test-corpus" ] && exit 1
    run mkdir /tmp/notesium-test-corpus
    run cp $BATS_TEST_DIRNAME/fixtures/64217712.md /tmp/notesium-test-corpus/
    export NOTESIUM_DIR="/tmp/notesium-test-corpus"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

teardown_file() {
    run rm /tmp/notesium-test-corpus/64217712.md
    run rmdir /tmp/notesium-test-corpus
}

@test "orphan1: list" {
    skip
    run notesium list
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "64217712.md:1: empty note" ]
}

@test "orphan1: list labels" {
    skip
    run notesium list --labels
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan1: list prefix label" {
    skip
    run notesium list --prefix=label
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "64217712.md:1: empty note" ]
}

@test "orphan1: list orphans" {
    skip
    run notesium list --orphans
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '64217712.md:1: empty note' ]
}

@test "orphan1: list match" {
    skip
    run notesium list --match=foo
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan1: links" {
    skip
    run notesium links
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan1: links file" {
    skip
    run notesium links 64217712.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan1: links outgoing" {
    skip
    run notesium links --outgoing 64217712.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan1: links incoming" {
    skip
    run notesium links --incoming 64217712.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan1: links dangling" {
    skip
    run notesium links --dangling
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '' ]
}

@test "orphan1: lines" {
    skip
    run notesium lines
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '64217712.md:1: # empty note' ]
}

@test "orphan1: lines prefix title" {
    skip
    run notesium lines --prefix=title
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '64217712.md:1: empty note # empty note' ]
}
