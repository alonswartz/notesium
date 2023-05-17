#!/usr/bin/env bats

_set_deterministic_mtimes() {
    touch -m -t 202301250505 "/tmp/notesium-test-corpus/64218088.md"
    touch -m -t 202301240505 "/tmp/notesium-test-corpus/64217712.md"
    touch -m -t 202301240504 "/tmp/notesium-test-corpus/642146c7.md"
    touch -m -t 202301220505 "/tmp/notesium-test-corpus/642176a6.md"
    touch -m -t 202301220504 "/tmp/notesium-test-corpus/64214930.md"
    touch -m -t 202301180505 "/tmp/notesium-test-corpus/64218087.md"
    touch -m -t 202301160505 "/tmp/notesium-test-corpus/64214a1d.md"
    touch -m -t 202301130505 "/tmp/notesium-test-corpus/6421460b.md"
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
    [ "${lines[0]}" == "6421460b.md:1: book" ]
    [ "${lines[1]}" == "642146c7.md:1: physicist" ]
    [ "${lines[2]}" == "64214930.md:1: quantum mechanics" ]
    [ "${lines[3]}" == "64214a1d.md:1: richard feynman" ]
    [ "${lines[4]}" == "642176a6.md:1: lorem ipsum" ]
    [ "${lines[5]}" == "64217712.md:1: empty note" ]
    [ "${lines[6]}" == "64218087.md:1: surely you're joking mr. feynman" ]
    [ "${lines[7]}" == "64218088.md:1: albert einstein" ]
}

@test "list: sort alphabetically" {
    run notesium.sh list --sort=alpha
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "64218088.md:1: albert einstein" ]
    [ "${lines[1]}" == "6421460b.md:1: book" ]
    [ "${lines[2]}" == "64217712.md:1: empty note" ]
    [ "${lines[3]}" == "642176a6.md:1: lorem ipsum" ]
    [ "${lines[4]}" == "642146c7.md:1: physicist" ]
    [ "${lines[5]}" == "64214930.md:1: quantum mechanics" ]
    [ "${lines[6]}" == "64214a1d.md:1: richard feynman" ]
    [ "${lines[7]}" == "64218087.md:1: surely you're joking mr. feynman" ]
}

@test "list: sort by mtime" {
    run notesium.sh list --sort=mtime
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "64218088.md:1: albert einstein" ]
    [ "${lines[1]}" == "64217712.md:1: empty note" ]
    [ "${lines[2]}" == "642146c7.md:1: physicist" ]
    [ "${lines[3]}" == "642176a6.md:1: lorem ipsum" ]
    [ "${lines[4]}" == "64214930.md:1: quantum mechanics" ]
    [ "${lines[5]}" == "64218087.md:1: surely you're joking mr. feynman" ]
    [ "${lines[6]}" == "64214a1d.md:1: richard feynman" ]
    [ "${lines[7]}" == "6421460b.md:1: book" ]
}

@test "list: sort by ctime" {
    run notesium.sh list --sort=ctime
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "64218088.md:1: albert einstein" ]
    [ "${lines[1]}" == "64218087.md:1: surely you're joking mr. feynman" ]
    [ "${lines[2]}" == "64217712.md:1: empty note" ]
    [ "${lines[3]}" == "642176a6.md:1: lorem ipsum" ]
    [ "${lines[4]}" == "64214a1d.md:1: richard feynman" ]
    [ "${lines[5]}" == "64214930.md:1: quantum mechanics" ]
    [ "${lines[6]}" == "642146c7.md:1: physicist" ]
    [ "${lines[7]}" == "6421460b.md:1: book" ]
}

@test "list: labels" {
    run notesium.sh list --labels
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "6421460b.md:1: book" ]
    [ "${lines[1]}" == "642146c7.md:1: physicist" ]
}

@test "list: labels and sort alphabetically" {
    run notesium.sh list --labels --sort=alpha
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "6421460b.md:1: book" ]
    [ "${lines[1]}" == "642146c7.md:1: physicist" ]
}

@test "list: labels and sort by mtime" {
    run notesium.sh list --labels --sort=mtime
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "642146c7.md:1: physicist" ]
    [ "${lines[1]}" == "6421460b.md:1: book" ]
}

@test "list: labels and sort by ctime" {
    run notesium.sh list --labels --sort=ctime
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "642146c7.md:1: physicist" ]
    [ "${lines[1]}" == "6421460b.md:1: book" ]
}

