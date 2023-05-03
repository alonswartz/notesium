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
    [ "${lines[3]}" == "0c8bea98.md,book" ]
    [ "${lines[4]}" == "26f89821.md,lorem ipsum" ]
    [ "${lines[5]}" == "3ec9906f.md,empty note" ]
    [ "${lines[6]}" == "406c52f1.md,richard feynman" ]
    [ "${lines[7]}" == "572878f1.md,physicist" ]
    [ "${lines[8]}" == "5c13e273.md,surely you're joking mr. feynman" ]
    [ "${lines[9]}" == "b0457228.md,albert einstein" ]
    [ "${lines[10]}" == "ce5f6bd5.md,quantum mechanics" ]
    [ "${lines[11]}" == "-----" ]
    [ "${lines[12]}" == "source,target" ]
    [ "${lines[13]}" == "406c52f1.md,572878f1.md" ]
    [ "${lines[14]}" == "406c52f1.md,ce5f6bd5.md" ]
    [ "${lines[15]}" == "5c13e273.md,0c8bea98.md" ]
    [ "${lines[16]}" == "5c13e273.md,406c52f1.md" ]
    [ "${lines[17]}" == "5c13e273.md,12345678.md" ]
    [ "${lines[18]}" == "b0457228.md,572878f1.md" ]
    [ "${lines[19]}" == "b0457228.md,ce5f6bd5.md" ]
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
