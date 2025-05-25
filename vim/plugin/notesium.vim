" vim:foldmethod=marker

" Notesium configuration {{{1
" ----------------------------------------------------------------------------

if !exists('g:notesium_bin') || empty(g:notesium_bin)
  let g:notesium_bin = 'notesium'
endif

if !exists('g:notesium_mappings') || empty(g:notesium_mappings)
  let g:notesium_mappings = 1
endif

if !exists('g:notesium_weekstart') || empty(g:notesium_weekstart)
  let g:notesium_weekstart = 'monday'
endif

if !exists('g:notesium_window') || empty(g:notesium_window)
  let g:notesium_window = {'width': 0.85, 'height': 0.85}
endif

if !exists('g:notesium_window_small') || empty(g:notesium_window_small)
  let g:notesium_window_small = {'width': 0.5, 'height': 0.5}
endif

if !executable(g:notesium_bin)
  echoerr "notesium_bin not found: " . g:notesium_bin
  finish
endif

function! notesium#get_notesium_dir() abort
  let l:output = systemlist(g:notesium_bin . ' home')
  if empty(l:output) || v:shell_error
    echoerr "Failed to get NOTESIUM_DIR - " . join(l:output, "\n")
    return ''
  endif
  return l:output[0]
endfunction

let $NOTESIUM_DIR = notesium#get_notesium_dir()

" Notesium finder {{{1
" ----------------------------------------------------------------------------

if has('nvim')

  function! notesium#finder(config) abort
    " Set light or dark theme
    let $NOTESIUM_FINDER_THEME = &background

    " Prepare command
    let l:cmd = g:notesium_bin . ' finder ' . get(a:config, 'options', '')
    let l:cmd .= ' -- ' . get(a:config, 'input', '')

    " Set window dimensions
    let l:width = float2nr(&columns * get(a:config['window'], 'width', 1))
    let l:height = float2nr(&lines * get(a:config['window'], 'height', 1))
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

    " Set context and start the finder
    let s:finder_ctx = { 'buf': l:buf, 'callback': a:config['callback'] }
    call termopen(l:cmd, { 'on_exit': function('notesium#finder_on_exit') })

    " Focus the terminal and switch to insert mode
    call nvim_set_current_win(l:win)
    call feedkeys('i', 'n')
  endfunction

  function! notesium#finder_on_exit(job_id, exit_code, _signal) abort
    " Unpack the context and cleanup
    let l:buf = s:finder_ctx.buf
    let l:Callback = s:finder_ctx.callback
    unlet s:finder_ctx

    " Capture buffer output, cleanup and validate
    let l:output = trim(join(getbufline(l:buf, 1, '$'), "\n"))
    if bufexists(l:buf)
      execute 'bwipeout!' l:buf
    endif
    if empty(l:output) || a:exit_code == 130
      return
    endif
    if a:exit_code != 0
      echoerr printf("Finder error (%d): %s", a:exit_code, l:output)
      return
    endif

    " Parse output (filename:linenumber: text) and pass to callback
    let l:parts = split(l:output, ':')
    if len(l:parts) < 3
      echoerr "Invalid finder output: " . l:output
      return
    endif
    let l:text = trim(join(l:parts[2:], ':'))
    call l:Callback(l:parts[0], l:parts[1], l:text)
  endfunction

else

  function! notesium#finder(config) abort
    " Set light or dark theme
    let $NOTESIUM_FINDER_THEME = &background

    " Prepare the command
    let l:cmd = g:notesium_bin . ' finder ' . get(a:config, 'options', '')
    let l:cmd .= ' -- ' . get(a:config, 'input', '')

    " Start the finder
    let l:output = system(l:cmd)
    redraw!
    if empty(l:output) || v:shell_error
      return
    endif

    " Parse output (filename:linenumber: text) and pass to callback
    let l:parts = split(l:output, ':')
    if len(l:parts) < 3
        echoerr "Invalid finder output: " . l:output
        return
    endif
    let l:text = join(l:parts[2:], ':')
    let l:text = substitute(l:text, '^\_s\+\|\_s\+$', '', 'g')
    silent! call a:config['callback'](l:parts[0], l:parts[1], l:text)
  endfunction

endif

" Notesium finder callbacks {{{1
" ----------------------------------------------------------------------------