@test "list: prefix label" {
    run notesium.sh list --prefix=label
    echo "$output"
    [ "${lines[0]}" == "64214a1d.md:1: physicist richard feynman" ]
    [ "${lines[1]}" == "64218087.md:1: book surely you're joking mr. feynman" ]
    [ "${lines[2]}" == "64218088.md:1: physicist albert einstein" ]
    [ "${lines[3]}" == "6421460b.md:1: book" ]
    [ "${lines[4]}" == "642146c7.md:1: physicist" ]
    [ "${lines[5]}" == "64214930.md:1: quantum mechanics" ]
    [ "${lines[6]}" == "642176a6.md:1: lorem ipsum" ]
    [ "${lines[7]}" == "64217712.md:1: empty note" ]
}

@test "list: prefix label and sort alphabetically" {
    run notesium.sh list --prefix=label --sort=alpha
    echo "$output"
    [ "${lines[0]}" == "64218087.md:1: book surely you're joking mr. feynman" ]
    [ "${lines[1]}" == "64218088.md:1: physicist albert einstein" ]
    [ "${lines[2]}" == "64214a1d.md:1: physicist richard feynman" ]
    [ "${lines[3]}" == "6421460b.md:1: book" ]
    [ "${lines[4]}" == "64217712.md:1: empty note" ]
    [ "${lines[5]}" == "642176a6.md:1: lorem ipsum" ]
    [ "${lines[6]}" == "642146c7.md:1: physicist" ]
    [ "${lines[7]}" == "64214930.md:1: quantum mechanics" ]
}

@test "list: prefix label and sort by mtime" {
    run notesium.sh list --prefix=label --sort=mtime
    echo "$output"
    [ "${lines[0]}" == "64218088.md:1: physicist albert einstein" ]
    [ "${lines[1]}" == "64218087.md:1: book surely you're joking mr. feynman" ]
    [ "${lines[2]}" == "64214a1d.md:1: physicist richard feynman" ]
    [ "${lines[3]}" == "64217712.md:1: empty note" ]
    [ "${lines[4]}" == "642146c7.md:1: physicist" ]
    [ "${lines[5]}" == "642176a6.md:1: lorem ipsum" ]
    [ "${lines[6]}" == "64214930.md:1: quantum mechanics" ]
    [ "${lines[7]}" == "6421460b.md:1: book" ]
}

@test "list: prefix label and sort by ctime" {
    run notesium.sh list --prefix=label --sort=ctime
    echo "$output"
    [ "${lines[0]}" == "64218088.md:1: physicist albert einstein" ]
    [ "${lines[1]}" == "64218087.md:1: book surely you're joking mr. feynman" ]
    [ "${lines[2]}" == "64214a1d.md:1: physicist richard feynman" ]
    [ "${lines[3]}" == "64217712.md:1: empty note" ]
    [ "${lines[4]}" == "642176a6.md:1: lorem ipsum" ]
    [ "${lines[5]}" == "64214930.md:1: quantum mechanics" ]
    [ "${lines[6]}" == "642146c7.md:1: physicist" ]
    [ "${lines[7]}" == "6421460b.md:1: book" ]
}

@test "list: prefix mtime" {
    run notesium.sh list --prefix=mtime
    echo "$output"
    [ "${lines[0]}" == "6421460b.md:1: 2023-01-13 book" ]
    [ "${lines[1]}" == "642146c7.md:1: 2023-01-24 physicist" ]
    [ "${lines[2]}" == "64214930.md:1: 2023-01-22 quantum mechanics" ]
    [ "${lines[3]}" == "64214a1d.md:1: 2023-01-16 richard feynman" ]
    [ "${lines[4]}" == "642176a6.md:1: 2023-01-22 lorem ipsum" ]
    [ "${lines[5]}" == "64217712.md:1: 2023-01-24 empty note" ]
    [ "${lines[6]}" == "64218087.md:1: 2023-01-18 surely you're joking mr. feynman" ]
    [ "${lines[7]}" == "64218088.md:1: 2023-01-25 albert einstein" ]
}

@test "list: prefix mtime and sort alphabetically" {
    run notesium.sh list --prefix=mtime --sort=alpha
    echo "$output"
    [ "${lines[0]}" == "64218088.md:1: 2023-01-25 albert einstein" ]
    [ "${lines[1]}" == "6421460b.md:1: 2023-01-13 book" ]
    [ "${lines[2]}" == "64217712.md:1: 2023-01-24 empty note" ]
    [ "${lines[3]}" == "642176a6.md:1: 2023-01-22 lorem ipsum" ]
    [ "${lines[4]}" == "642146c7.md:1: 2023-01-24 physicist" ]
    [ "${lines[5]}" == "64214930.md:1: 2023-01-22 quantum mechanics" ]
    [ "${lines[6]}" == "64214a1d.md:1: 2023-01-16 richard feynman" ]
    [ "${lines[7]}" == "64218087.md:1: 2023-01-18 surely you're joking mr. feynman" ]
}

