## design / assumptions

- notes are written in pure markdown.
- completely flat folder structure (no nested folders).
- filenames are 8 random hex chars, with `.md` extension (`xxxxxxxx.md`).
- first line of note is the title in h1 format (`# this is the title`).

## vim

```vim
let $NOTESIUM_DIR = trim(system("notesium home"))

command! -bang NotesiumNew
  \ execute ":e" system("notesium new")

command! -bang NotesiumList
  \ let spec = {'dir': $NOTESIUM_DIR} |
  \ call fzf#vim#grep(
  \   'notesium list', 0,
  \   &columns > 79 ? fzf#vim#with_preview(spec) : spec, <bang>0)

nnoremap <Leader>nn :NotesiumNew<CR>
nnoremap <Leader>nl :NotesiumList<CR>
```
