#!/usr/bin/env bats

load helpers.sh

_curl()    { curl -qs "http://localhost:8881/${1}" ; }

setup_file() {
    command -v curl >/dev/null
    export TZ="UTC"
    export NOTESIUM_DIR="$BATS_TEST_DIRNAME/fixtures"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
    [ "$(pidof notesium)" == "" ]
}

@test "api/raw: start with custom port and stop-on-idle" {
    run notesium web  --port=8881 --stop-on-idle &
    echo "$output"
}

@test "api/raw: new default" {
    run _curl 'api/raw/new'
    echo "$output"
    [ $status -eq 0 ]
    [ "$(dirname $output)" == "$BATS_TEST_DIRNAME/fixtures" ]
    epoch="$(printf '%d' 0x$(basename --suffix=.md $output))"
    [ "$epoch" -gt "$(date -d "-5 seconds" +%s)" ]
    [ "$epoch" -lt "$(date -d "+5 seconds" +%s)" ]
}

@test "api/raw: new verbose with custom ctime" {
    run _curl 'api/raw/new?verbose=true&ctime=2023-01-16T05:05:00'
    echo "$output"
    [ "${#lines[@]}" -eq 5 ]
    [ "${lines[1]}" == "filename:63c4dafc.md" ]
    [ "${lines[2]}" == "epoch:1673845500" ]
    [ "${lines[3]}" == "ctime:2023-01-16T05:05:00+00:00" ]
    [ "${lines[4]}" == "exists:false" ]
}

@test "api/raw: list default" {
    run _curl 'api/raw/list'
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 8 ]
    assert_line "6421460b.md:1: book"
    assert_line "642146c7.md:1: physicist"
    assert_line "64214930.md:1: quantum mechanics"
    assert_line "64214a1d.md:1: richard feynman"
    assert_line "642176a6.md:1: lorem ipsum"
    assert_line "64217712.md:1: empty note"
    assert_line "64218087.md:1: surely you're joking mr. feynman"
    assert_line "64218088.md:1: albert einstein"
}

@test "api/raw: list sort alphabetically" {
    run _curl 'api/raw/list?sort=alpha'
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

@test "api/raw: links default without filename" {
    run _curl 'api/raw/links'
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

@test "api/raw: links default with filename" {
    run _curl 'api/raw/links?filename=64214a1d.md'
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 3 ]
    assert_line "642146c7.md:1: outgoing physicist"
    assert_line "64214930.md:1: outgoing quantum mechanics"
    assert_line "64218087.md:3: incoming surely you're joking mr. feynman"
}

@test "api/raw: lines default" {
    run _curl 'api/raw/lines'
    echo "$output"
    [ $status -eq 0 ]
    assert_line "6421460b.md:1: # book"
    assert_line "642146c7.md:1: # physicist"
    assert_line "64214930.md:3: a fundamental theory in physics that provides a description of the"
    assert_line "64214930.md:5: particles."
}

@test "api/raw: version verbose sniff test" {
    run _curl 'api/raw/version?verbose=true'
    echo "$output"
    [ $status -eq 0 ]
    [[ "${lines[0]}" =~ "version:" ]]
    [[ "${lines[1]}" =~ "gitversion:v" ]]
    [[ "${lines[2]}" =~ "buildtime:" ]]
    [[ "${lines[3]}" =~ "platform:linux/amd64" ]]
}

@test "api/raw: no command specified error" {
    run _curl 'api/raw/'
    echo "$output"
    [ $status -eq 0 ]
    [[ "${lines[0]}" =~ 'no command specified' ]]
}

@test "api/raw: unrecognized command error" {
    run _curl 'api/raw/foo'
    echo "$output"
    [ $status -eq 0 ]
    [[ "${lines[0]}" =~ 'unrecognized command: foo' ]]
}

@test "api/raw: stop by sending terminate signal" {
    # force stop otherwise bats will block until timeout (bats-core/issues/205)
    run pidof notesium
    echo "$output"
    echo "could not get pid"
    [ $status -eq 0 ]

    run kill "$(pidof notesium)"
    echo "$output"
    [ $status -eq 0 ]

    run pidof notesium
    echo "$output"
    [ $status -eq 1 ]
}

