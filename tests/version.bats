#!/usr/bin/env bats

load helpers.sh

_gobuild() {
    gitversion="$1"
    cd $BATS_TEST_DIRNAME/../
    go build -o /tmp/notesium-test-version/$gitversion -ldflags "
        -X main.gitversion=$gitversion \
        -X main.buildtime=2024-01-02T01:02:03Z \
        -X main.latestReleaseUrl=http://127.0.0.1:8881"
}

_mock_latest_release() {
    tagname="$1"
    response='{"tag_name": "'$tagname'", "html_url": "https://github.com/alonswartz/notesium/releases/tag/'$tagname'", "published_at": "2024-02-02T01:02:03Z"}'
    echo -en "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${#response}\r\n\r\n${response}" | nc -C -l -s 127.0.0.1 -p 8881 -q 1 -w 5
}

setup_file() {
    export TZ="UTC"
    command -v go >/dev/null
    command -v nc >/dev/null
    [ -e "/tmp/notesium-test-version" ] && exit 1
    run mkdir /tmp/notesium-test-version
}

teardown_file() {
    run rm /tmp/notesium-test-version/v0.1.2-0-g1234567
    run rm /tmp/notesium-test-version/v0.1.2-2-g1234567
    run rm /tmp/notesium-test-version/v0.1.2-2-g1234567-dirty
    run rm /tmp/notesium-test-version/v0.2.0-beta-0-g1234567
    run rm /tmp/notesium-test-version/v0.2.1-beta-0-g1234567
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
    [ "${lines[3]}" == 'platform:linux/amd64' ]
}

@test "version: check - older" {
    run _mock_latest_release "v0.1.3" &
    run /tmp/notesium-test-version/v0.1.2-0-g1234567 version --check
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == 'Notesium 0.1.2 (linux/amd64)' ]
    [ "${lines[1]}" == 'A new release is available: 0.1.3 (2024-02-02 01:02)' ]
    [ "${lines[2]}" == 'https://github.com/alonswartz/notesium/releases' ]
}

@test "version: check verbose - older" {
    run _mock_latest_release "v0.1.3" &
    run /tmp/notesium-test-version/v0.1.2-0-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == 'Notesium 0.1.2 (linux/amd64)' ]
    [ "${lines[1]}" == 'A new release is available: 0.1.3 (2024-02-02 01:02)' ]
    [ "${lines[2]}" == 'https://github.com/alonswartz/notesium/releases' ]
    assert_line 'comparison:-1'
    assert_line 'version:0.1.2'
    assert_line 'gitversion:v0.1.2-0-g1234567'
    assert_line 'buildtime:2024-01-02T01:02:03Z'
    assert_line 'platform:linux/amd64'
    assert_line 'latest.version:0.1.3'
    assert_line 'latest.published:2024-02-02T01:02:03Z'
    assert_line 'latest.release:https://github.com/alonswartz/notesium/releases/tag/v0.1.3'
}

@test "version: check verbose - match" {
    run _mock_latest_release "v0.1.2" &
    run /tmp/notesium-test-version/v0.1.2-0-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == 'Notesium 0.1.2 (linux/amd64)' ]
    [ "${lines[1]}" == 'You are using the latest version' ]
    assert_line 'comparison:0'
}

@test "version: check verbose - newer" {
    run _mock_latest_release "v0.1.1" &
    run /tmp/notesium-test-version/v0.1.2-0-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == 'Notesium 0.1.2 (linux/amd64)' ]
    [ "${lines[1]}" == 'You are using a newer version than latest: 0.1.1' ]
    assert_line 'comparison:1'
}

@test "version: check verbose - older - patched" {
    run _mock_latest_release "v0.1.3" &
    run /tmp/notesium-test-version/v0.1.2-2-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == 'Notesium 0.1.2+2 (linux/amd64)' ]
    [ "${lines[1]}" == 'A new release is available: 0.1.3 (2024-02-02 01:02)' ]
    assert_line 'comparison:-1'
    assert_line 'version:0.1.2+2'
    assert_line 'gitversion:v0.1.2-2-g1234567'
}

@test "version: check verbose - match - patched" {
    run _mock_latest_release "v0.1.2" &
    run /tmp/notesium-test-version/v0.1.2-2-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == 'Notesium 0.1.2+2 (linux/amd64)' ]
    [ "${lines[1]}" == 'You are using the latest version' ]
    assert_line 'comparison:0'
    assert_line 'version:0.1.2+2'
    assert_line 'gitversion:v0.1.2-2-g1234567'
}

@test "version: check verbose - match - patched and dirty" {
    run _mock_latest_release "v0.1.2" &
    run /tmp/notesium-test-version/v0.1.2-2-g1234567-dirty version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == 'Notesium 0.1.2+2-dirty (linux/amd64)' ]
    [ "${lines[1]}" == 'You are using the latest version' ]
    assert_line 'comparison:0'
    assert_line 'version:0.1.2+2-dirty'
    assert_line 'gitversion:v0.1.2-2-g1234567-dirty'
}

@test "version: check verbose - older - beta" {
    run _mock_latest_release "v0.2.0" &
    run /tmp/notesium-test-version/v0.2.0-beta-0-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == 'Notesium 0.2.0-beta (linux/amd64)' ]
    [ "${lines[1]}" == 'A new release is available: 0.2.0 (2024-02-02 01:02)' ]
    assert_line 'comparison:-1'
    assert_line 'version:0.2.0-beta'
    assert_line 'gitversion:v0.2.0-beta-0-g1234567'
}

@test "version: check verbose - newer - beta" {
    run _mock_latest_release "v0.1.2" &
    run /tmp/notesium-test-version/v0.2.0-beta-0-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == 'Notesium 0.2.0-beta (linux/amd64)' ]
    [ "${lines[1]}" == 'You are using a newer version than latest: 0.1.2' ]
    assert_line 'comparison:1'
    assert_line 'version:0.2.0-beta'
    assert_line 'gitversion:v0.2.0-beta-0-g1234567'
}

@test "version: check verbose - match - beta" {
    run _mock_latest_release "v0.2.0" &
    run /tmp/notesium-test-version/v0.2.1-beta-0-g1234567 version --check --verbose
    echo "$output"
    [ $status -eq 0 ]
    [ "${lines[0]}" == 'Notesium 0.2.1-beta (linux/amd64)' ]
    [ "${lines[1]}" == 'You are using the latest version' ]
    assert_line 'comparison:0'
    assert_line 'version:0.2.1-beta'
    assert_line 'gitversion:v0.2.1-beta-0-g1234567'
}

