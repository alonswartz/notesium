## design / assumptions

- notes are written in pure markdown.
- completely flat folder structure (no nested folders).
- filenames are 8 random hex chars, with `.md` extension (`xxxxxxxx.md`).
- first line of note is the title in h1 format (`# this is the title`).

## vim

```vim
let $NOTESIUM_DIR = trim(system("notesium home"))

autocmd BufRead,BufNewFile $NOTESIUM_DIR/*.md inoremap <expr> [[ fzf#vim#complete({
  \ 'source':  'notesium list --sort',
  \ 'options': '--with-nth 2..',
  \ 'reducer': {l->"[". split(l[0],':1: ')[1] ."](".split(l[0],':')[0].")"},
  \ 'window': {'width': 0.85, 'height': 0.85}})

command! -bang NotesiumNew
  \ execute ":e" system("notesium new")

command! -bang NotesiumList
  \ let spec = {'dir': $NOTESIUM_DIR, 'options': '--with-nth 2..'} |
  \ call fzf#vim#grep(
  \   'notesium list --sort', 0,
  \   &columns > 79 ? fzf#vim#with_preview(spec) : spec, <bang>0)

nnoremap <Leader>nn :NotesiumNew<CR>
nnoremap <Leader>nl :NotesiumList<CR>
```
