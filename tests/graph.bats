#!/usr/bin/env bats

setup_file() {
    export NOTESIUM_DIR="$BATS_TEST_DIRNAME/fixtures"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

@test "graph: default" {
    run notesium.sh graph
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "file://$NOTESIUM_DIR/%:t" ]
    [ "${lines[1]}" == "-----" ]
    [ "${lines[2]}" == "id,title" ]
    [ "${lines[3]}" == "6421460b.md,book" ]
    [ "${lines[4]}" == "642176a6.md,lorem ipsum" ]
    [ "${lines[5]}" == "64217712.md,empty note" ]
    [ "${lines[6]}" == "64214a1d.md,richard feynman" ]
    [ "${lines[7]}" == "642146c7.md,physicist" ]
    [ "${lines[8]}" == "64218087.md,surely you're joking mr. feynman" ]
    [ "${lines[9]}" == "64218088.md,albert einstein" ]
    [ "${lines[10]}" == "64214930.md,quantum mechanics" ]
    [ "${lines[11]}" == "-----" ]
    [ "${lines[12]}" == "source,target" ]
    [ "${lines[13]}" == "64214a1d.md,642146c7.md" ]
    [ "${lines[14]}" == "64214a1d.md,64214930.md" ]
    [ "${lines[15]}" == "64218087.md,6421460b.md" ]
    [ "${lines[16]}" == "64218087.md,64214a1d.md" ]
    [ "${lines[17]}" == "64218087.md,12345678.md" ]
    [ "${lines[18]}" == "64218088.md,642146c7.md" ]
    [ "${lines[19]}" == "64218088.md,64214930.md" ]
}

@test "graph: href" {
    run notesium.sh graph --href='notesium://%:p:h/%:t'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "notesium://$NOTESIUM_DIR/%:t" ]
}

@test "graph: encoded url" {
    run notesium.sh graph --encoded-url
    echo "$output"
    [ $status -eq 0 ]
}
