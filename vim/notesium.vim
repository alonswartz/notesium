let $NOTESIUM_DIR = trim(system("notesium home"))
let $NOTESIUM_WEEKSTART = 1 "0 Sunday, 1 Monday, ...

autocmd BufRead,BufNewFile $NOTESIUM_DIR/*.md inoremap <expr> [[ fzf#vim#complete({
  \ 'source': 'notesium list --sort=mtime',
  \ 'options': '+s -d : --with-nth 3.. --prompt "NotesiumInsertLink> "',
  \ 'reducer': {l->"[". split(l[0],':1: ')[1] ."](".split(l[0],':')[0].")"},
  \ 'window': {'width': 0.5, 'height': 0.5}})

command! -bang NotesiumNew
  \ execute ":e" system("notesium new")

command! -bang NotesiumWeb
  \ let s:options = "--stop-on-idle --open-browser" |
  \ execute ":silent !nohup notesium web ".s:options." > /dev/null 2>&1 &"

command! -bang -nargs=* NotesiumList
  \ let s:spec = {'dir': $NOTESIUM_DIR, 'options': '+s -d : --with-nth 3..'} |
  \ call fzf#vim#grep(
  \   'notesium list '.join(map(split(<q-args>), 'shellescape(v:val)'), ' '), 0,
  \   &columns > 79 ? fzf#vim#with_preview(s:spec, 'right', 'ctrl-/') : s:spec, <bang>0)

command! -bang -nargs=* NotesiumLinks
  \ let s:spec = {'dir': $NOTESIUM_DIR, 'options': '-d : --with-nth 3..'} |
  \ call fzf#vim#grep(
  \   'notesium links '.join(map(split(<q-args>), 'shellescape(v:val)'), ' '), 0,
  \   &columns > 79 ? fzf#vim#with_preview(s:spec, 'right', 'ctrl-/') : s:spec, <bang>0)

command! -bang -nargs=* NotesiumSearch
  \ let s:spec = {'dir': $NOTESIUM_DIR, 'options': '-d : --with-nth 3..'} |
  \ call fzf#vim#grep(
  \   'notesium lines '.join(map(split(<q-args>), 'shellescape(v:val)'), ' '), 0,
  \   &columns > 79 ? fzf#vim#with_preview(s:spec, 'right', 'ctrl-/') : s:spec, <bang>0)

command! -bang -nargs=* NotesiumDaily
  \ let s:cdate = empty(<q-args>) ? strftime('%Y-%m-%d') : <q-args> |
  \ let s:output = system('notesium new --verbose --ctime='.s:cdate.'T00:00:00') |
  \ let s:filepath = matchstr(s:output, 'path:\zs[^\n]*') |
  \ execute 'edit ' . s:filepath |
  \ if getline(1) =~ '^\s*$' |
  \   let s:epoch = matchstr(s:output, 'epoch:\zs[^\n]*') |
  \   call setline(1, '# ' . strftime('%b %d, %Y (%A)', s:epoch)) |
  \ endif

command! -bang -nargs=* NotesiumWeekly
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
  \ execute 'edit ' . s:filepath |
  \ if getline(1) =~ '^\s*$' |
  \   let s:weekFmt = s:startOfWeek == 0 ? '%U' : '%V' |
  \   let s:yearWeekStr = strftime('%G: Week' . s:weekFmt, s:weekBegEpoch) |
  \   let s:weekBegStr = strftime('%a %b %d', s:weekBegEpoch) |
  \   let s:weekEndStr = strftime('%a %b %d', s:weekBegEpoch + (6 * 86400)) |
  \   let s:title = printf('# %s (%s - %s)', s:yearWeekStr, s:weekBegStr, s:weekEndStr) |
  \   call setline(1, s:title) |
  \ endif

nnoremap <Leader>nn :NotesiumNew<CR>
nnoremap <Leader>nd :NotesiumDaily<CR>
nnoremap <Leader>nw :NotesiumWeekly<CR>
nnoremap <Leader>nl :NotesiumList --prefix=label --sort=alpha --color<CR>
nnoremap <Leader>nm :NotesiumList --prefix=mtime --sort=mtime --color<CR>
nnoremap <Leader>nc :NotesiumList --prefix=ctime --sort=ctime --color --date=2006-01<CR>
nnoremap <Leader>nb :NotesiumLinks --incoming <C-R>=expand("%:t")<CR><CR>
nnoremap <Leader>nk :NotesiumLinks --color <C-R>=expand("%:t")<CR><CR>
nnoremap <Leader>ns :NotesiumSearch --prefix=title --color<CR>
nnoremap <silent> <Leader>nW :NotesiumWeb<CR>

" overrides for journal
if $NOTESIUM_DIR =~ '**/journal/*'
  nnoremap <Leader>nl :NotesiumList --prefix=label --sort=mtime --color<CR>
endif
