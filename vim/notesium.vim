" vim:foldmethod=marker

let $NOTESIUM_DIR = trim(system("notesium home"))

if !exists('g:notesium_mappings')
  let g:notesium_mappings = 1
endif

if !exists('g:notesium_weekstart')
  let g:notesium_weekstart = 'monday'
endif

" Notesium finder {{{1
" ----------------------------------------------------------------------------

function! notesium#finder(config) abort
  " Prepare command
  let l:cmd = 'notesium finder ' . get(a:config, 'options', '')
  let l:cmd .= ' -- ' . get(a:config, 'input', '')

  " Set window dimensions
  let l:width = float2nr(&columns * get(a:config['window'], 'width', 0.85))
  let l:height = float2nr(&lines * get(a:config['window'], 'height', 0.85))
  let l:opts = {
    \ 'relative': 'editor',
    \ 'style': 'minimal',
    \ 'row': (&lines - l:height) / 2,
    \ 'col': (&columns - l:width) / 2,
    \ 'width': l:width,
    \ 'height': l:height }

  " Create buffer and floating window
  highlight link NormalFloat Normal
  let l:buf = nvim_create_buf(v:false, v:true)
  let l:win = nvim_open_win(l:buf, v:true, l:opts)

  " Make sure we're in normal mode and start finder
  call feedkeys("\<Esc>", 'n')
  call termopen(l:cmd, {
    \ 'on_exit': {
    \   job_id, exit_code, _ ->
    \   notesium#finder_finalize(exit_code, l:buf, a:config['callback']) }})

  " Focus the terminal and switch to insert mode
  call nvim_set_current_win(l:win)
  call feedkeys('i', 'n')
endfunction

function! notesium#finder_finalize(exit_code, buf, callback) abort
  " Capture buffer output, cleanup and validate
  let l:output = trim(join(getbufline(a:buf, 1, '$'), "\n"))
  if bufexists(a:buf)
    execute 'bwipeout!' a:buf
  endif
  if empty(l:output) || a:exit_code == 130
    return
  endif
  if a:exit_code != 0
    echoerr printf("Finder error (%d): %s", a:exit_code, l:output)
    return
  endif

  " Parse output (filename:linenumber:text) and pass to callback
  let l:parts = split(l:output, ':', 3)
  if len(l:parts) < 3
    echoerr "Invalid finder output: " . l:output
    return
  endif
  call a:callback(l:parts[0], l:parts[1], trim(l:parts[2]))
endfunction

" Notesium finder callbacks {{{1
" ----------------------------------------------------------------------------

function! notesium#finder_callback_editfile(filename, linenumber, text) abort
  let l:file_path = fnamemodify($NOTESIUM_DIR, ':p') . a:filename
  execute 'edit' fnameescape(l:file_path)
  execute a:linenumber . 'normal! zz'
endfunction

function! notesium#finder_callback_insertlink(filename, linenumber, text) abort
  let l:link = printf("[%s](%s)", a:text, a:filename)
  call feedkeys("a" . l:link, 'n')
endfunction

" Notesium commands {{{1
" ----------------------------------------------------------------------------

command! NotesiumNew
  \ execute ":e" system("notesium new")

command! -nargs=* NotesiumInsertLink
  \ call notesium#finder({
  \   'input': 'list ' . join(map(split(<q-args>), 'shellescape(v:val)'), ' '),
  \   'options': '--prompt=NotesiumInsertLink',
  \   'callback': function('notesium#finder_callback_insertlink'),
  \   'window': {'width': 0.5, 'height': 0.5} })

command! -nargs=* NotesiumList
  \ call notesium#finder({
  \   'input': 'list ' . join(map(split(<q-args>), 'shellescape(v:val)'), ' '),
  \   'options': '--prompt=NotesiumList' . (&columns > 79 ? ' --preview' : ''),
  \   'callback': function('notesium#finder_callback_editfile'),
  \   'window': {'width': 0.85, 'height': 0.85} })

