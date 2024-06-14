#!/usr/bin/env bats

load helpers.sh

_curl_jq() { curl -qs http://localhost:8881/${1} | jq -r "${2}" ; }

setup_file() {
    command -v jq >/dev/null
    command -v curl >/dev/null
    export NOTESIUM_DIR="$BATS_TEST_DIRNAME/fixtures"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
    [ "$(pidof notesium)" == "" ]
}

@test "runtime: start with custom port and stop-on-idle" {
    run notesium web  --port=8881 --stop-on-idle &
    echo "$output"
}

@test "runtime: home, version, platform" {
    run _curl_jq 'api/runtime' '.home'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "$NOTESIUM_DIR" ]

    run _curl_jq 'api/runtime' '.version'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" != "null" ]

    run _curl_jq 'api/runtime' '.platform'
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "linux/amd64" ]
}

@test "runtime: web" {
    run _curl_jq 'api/runtime' '.web | to_entries[] | "\(.key): \(.value)"'
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 3 ]
    [ "${lines[0]}" == "webroot: embedded" ]
    [ "${lines[1]}" == "writable: false" ]
    [ "${lines[2]}" == "stop-on-idle: true" ]
}

@test "runtime: build" {
    run _curl_jq 'api/runtime' '.build | to_entries[] | "\(.key): \(.value)"'
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 4 ]
    [[ "${lines[0]}" =~ "gitversion: v" ]]
    [[ "${lines[1]}" =~ "buildtime:" ]]
    [[ "${lines[2]}" =~ "goversion: go" ]]
    [[ "${lines[3]}" =~ "latest-release-url: http" ]]
}

@test "runtime: memory" {
    run _curl_jq 'api/runtime' '.memory | to_entries[] | "\(.key): \(.value)"'
    echo "$output"
    [ $status -eq 0 ]
    [ "${#lines[@]}" -eq 6 ]
    [[ "${lines[0]}" =~ "alloc:" ]]
    [[ "${lines[1]}" =~ "total-alloc:" ]]
    [[ "${lines[2]}" =~ "sys:" ]]
    [[ "${lines[3]}" =~ "lookups:" ]]
    [[ "${lines[4]}" =~ "mallocs:" ]]
    [[ "${lines[5]}" =~ "frees:" ]]
}

@test "runtime: stop by sending terminate signal" {
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

