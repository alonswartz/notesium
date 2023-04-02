#!/usr/bin/env bats

_set_deterministic_mtimes() {
    for md in $(ls /tmp/notesium-test-corpus/*.md); do
        hex="$(basename --suffix=.md $md)"
        dec=$(printf "%u\n" "0x${hex//-/}")
        int=$((dec % 30 + 1))
        day=$(printf "%02d\n" "$int")
        touch -m -t 202301${day}0505 $md
    done
}

setup_file() {
    [ -e "/tmp/notesium-test-corpus" ] && exit 1
    run mkdir /tmp/notesium-test-corpus
    run cp $BATS_TEST_DIRNAME/fixtures/*.md /tmp/notesium-test-corpus/
    run _set_deterministic_mtimes
    export NOTESIUM_DIR="/tmp/notesium-test-corpus"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

teardown_file() {
    if [ "$PAUSE" ]; then
        echo "# NOTESIUM_DIR=$NOTESIUM_DIR" >&3
        echo "# PAUSED: Press enter to continue with teardown... " >&3
        run read -p "paused: " choice
    fi
    run rm /tmp/notesium-test-corpus/*.md
    run rmdir /tmp/notesium-test-corpus
}

@test "list: default" {
    run notesium.sh list
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "0c8bea98.md:1: book" ]
    [ "${lines[1]}" == "26f89821.md:1: lorem ipsum" ]
    [ "${lines[2]}" == "3ec9906f.md:1: empty note" ]
    [ "${lines[3]}" == "406c52f1.md:1: richard feynman" ]
    [ "${lines[4]}" == "572878f1.md:1: physicist" ]
    [ "${lines[5]}" == "5c13e273.md:1: surely you're joking mr. feynman" ]
    [ "${lines[6]}" == "b0457228.md:1: albert einstein" ]
    [ "${lines[7]}" == "ce5f6bd5.md:1: quantum mechanics" ]
}

@test "list: sort by title" {
    run notesium.sh list --sort=title
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "b0457228.md:1: albert einstein" ]
    [ "${lines[1]}" == "0c8bea98.md:1: book" ]
    [ "${lines[2]}" == "3ec9906f.md:1: empty note" ]
    [ "${lines[3]}" == "26f89821.md:1: lorem ipsum" ]
    [ "${lines[4]}" == "572878f1.md:1: physicist" ]
    [ "${lines[5]}" == "ce5f6bd5.md:1: quantum mechanics" ]
    [ "${lines[6]}" == "406c52f1.md:1: richard feynman" ]
    [ "${lines[7]}" == "5c13e273.md:1: surely you're joking mr. feynman" ]
}

@test "list: sort by mtime" {
    run notesium.sh list --sort=mtime
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "b0457228.md:1: albert einstein" ]
    [ "${lines[1]}" == "3ec9906f.md:1: empty note" ]
    [ "${lines[2]}" == "572878f1.md:1: physicist" ]
    [ "${lines[3]}" == "26f89821.md:1: lorem ipsum" ]
    [ "${lines[4]}" == "ce5f6bd5.md:1: quantum mechanics" ]
    [ "${lines[5]}" == "5c13e273.md:1: surely you're joking mr. feynman" ]
    [ "${lines[6]}" == "406c52f1.md:1: richard feynman" ]
    [ "${lines[7]}" == "0c8bea98.md:1: book" ]
}

@test "list: labels" {
    run notesium.sh list --labels
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "0c8bea98.md:1: book" ]
    [ "${lines[1]}" == "572878f1.md:1: physicist" ]
}

@test "list: labels and sort by title" {
    run notesium.sh list --labels --sort=title
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "0c8bea98.md:1: book" ]
    [ "${lines[1]}" == "572878f1.md:1: physicist" ]
}

@test "list: labels and sort by mtime" {
    run notesium.sh list --labels --sort=mtime
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "572878f1.md:1: physicist" ]
    [ "${lines[1]}" == "0c8bea98.md:1: book" ]
}

@test "list: prefix label" {
    run notesium.sh list --prefix=label
    echo "$output"
    [ "${lines[0]}" == "406c52f1.md:1: physicist richard feynman" ]
    [ "${lines[1]}" == "5c13e273.md:1: book surely you're joking mr. feynman" ]
    [ "${lines[2]}" == "b0457228.md:1: physicist albert einstein" ]
    [ "${lines[3]}" == "0c8bea98.md:1: book" ]
    [ "${lines[4]}" == "26f89821.md:1: lorem ipsum" ]
    [ "${lines[5]}" == "3ec9906f.md:1: empty note" ]
    [ "${lines[6]}" == "572878f1.md:1: physicist" ]
    [ "${lines[7]}" == "ce5f6bd5.md:1: quantum mechanics" ]
}

@test "list: prefix label and sort by title" {
    run notesium.sh list --prefix=label --sort=title
    echo "$output"
    [ "${lines[0]}" == "5c13e273.md:1: book surely you're joking mr. feynman" ]
    [ "${lines[1]}" == "b0457228.md:1: physicist albert einstein" ]
    [ "${lines[2]}" == "406c52f1.md:1: physicist richard feynman" ]
    [ "${lines[3]}" == "0c8bea98.md:1: book" ]
    [ "${lines[4]}" == "3ec9906f.md:1: empty note" ]
    [ "${lines[5]}" == "26f89821.md:1: lorem ipsum" ]
    [ "${lines[6]}" == "572878f1.md:1: physicist" ]
    [ "${lines[7]}" == "ce5f6bd5.md:1: quantum mechanics" ]
}

@test "list: prefix label and sort by mtime" {
    run notesium.sh list --prefix=label --sort=mtime
    echo "$output"
    [ "${lines[0]}" == "b0457228.md:1: physicist albert einstein" ]
    [ "${lines[1]}" == "5c13e273.md:1: book surely you're joking mr. feynman" ]
    [ "${lines[2]}" == "406c52f1.md:1: physicist richard feynman" ]
    [ "${lines[3]}" == "3ec9906f.md:1: empty note" ]
    [ "${lines[4]}" == "572878f1.md:1: physicist" ]
    [ "${lines[5]}" == "26f89821.md:1: lorem ipsum" ]
    [ "${lines[6]}" == "ce5f6bd5.md:1: quantum mechanics" ]
    [ "${lines[7]}" == "0c8bea98.md:1: book" ]
}

@test "list: prefix mtime" {
    run notesium.sh list --prefix=mtime
    echo "$output"
    [ "${lines[0]}" == "0c8bea98.md:1: 2023-01-13 book" ]
    [ "${lines[1]}" == "26f89821.md:1: 2023-01-22 lorem ipsum" ]
    [ "${lines[2]}" == "3ec9906f.md:1: 2023-01-24 empty note" ]
    [ "${lines[3]}" == "406c52f1.md:1: 2023-01-16 richard feynman" ]
    [ "${lines[4]}" == "572878f1.md:1: 2023-01-24 physicist" ]
    [ "${lines[5]}" == "5c13e273.md:1: 2023-01-18 surely you're joking mr. feynman" ]
    [ "${lines[6]}" == "b0457228.md:1: 2023-01-25 albert einstein" ]
    [ "${lines[7]}" == "ce5f6bd5.md:1: 2023-01-22 quantum mechanics" ]
}

@test "list: prefix mtime and sort by title" {
    run notesium.sh list --prefix=mtime --sort=title
    echo "$output"
    [ "${lines[0]}" == "b0457228.md:1: 2023-01-25 albert einstein" ]
    [ "${lines[1]}" == "0c8bea98.md:1: 2023-01-13 book" ]
    [ "${lines[2]}" == "3ec9906f.md:1: 2023-01-24 empty note" ]
    [ "${lines[3]}" == "26f89821.md:1: 2023-01-22 lorem ipsum" ]
    [ "${lines[4]}" == "572878f1.md:1: 2023-01-24 physicist" ]
    [ "${lines[5]}" == "ce5f6bd5.md:1: 2023-01-22 quantum mechanics" ]
    [ "${lines[6]}" == "406c52f1.md:1: 2023-01-16 richard feynman" ]
    [ "${lines[7]}" == "5c13e273.md:1: 2023-01-18 surely you're joking mr. feynman" ]
}

@test "list: prefix mtime and sort by mtime" {
    run notesium.sh list --prefix=mtime --sort=mtime
    echo "$output"
    [ "${lines[0]}" == "b0457228.md:1: 2023-01-25 albert einstein" ]
    [ "${lines[1]}" == "3ec9906f.md:1: 2023-01-24 empty note" ]
    [ "${lines[2]}" == "572878f1.md:1: 2023-01-24 physicist" ]
    [ "${lines[3]}" == "26f89821.md:1: 2023-01-22 lorem ipsum" ]
    [ "${lines[4]}" == "ce5f6bd5.md:1: 2023-01-22 quantum mechanics" ]
    [ "${lines[5]}" == "5c13e273.md:1: 2023-01-18 surely you're joking mr. feynman" ]
    [ "${lines[6]}" == "406c52f1.md:1: 2023-01-16 richard feynman" ]
    [ "${lines[7]}" == "0c8bea98.md:1: 2023-01-13 book" ]
}

@test "list: match" {
    run notesium.sh list --match="quantum"
    echo "$output"
    [ "${lines[0]}" == "406c52f1.md:5: richard feynman" ]
    [ "${lines[1]}" == "b0457228.md:7: albert einstein" ]
    [ "${lines[2]}" == "ce5f6bd5.md:1: quantum mechanics" ]
}

@test "list: match and sort by title" {
    run notesium.sh list --match="quantum" --sort=title
    echo "$output"
    [ "${lines[0]}" == "b0457228.md:7: albert einstein" ]
    [ "${lines[1]}" == "ce5f6bd5.md:1: quantum mechanics" ]
    [ "${lines[2]}" == "406c52f1.md:5: richard feynman" ]
}

@test "list: match and sort by mtime" {
    run notesium.sh list --match="quantum" --sort=mtime
    echo "$output"
    [ "${lines[0]}" == "b0457228.md:7: albert einstein" ]
    [ "${lines[1]}" == "ce5f6bd5.md:1: quantum mechanics" ]
    [ "${lines[2]}" == "406c52f1.md:5: richard feynman" ]
}

@test "list: orphans" {
    run notesium.sh list --orphans
    echo "$output"
    [ "${lines[0]}" == "26f89821.md:1: lorem ipsum" ]
    [ "${lines[1]}" == "3ec9906f.md:1: empty note" ]
}

@test "list: orphans and sort by title" {
    run notesium.sh list --orphans --sort=title
    echo "$output"
    [ "${lines[0]}" == "3ec9906f.md:1: empty note" ]
    [ "${lines[1]}" == "26f89821.md:1: lorem ipsum" ]
}

@test "list: orphans and sort by mtime" {
    run notesium.sh list --orphans --sort=mtime
    echo "$output"
    [ "${lines[0]}" == "3ec9906f.md:1: empty note" ]
    [ "${lines[1]}" == "26f89821.md:1: lorem ipsum" ]
}