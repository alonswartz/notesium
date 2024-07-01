" nvim -Es -c 'source weekly.vim' -c 'RunWeeklyTest 2023-12-30:0 ...'

command! -bang -nargs=* WeeklyTest
  \ let s:date = empty(<q-args>) ? strftime('%Y-%m-%d') : <q-args> |
  \ let s:output = system('notesium new --verbose --ctime='.s:date.'T00:00:01') |
  \ let s:epoch = str2nr(matchstr(s:output, 'epoch:\zs[^\n]*')) |
  \ let s:day = strftime('%u', s:epoch) |
  \ let s:startOfWeek = empty($NOTESIUM_WEEKSTART) ? 1 : $NOTESIUM_WEEKSTART |
  \ let s:diff = (s:day - s:startOfWeek + 7) % 7 |
  \ let s:weekBegEpoch = s:epoch - (s:diff * 86400) |
  \ let s:weekBegDate = strftime('%Y-%m-%d', s:weekBegEpoch) |
  \ let s:output = system('notesium new --verbose --ctime='.s:weekBegDate.'T00:00:01') |
  \ let s:filepath = matchstr(s:output, 'path:\zs[^\n]*') |
  \ let s:weekFmt = s:startOfWeek == 0 ? '%U' : '%V' |
  \ let s:yearWeekStr = strftime('%G: Week' . s:weekFmt, s:weekBegEpoch) |
  \ let s:weekBegStr = strftime('%a %b %d', s:weekBegEpoch) |
  \ let s:weekEndStr = strftime('%a %b %d', s:weekBegEpoch + (6 * 86400)) |
  \ let s:title = printf('# %s (%s - %s)', s:yearWeekStr, s:weekBegStr, s:weekEndStr) |
  \ let s:dateInput = s:date.':'.$NOTESIUM_WEEKSTART |
  \ echo s:dateInput s:weekBegDate s:title 

command! -bang -nargs=1 RunWeeklyTest
  \ let s:tests = split(<q-args>, ' ') |
  \ redir => result |
  \ for s:test in s:tests |
  \   let s:args = split(s:test, ':') |
  \   let s:date = s:args[0] |
  \   let s:weekstart = s:args[1] |
  \   let $NOTESIUM_WEEKSTART = s:weekstart |
  \   silent! execute 'WeeklyTest ' . s:date |
  \ endfor |
  \ redir END |
  \ call writefile(split(result, "\n"), '/dev/stdout') |
  \ quit

