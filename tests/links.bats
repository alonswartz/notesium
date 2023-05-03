#!/usr/bin/env bats

setup_file() {
    export NOTESIUM_DIR="$BATS_TEST_DIRNAME/fixtures"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

@test "links: default without filename" {
    run notesium.sh links
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "b0457228.md:3: albert einstein → physicist" ]
    [ "${lines[1]}" == "b0457228.md:7: albert einstein → quantum mechanics" ]
    [ "${lines[2]}" == "406c52f1.md:3: richard feynman → physicist" ]
    [ "${lines[3]}" == "406c52f1.md:5: richard feynman → quantum mechanics" ]
    [ "${lines[4]}" == "5c13e273.md:3: surely you're joking mr. feynman → book" ]
    [ "${lines[5]}" == "5c13e273.md:3: surely you're joking mr. feynman → richard feynman" ]
    [ "${lines[6]}" == "5c13e273.md:3: surely you're joking mr. feynman → richard feynman" ]
}

@test "links: default with filename" {
    run notesium.sh links 406c52f1.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "572878f1.md:1: outgoing physicist" ]
    [ "${lines[1]}" == "ce5f6bd5.md:1: outgoing quantum mechanics" ]
    [ "${lines[2]}" == "5c13e273.md:3: incoming surely you're joking mr. feynman" ]
}

@test "links: outgoing with filename" {
    run notesium.sh links --outgoing 406c52f1.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "572878f1.md:1: physicist" ]
    [ "${lines[1]}" == "ce5f6bd5.md:1: quantum mechanics" ]
}

@test "links: outgoing without filename" {
    run notesium.sh links --outgoing
    echo "$output"
    [ $status -eq 1 ]
    [ "${lines[0]}" == "Fatal: filename not specified" ]
}

@test "links: incoming with filename" {
    run notesium.sh links --incoming 572878f1.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "b0457228.md:3: albert einstein" ]
    [ "${lines[1]}" == "406c52f1.md:3: richard feynman" ]
}

@test "links: incoming without filename" {
    run notesium.sh links --incoming
    echo "$output"
    [ "${lines[0]}" == "Fatal: filename not specified" ]
}

@test "links: incoming and outgoing with filename" {
    run notesium.sh links --incoming --outgoing 406c52f1.md
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "572878f1.md:1: outgoing physicist" ]
    [ "${lines[1]}" == "ce5f6bd5.md:1: outgoing quantum mechanics" ]
    [ "${lines[2]}" == "5c13e273.md:3: incoming surely you're joking mr. feynman" ]
}

@test "links: incoming and outgoing without filename" {
    run notesium.sh links --incoming --outgoing
    echo "$output"
    [ $status -eq 1 ]
    [ "${lines[0]}" == "Fatal: filename not specified" ]
}

@test "links: dangling with filename" {
    run notesium.sh links --dangling 5c13e273.md
    echo "$output"
    [ $status -eq 1 ]
    [ "${lines[0]}" == "Fatal: dangling filename not supported" ]
}

@test "links: dangling without filename" {
    run notesium.sh links --dangling
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "5c13e273.md:3: surely you're joking mr. feynman → 12345678.md" ]
}
