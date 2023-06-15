flunk() {
  if [[ "$#" -eq 0 ]]; then cat -; else echo "$*"; fi
  return 1
}

assert_line() {
  local line
  for line in "${lines[@]}"; do [[ "$line" == "$1" ]] && return 0; done
  flunk "expected line \"$1\""
}