function! notesium#finder_callback_editfile(filename, linenumber, text) abort
  let l:file_path = fnamemodify($NOTESIUM_DIR, ':p') . a:filename
  execute 'edit' fnameescape(l:file_path)
  execute a:linenumber . 'normal! zz'
endfunction

function! notesium#finder_callback_insertlink(filename, linenumber, text) abort
  let l:link = printf("[%s](%s)", a:text, a:filename)
  call feedkeys((mode() == 'i' ? '' : 'a') . l:link, 'n')
endfunction

" Notesium note deletion {{{1
" ----------------------------------------------------------------------------

function! notesium#delete_note_check_file(filepath, filename, bufnr) abort
  if !filereadable(a:filepath)
    throw "The file does not exist:\n" . a:filepath
  endif
  if !(a:filename =~# '^[0-9a-f]\{8\}\.md$')
    throw "The file does not match the filename format: " . a:filename
  endif
endfunction

function! notesium#delete_note_check_buffer(filepath, filename, bufnr) abort
  if a:bufnr == -1
    throw "The file is not associated with an active buffer: " . a:filepath
  endif
  if getbufvar(a:bufnr, '&modified')
    throw "The file has unsaved changes. Save or discard before deleting."
  endif

  let l:buflines = getbufline(a:bufnr, 1, '$')
  let l:filelines = readfile(a:filepath)
  if l:buflines ==# [''] | let l:buflines = [] | endif
  if empty(l:filelines) | let l:filelines = [] | endif
  if l:buflines !=# l:filelines
    throw "The file on disk differs from the loaded buffer."
  endif
endfunction

function! notesium#delete_note_check_path(filepath, filename, bufnr) abort
  let l:expected = fnamemodify(expand($NOTESIUM_DIR) . '/' . a:filename, ':p')
  let l:expected = simplify(resolve(l:expected))
  let l:current = simplify(resolve(a:filepath))
  if l:current !=# l:expected
    throw join([
      \ 'The file is not located in the expected path per NOTESIUM_DIR.',
      \ 'Expected: ' . l:expected,
      \ 'Current:  ' . l:current
      \ ], "\n")
  endif
endfunction

function! notesium#delete_note_check_links(filepath, filename, bufnr) abort
  let l:cmd = g:notesium_bin.' links ' . shellescape(a:filename) . ' --incoming'
  let l:output = systemlist(l:cmd)
  if v:shell_error || !empty(l:output)
    let l:reason = v:shell_error
      \ ? 'Failed to check for IncomingLinks'
      \ : 'Refusing to delete. Note has IncomingLinks'
    throw l:reason . ":\n" . join(l:output, "\n")
  endif
endfunction

function! notesium#delete_note() abort
  let l:filepath = expand('%:p')
  let l:filename = fnamemodify(l:filepath, ':t')
  let l:bufnr = bufnr(l:filepath)

  try
    call notesium#delete_note_check_file(l:filepath, l:filename, l:bufnr)
    call notesium#delete_note_check_buffer(l:filepath, l:filename, l:bufnr)
    call notesium#delete_note_check_path(l:filepath, l:filename, l:bufnr)
    call notesium#delete_note_check_links(l:filepath, l:filename, l:bufnr)
  catch /^.*/
    echoerr v:exception
    return
  endtry

  " User confirmation
  let l:info = getbufline(l:bufnr, 1)[0] . "\n" . l:filepath
  if confirm("Delete note?\n" . l:info, "&Yes\n&No", 2) != 1
    echo "User aborted"
    return
  endif

  " Proceed with deletion
  if delete(l:filepath) != 0
    echoerr "Failed to delete file: " . l:filepath
    return
  endif
  execute 'bdelete!' l:bufnr
  echo "Deleted: " . l:filepath
endfunction

" Notesium commands {{{1
" ----------------------------------------------------------------------------

command! NotesiumNew
  \ execute ":e" system(g:notesium_bin . ' new')

command! NotesiumDeleteNote
  \ call notesium#delete_note()

command! -nargs=* NotesiumInsertLink
  \ call notesium#finder({
  \   'input': 'list ' . join(map(split(<q-args>), 'shellescape(v:val)'), ' '),
  \   'options': '--prompt=NotesiumInsertLink',
  \   'callback': function('notesium#finder_callback_insertlink'),
  \   'window': (&columns > 89 ? g:notesium_window_small : g:notesium_window) })

