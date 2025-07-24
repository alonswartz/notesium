#!/usr/bin/env bats

load helpers.sh

_gobuild() {
    gitversion="$1"
    cd $BATS_TEST_DIRNAME/../
    go build -o /tmp/notesium-test-version/$gitversion -ldflags "
        -X main.gitversion=$gitversion \
        -X main.buildtime=2024-01-02T01:02:03Z \
        -X main.latestReleaseURL=http://127.0.0.1:8882/latest.json"
}

_mock_latest_release() {
    tagname="$1"
    jq -n --arg tag "$tagname" '{
        tag_name: $tag,
        html_url: "https://github.com/alonswartz/notesium/releases/tag/\($tag)",
        published_at: "2024-02-02T01:02:03Z"
    }' > /tmp/notesium-test-version/latest.json
}

_os_arch() {
    uname -sm | tr A-Z a-z | sed 's/ /\//;s/x86_64/amd64/;s/aarch64/arm64/'
}

setup_file() {
    export TZ="UTC"
    export EXPECTED_PLATFORM="$(_os_arch)"
    command -v go >/dev/null
    command -v jq >/dev/null
    [ "$(pgrep -x notesium)" == "" ]
    [ -e "/tmp/notesium-test-version" ] && exit 1
    run mkdir /tmp/notesium-test-version
    export NOTESIUM_DIR="/tmp/notesium-test-version"
    export PATH="$(realpath $BATS_TEST_DIRNAME/../):$PATH"
}

teardown_file() {
    run rm /tmp/notesium-test-version/v0.1.2-0-g1234567
    run rm /tmp/notesium-test-version/v0.1.2-2-g1234567
    run rm /tmp/notesium-test-version/v0.1.2-2-g1234567-dirty
    run rm /tmp/notesium-test-version/v0.2.0-beta-0-g1234567
    run rm /tmp/notesium-test-version/v0.2.1-beta-0-g1234567
    run rm /tmp/notesium-test-version/latest.json
    run rmdir /tmp/notesium-test-version
}

@test "version: building test binaries with custom flags" {
    run _gobuild "v0.1.2-0-g1234567"
    echo "$output"
    [ $status -eq 0 ]

    run _gobuild "v0.1.2-2-g1234567"
    echo "$output"
    [ $status -eq 0 ]

    run _gobuild "v0.1.2-2-g1234567-dirty"
    echo "$output"
    [ $status -eq 0 ]

    run _gobuild "v0.2.0-beta-0-g1234567"
    echo "$output"
    [ $status -eq 0 ]

    run _gobuild "v0.2.1-beta-0-g1234567"
    echo "$output"
    [ $status -eq 0 ]
}

@test "version: backwards compat. -v --version flags" {
    run /tmp/notesium-test-version/v0.1.2-0-g1234567 -v
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '0.1.2' ]

    run /tmp/notesium-test-version/v0.1.2-0-g1234567 --version
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '0.1.2' ]
}

@test "version: default" {
    run /tmp/notesium-test-version/v0.1.2-0-g1234567 version
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '0.1.2' ]
}

@test "version: default - patched" {
    run /tmp/notesium-test-version/v0.1.2-2-g1234567 version
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '0.1.2+2' ]
}

@test "version: default - patched and dirty" {
    run /tmp/notesium-test-version/v0.1.2-2-g1234567-dirty version
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '0.1.2+2-dirty' ]
}

@test "version: default - beta" {
    run /tmp/notesium-test-version/v0.2.0-beta-0-g1234567 version
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == '0.2.0-beta' ]
}

@test "version: default verbose" {
    run /tmp/notesium-test-version/v0.1.2-0-g1234567 version --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == 'version:0.1.2' ]
    [ "${lines[1]}" == 'gitversion:v0.1.2-0-g1234567' ]
    [ "${lines[2]}" == 'buildtime:2024-01-02T01:02:03Z' ]
    [ "${lines[3]}" == "platform:$EXPECTED_PLATFORM" ]
}

@test "version: check - start mock release server" {
    # mis-using notesium to act as a mock release server
    run notesium web --port=8882 --stop-on-idle --webroot=$NOTESIUM_DIR &
    echo "$output"
}

@test "version: check - older" {
    run _mock_latest_release "v0.1.3"
    run /tmp/notesium-test-version/v0.1.2-0-g1234567 version --check
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "Notesium 0.1.2 ($EXPECTED_PLATFORM)" ]
    [ "${lines[1]}" == 'A new release is available: 0.1.3 (2024-02-02 01:02)' ]
    [ "${lines[2]}" == 'https://github.com/alonswartz/notesium/releases' ]
}

