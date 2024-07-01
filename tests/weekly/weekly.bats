#!/usr/bin/env bats

setup_file() {
    command -v nvim >/dev/null
    command -v node >/dev/null
    cd $(realpath $BATS_TEST_DIRNAME/)
    [ -e "weekly.txt" ]
    export WEEKLY_DATES="$(echo $(cat weekly.txt | cut -d' ' -f1))"
}

@test "weekly: bash" {
    run ./weekly.sh $WEEKLY_DATES
    echo "$output"
    [ $status -eq 0 ]
    diff <(echo "$output") weekly.txt
}

@test "weekly: vim" {
    run nvim -Es -c 'source ./weekly.vim' -c "RunWeeklyTest $WEEKLY_DATES"
    echo "$output"
    [ $status -eq 0 ]
    diff <(echo "$output") weekly.txt
}

@test "weekly: js" {
    run node ./weekly.js $WEEKLY_DATES
    echo "$output"
    [ $status -eq 0 ]
    diff <(echo "$output") weekly.txt
}

