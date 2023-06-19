#!/usr/bin/env bats

load helpers.sh

setup_file() {
    export NOTESIUM_DIR="$BATS_TEST_DIRNAME/fixtures"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

@test "graph: default" {
    run notesium graph
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 20 ]
    [ "${lines[0]}" == "file://$NOTESIUM_DIR/%:t" ]
    [ "${lines[1]}" == "-----" ]
    [ "${lines[2]}" == "id,title" ]
    assert_line "6421460b.md,book"
    assert_line "642146c7.md,physicist"
    assert_line "64214930.md,quantum mechanics"
    assert_line "64214a1d.md,richard feynman"
    assert_line "642176a6.md,lorem ipsum"
    assert_line "64217712.md,empty note"
    assert_line "64218087.md,surely you're joking mr. feynman"
    assert_line "64218088.md,albert einstein"
    [ "${lines[11]}" == "-----" ]
    [ "${lines[12]}" == "source,target" ]
    assert_line "64214a1d.md,642146c7.md"
    assert_line "64214a1d.md,64214930.md"
    assert_line "64218087.md,6421460b.md"
    assert_line "64218087.md,64214a1d.md"
    assert_line "64218087.md,12345678.md"
    assert_line "64218088.md,642146c7.md"
    assert_line "64218088.md,64214930.md"
}

@test "graph: href" {
    run notesium graph --href='notesium://%:p:h/%:t'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "notesium://$NOTESIUM_DIR/%:t" ]
}

@test "graph: encoded url" {
    run notesium graph --encoded-url
    echo "$output"
    [ $status -eq 0 ]
}