@test "version: check verbose - older" {
    run _mock_latest_release "v0.1.3"
    run /tmp/notesium-test-version/v0.1.2-0-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "Notesium 0.1.2 ($EXPECTED_PLATFORM)" ]
    [ "${lines[1]}" == 'A new release is available: 0.1.3 (2024-02-02 01:02)' ]
    [ "${lines[2]}" == 'https://github.com/alonswartz/notesium/releases' ]
    assert_line 'comparison:-1'
    assert_line 'version:0.1.2'
    assert_line 'gitversion:v0.1.2-0-g1234567'
    assert_line 'buildtime:2024-01-02T01:02:03Z'
    assert_line "platform:$EXPECTED_PLATFORM"
    assert_line 'latest.version:0.1.3'
    assert_line 'latest.published:2024-02-02T01:02:03Z'
    assert_line 'latest.release:https://github.com/alonswartz/notesium/releases/tag/v0.1.3'
}

@test "version: check verbose - match" {
    run _mock_latest_release "v0.1.2"
    run /tmp/notesium-test-version/v0.1.2-0-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "Notesium 0.1.2 ($EXPECTED_PLATFORM)" ]
    [ "${lines[1]}" == 'You are using the latest version' ]
    assert_line 'comparison:0'
}

@test "version: check verbose - newer" {
    run _mock_latest_release "v0.1.1"
    run /tmp/notesium-test-version/v0.1.2-0-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "Notesium 0.1.2 ($EXPECTED_PLATFORM)" ]
    [ "${lines[1]}" == 'You are using a newer version than latest: 0.1.1' ]
    assert_line 'comparison:1'
}

@test "version: check verbose - older - patched" {
    run _mock_latest_release "v0.1.3"
    run /tmp/notesium-test-version/v0.1.2-2-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "Notesium 0.1.2+2 ($EXPECTED_PLATFORM)" ]
    [ "${lines[1]}" == 'A new release is available: 0.1.3 (2024-02-02 01:02)' ]
    assert_line 'comparison:-1'
    assert_line 'version:0.1.2+2'
    assert_line 'gitversion:v0.1.2-2-g1234567'
}

@test "version: check verbose - match - patched" {
    run _mock_latest_release "v0.1.2"
    run /tmp/notesium-test-version/v0.1.2-2-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "Notesium 0.1.2+2 ($EXPECTED_PLATFORM)" ]
    [ "${lines[1]}" == 'You are using the latest version' ]
    assert_line 'comparison:0'
    assert_line 'version:0.1.2+2'
    assert_line 'gitversion:v0.1.2-2-g1234567'
}

@test "version: check verbose - match - patched and dirty" {
    run _mock_latest_release "v0.1.2"
    run /tmp/notesium-test-version/v0.1.2-2-g1234567-dirty version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "Notesium 0.1.2+2-dirty ($EXPECTED_PLATFORM)" ]
    [ "${lines[1]}" == 'You are using the latest version' ]
    assert_line 'comparison:0'
    assert_line 'version:0.1.2+2-dirty'
    assert_line 'gitversion:v0.1.2-2-g1234567-dirty'
}

@test "version: check verbose - older - beta" {
    run _mock_latest_release "v0.2.0"
    run /tmp/notesium-test-version/v0.2.0-beta-0-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "Notesium 0.2.0-beta ($EXPECTED_PLATFORM)" ]
    [ "${lines[1]}" == 'A new release is available: 0.2.0 (2024-02-02 01:02)' ]
    assert_line 'comparison:-1'
    assert_line 'version:0.2.0-beta'
    assert_line 'gitversion:v0.2.0-beta-0-g1234567'
}

@test "version: check verbose - newer - beta" {
    run _mock_latest_release "v0.1.2"
    run /tmp/notesium-test-version/v0.2.0-beta-0-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "Notesium 0.2.0-beta ($EXPECTED_PLATFORM)" ]
    [ "${lines[1]}" == 'You are using a newer version than latest: 0.1.2' ]
    assert_line 'comparison:1'
    assert_line 'version:0.2.0-beta'
    assert_line 'gitversion:v0.2.0-beta-0-g1234567'
}

@test "version: check verbose - match - beta" {
    run _mock_latest_release "v0.2.0"
    run /tmp/notesium-test-version/v0.2.1-beta-0-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == "Notesium 0.2.1-beta ($EXPECTED_PLATFORM)" ]
    [ "${lines[1]}" == 'You are using the latest version' ]
    assert_line 'comparison:0'
    assert_line 'version:0.2.1-beta'
    assert_line 'gitversion:v0.2.1-beta-0-g1234567'
}

@test "version: check - stop mock release server by sending terminate signal" {
    # force stop otherwise bats will block until timeout (bats-core/issues/205)
    run pgrep -x notesium
    echo "$output"
    echo "could not get pid"
    [ $status -eq 0 ]

    run kill "$(pgrep -x notesium)"
    echo "$output"
    [ $status -eq 0 ]

    run pgrep -x notesium
    echo "$output"
    [ $status -eq 1 ]
}