command! -nargs=* NotesiumList
  \ call notesium#finder({
  \   'input': 'list ' . join(map(split(<q-args>), 'shellescape(v:val)'), ' '),
  \   'options': '--prompt=NotesiumList' . (&columns > 89 ? ' --preview' : ''),
  \   'callback': function('notesium#finder_callback_editfile'),
  \   'window': g:notesium_window })

command! -bang -nargs=* NotesiumLinks
  \ let s:is_note = expand("%:t") =~# '^[0-9a-f]\{8\}\.md$' |
  \ let s:filename = ("<bang>" == "!" && s:is_note) ? expand("%:t") : '' |
  \ let s:args = <q-args> . (!empty(s:filename) ? ' ' . s:filename : '') |
  \ call notesium#finder({
  \   'input': 'links ' . join(map(split(s:args), 'shellescape(v:val)'), ' '),
  \   'options': '--prompt=NotesiumLinks' . (&columns > 89 ? ' --preview' : ''),
  \   'callback': function('notesium#finder_callback_editfile'),
  \   'window': g:notesium_window })

command! -nargs=* NotesiumLines
  \ call notesium#finder({
  \   'input': 'lines ' . join(map(split(<q-args>), 'shellescape(v:val)'), ' '),
  \   'options': '--prompt=NotesiumLines' . (&columns > 89 ? ' --preview' : ''),
  \   'callback': function('notesium#finder_callback_editfile'),
  \   'window': g:notesium_window })

command! -nargs=* NotesiumDaily
  \ let s:cdate = empty(<q-args>) ? strftime('%Y-%m-%d') : <q-args> |
  \ let s:output = system(g:notesium_bin.' new --verbose --ctime='.s:cdate.'T00:00:00') |
  \ let s:filepath = matchstr(s:output, 'path:\zs[^\n]*') |
  \ execute 'edit' fnameescape(s:filepath) |
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
  \ let s:output = system(g:notesium_bin.' new --verbose --ctime='.s:date.'T00:00:01') |
  \ let s:epoch = str2nr(matchstr(s:output, 'epoch:\zs[^\n]*')) |
  \ let s:day = strftime('%u', s:epoch) |
  \ let s:diff = (s:day - s:startOfWeek + 7) % 7 |
  \ let s:weekBegEpoch = s:epoch - (s:diff * 86400) |
  \ let s:weekBegDate = strftime('%Y-%m-%d', s:weekBegEpoch) |
  \ let s:output = system(g:notesium_bin.' new --verbose --ctime='.s:weekBegDate.'T00:00:01') |
  \ let s:filepath = matchstr(s:output, 'path:\zs[^\n]*') |
  \ execute 'edit' fnameescape(s:filepath) |
  \ if getline(1) =~ '^\s*$' |
  \   let s:weekFmt = s:startOfWeek == 0 ? '%U' : '%V' |
  \   let s:yearWeekStr = strftime('%G: Week' . s:weekFmt, s:weekBegEpoch) |
  \   let s:weekBegStr = strftime('%a %b %d', s:weekBegEpoch) |
  \   let s:weekEndStr = strftime('%a %b %d', s:weekBegEpoch + (6 * 86400)) |
  \   let s:title = printf('# %s (%s - %s)', s:yearWeekStr, s:weekBegStr, s:weekEndStr) |
  \   call setline(1, s:title) |
  \ endif

command! -nargs=* NotesiumWeb
  \ let s:r_args = ["--stop-on-idle", "--open-browser"] |
  \ let s:q_args = filter(split(<q-args>), 'index(s:r_args, v:val) == -1') + s:r_args |
  \ let s:args = join(map(s:q_args, 'shellescape(v:val)'), ' ') |
  \ if has('unix') |
  \   execute ":silent !nohup ".g:notesium_bin." web ".s:args." > /dev/null 2>&1 &" |
  \ elseif has('win32') || has('win64') |
  \   execute ":silent !powershell -Command \"Start-Process -NoNewWindow ".g:notesium_bin." -ArgumentList 'web ".s:args."'\"" |
  \ else |
  \   throw "Unsupported platform" |
  \ endif

" Notesium mappings {{{1
" ----------------------------------------------------------------------------

if g:notesium_mappings
  autocmd BufRead,BufNewFile $NOTESIUM_DIR/*.md inoremap <buffer> [[ <Esc>:NotesiumInsertLink --sort=mtime<CR>
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