@test "list: prefix mtime and sort by mtime" {
    run notesium.sh list --prefix=mtime --sort=mtime
    echo "$output"
    [ "${lines[0]}" == "64218088.md:1: 2023-01-25 albert einstein" ]
    [ "${lines[1]}" == "64217712.md:1: 2023-01-24 empty note" ]
    [ "${lines[2]}" == "642146c7.md:1: 2023-01-24 physicist" ]
    [ "${lines[3]}" == "642176a6.md:1: 2023-01-22 lorem ipsum" ]
    [ "${lines[4]}" == "64214930.md:1: 2023-01-22 quantum mechanics" ]
    [ "${lines[5]}" == "64218087.md:1: 2023-01-18 surely you're joking mr. feynman" ]
    [ "${lines[6]}" == "64214a1d.md:1: 2023-01-16 richard feynman" ]
    [ "${lines[7]}" == "6421460b.md:1: 2023-01-13 book" ]
}

@test "list: prefix mtime and sort by ctime" {
    run notesium.sh list --prefix=mtime --sort=ctime
    echo "$output"
    [ "${lines[0]}" == "64218088.md:1: 2023-01-25 albert einstein" ]
    [ "${lines[1]}" == "64218087.md:1: 2023-01-18 surely you're joking mr. feynman" ]
    [ "${lines[2]}" == "64217712.md:1: 2023-01-24 empty note" ]
    [ "${lines[3]}" == "642176a6.md:1: 2023-01-22 lorem ipsum" ]
    [ "${lines[4]}" == "64214a1d.md:1: 2023-01-16 richard feynman" ]
    [ "${lines[5]}" == "64214930.md:1: 2023-01-22 quantum mechanics" ]
    [ "${lines[6]}" == "642146c7.md:1: 2023-01-24 physicist" ]
    [ "${lines[7]}" == "6421460b.md:1: 2023-01-13 book" ]
}

@test "list: match" {
    run notesium.sh list --match="quantum"
    echo "$output"
    [ "${lines[0]}" == "64214930.md:1: quantum mechanics" ]
    [ "${lines[1]}" == "64214a1d.md:5: richard feynman" ]
    [ "${lines[2]}" == "64218088.md:7: albert einstein" ]
}

@test "list: match and sort alphabetically" {
    run notesium.sh list --match="quantum" --sort=alpha
    echo "$output"
    [ "${lines[0]}" == "64218088.md:7: albert einstein" ]
    [ "${lines[1]}" == "64214930.md:1: quantum mechanics" ]
    [ "${lines[2]}" == "64214a1d.md:5: richard feynman" ]
}

@test "list: match and sort by mtime" {
    run notesium.sh list --match="quantum" --sort=mtime
    echo "$output"
    [ "${lines[0]}" == "64218088.md:7: albert einstein" ]
    [ "${lines[1]}" == "64214930.md:1: quantum mechanics" ]
    [ "${lines[2]}" == "64214a1d.md:5: richard feynman" ]
}

@test "list: match and sort by ctime" {
    run notesium.sh list --match="quantum" --sort=ctime
    echo "$output"
    [ "${lines[0]}" == "64218088.md:7: albert einstein" ]
    [ "${lines[1]}" == "64214a1d.md:5: richard feynman" ]
    [ "${lines[2]}" == "64214930.md:1: quantum mechanics" ]
}

@test "list: orphans" {
    run notesium.sh list --orphans
    echo "$output"
    [ "${lines[0]}" == "642176a6.md:1: lorem ipsum" ]
    [ "${lines[1]}" == "64217712.md:1: empty note" ]
}

@test "list: orphans and sort alphabetically" {
    run notesium.sh list --orphans --sort=alpha
    echo "$output"
    [ "${lines[0]}" == "64217712.md:1: empty note" ]
    [ "${lines[1]}" == "642176a6.md:1: lorem ipsum" ]
}

@test "list: orphans and sort by mtime" {
    run notesium.sh list --orphans --sort=mtime
    echo "$output"
    [ "${lines[0]}" == "64217712.md:1: empty note" ]
    [ "${lines[1]}" == "642176a6.md:1: lorem ipsum" ]
}

@test "list: orphans and sort by ctime" {
    run notesium.sh list --orphans --sort=ctime
    echo "$output"
    [ "${lines[0]}" == "64217712.md:1: empty note" ]
    [ "${lines[1]}" == "642176a6.md:1: lorem ipsum" ]
}