command! -bang -nargs=* NotesiumLinks
  \ let s:is_note = expand("%:t") =~# '^[0-9a-f]\{8\}\.md$' |
  \ let s:filename = ("<bang>" == "!" && s:is_note) ? expand("%:t") : '' |
  \ let s:args = <q-args> . (!empty(s:filename) ? ' ' . s:filename : '') |
  \ call notesium#finder({
  \   'input': 'links ' . join(map(split(s:args), 'shellescape(v:val)'), ' '),
  \   'options': '--prompt=NotesiumLinks' . (&columns > 79 ? ' --preview' : ''),
  \   'callback': function('notesium#finder_callback_editfile'),
  \   'window': {'width': 0.85, 'height': 0.85} })

command! -nargs=* NotesiumLines
  \ call notesium#finder({
  \   'input': 'lines ' . join(map(split(<q-args>), 'shellescape(v:val)'), ' '),
  \   'options': '--prompt=NotesiumLines' . (&columns > 79 ? ' --preview' : ''),
  \   'callback': function('notesium#finder_callback_editfile'),
  \   'window': {'width': 0.85, 'height': 0.85} })

command! -nargs=* NotesiumDaily
  \ let s:cdate = empty(<q-args>) ? strftime('%Y-%m-%d') : <q-args> |
  \ let s:output = system('notesium new --verbose --ctime='.s:cdate.'T00:00:00') |
  \ let s:filepath = matchstr(s:output, 'path:\zs[^\n]*') |
  \ execute 'edit ' . s:filepath |
  \ if getline(1) =~ '^\s*$' |
  \   let s:epoch = matchstr(s:output, 'epoch:\zs[^\n]*') |
  \   call setline(1, '# ' . strftime('%b %d, %Y (%A)', s:epoch)) |
  \ endif

command! -nargs=* NotesiumWeekly
  \ let s:daysMap = {'sunday': 0, 'monday': 1, 'tuesday': 2,'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6} |
  \ let s:startOfWeek = get(s:daysMap, g:notesium_weekstart, -1) |
  \ if s:startOfWeek == -1 |
  \   throw "Invalid g:notesium_weekstart: " . g:notesium_weekstart |
  \ endif |
  \ let s:date = empty(<q-args>) ? strftime('%Y-%m-%d') : <q-args> |
  \ let s:output = system('notesium new --verbose --ctime='.s:date.'T00:00:01') |
  \ let s:epoch = str2nr(matchstr(s:output, 'epoch:\zs[^\n]*')) |
  \ let s:day = strftime('%u', s:epoch) |
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

command! NotesiumWeb
  \ let s:args = "--stop-on-idle --open-browser" |
  \ if has('unix') |
  \   execute ":silent !nohup notesium web ".s:args." > /dev/null 2>&1 &" |
  \ elseif has('win32') || has('win64') |
  \   execute ":silent !powershell -Command \"Start-Process -NoNewWindow notesium -ArgumentList 'web ".s:args."'\"" |
  \ else |
  \   throw "Unsupported platform" |
  \ endif

" Notesium mappings {{{1
" ----------------------------------------------------------------------------

if g:notesium_mappings
  autocmd BufRead,BufNewFile $NOTESIUM_DIR/*.md inoremap <buffer> <expr> [[ execute(':NotesiumInsertLink --sort=mtime')
  nnoremap <Leader>nn :NotesiumNew<CR>
  nnoremap <Leader>nd :NotesiumDaily<CR>
  nnoremap <Leader>nw :NotesiumWeekly<CR>
  nnoremap <Leader>nl :NotesiumList --prefix=label --sort=alpha --color<CR>
  nnoremap <Leader>nm :NotesiumList --prefix=mtime --sort=mtime --color<CR>
  nnoremap <Leader>nc :NotesiumList --prefix=ctime --sort=ctime --color --date=2006/Week%V<CR>
  nnoremap <Leader>nk :NotesiumLinks! --color<CR>
  nnoremap <Leader>ns :NotesiumLines --prefix=title --color<CR>
  nnoremap <silent> <Leader>nW :NotesiumWeb<CR>

  " overrides
  if g:notesium_weekstart ==# 'sunday'
    nnoremap <Leader>nc :NotesiumList --prefix=ctime --sort=ctime --color --date=2006/Week%U<CR>
  endif

  if $NOTESIUM_DIR =~ '**/journal/*'
    nnoremap <Leader>nl :NotesiumList --prefix=label --sort=mtime --color<CR>
  endif
endif
