#!/bin/bash -e

weekly_test() {
  local date="$1"
  local epoch=$(date -d "$date" +%s)
  local day=$(date -d "@$epoch" +%u)

  local diff=$(( (day - $NOTESIUM_WEEKSTART + 7) % 7 ))
  local week_beg_epoch=$(( epoch - (diff * 86400) ))
  local week_beg_date=$(date -d "@$week_beg_epoch" +"%Y-%m-%dT00:00:01")
  local week_beg_str=$(date -d "@$week_beg_epoch" +"%a %b %d")
  local week_end_epoch=$(( week_beg_epoch + (6 * 86400) ))
  local week_end_str=$(date -d "@$week_end_epoch" +"%a %b %d")

  local year=$(date -d "@$week_beg_epoch" +"%G")
  local week_fmt=$([ "$NOTESIUM_WEEKSTART" -eq 0 ] && echo "%U" || echo "%V")
  local week_num=$(date -d "@$week_beg_epoch" +"${week_fmt}")

  local cdate=$(date -d "$week_beg_date" "+%Y-%m-%d")
  local title="# $year: Week$week_num ($week_beg_str - $week_end_str)"
  local date_input="${date}:$NOTESIUM_WEEKSTART"
  echo "$date_input $cdate $title"
}

for t in $@; do
  export NOTESIUM_WEEKSTART="${t##*:}"
  weekly_test "${t%%:*}"
done

