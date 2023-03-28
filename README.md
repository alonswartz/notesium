## Design / Assumptions

- BYOE (bring your own editor): [Vim](#vim).
- Notes are written in pure markdown, and stored locally.
- Completely flat folder structure (no nested folders).
- Filenames are 8 random hex chars, with `.md` extension (`xxxxxxxx.md`).
- First line of note is the title in h1 format (`# this is the title`).
- One word note titles are considered a label.
- Links are inline (`[link text](xxxxxxxx.md)`).

## CLI

```
$ notesium help
Usage: notesium COMMAND [OPTIONS]

Commands:
  new               Print path for a new note
  home              Print path to notes directory
  list              Print list of notes
    --color         Color code prefix using ansi escape sequences
    --labels        Limit list to only label notes (ie. one word title)
    --orphans       Limit list to notes without forward or back links
    --match=PATTERN Limit list to notes where pattern appears
    --sort=WORD     Sort list by title or modification time (mtime|title)
    --prefix=WORD   Include linked labels or modification date (mtime|label)
  links [filename]  Print list of links
    --color         Color code using ansi escape sequences
    --incoming      Limit list to incoming links related to filename
    --outgoing      Limit list to outgoing links related to filename
    --dangling      Limit list to broken links
  lines             Print all lines of notes (ie. fulltext search)
    --color         Color code prefix using ansi escape sequences
    --prefix=title  Include note title as prefix of each line

Environment:
  NOTESIUM_DIR      Path to notes directory (default: $HOME/notes)
```

## Vim

Notesium is not a Vim plugin, it is up to the user to write their own
Vim commands and configure keybindings. That said, below are some fairly
generic commands, with preferences configured in the keybindings.

- Dependencies: [fzf](https://github.com/junegunn/fzf) and [fzf.vim](https://github.com/junegunn/fzf.vim).
- Recommended: [bat](https://github.com/sharkdp/bat) for syntax highlighting in the preview.
- Recommended: [vim-markdown](https://github.com/preservim/vim-markdown) for general markdown goodness.
- Recommended: [goyo.vim](https://github.com/junegunn/goyo.vim) and [lightlight.vim](https://github.com/junegunn/limelight.vim) for distraction free writing.

### Example integration

```vim
let $NOTESIUM_DIR = trim(system("notesium home"))

autocmd BufRead,BufNewFile $NOTESIUM_DIR/*.md inoremap <expr> [[ fzf#vim#complete({
  \ 'source': 'notesium list --sort=mtime',
  \ 'options': '--with-nth 2.. --prompt "NotesiumInsertLink> "',
  \ 'reducer': {l->"[". split(l[0],':1: ')[1] ."](".split(l[0],':')[0].")"},
  \ 'window': {'width': 0.85, 'height': 0.85}})

command! -bang NotesiumNew
  \ execute ":e" system("notesium new")

command! -bang -nargs=* NotesiumList
  \ let prompt = '--prompt "NotesiumList> "' |
  \ let spec = {'dir': $NOTESIUM_DIR, 'options': '--with-nth 2.. '.prompt} |
  \ call fzf#vim#grep(
  \   'notesium list '.shellescape(<q-args>), 0,
  \   &columns > 79 ? fzf#vim#with_preview(spec, 'right', 'ctrl-/') : spec, <bang>0)

command! -bang -nargs=* NotesiumLinks
  \ let prompt = '--prompt "NotesiumLinks> "' |
  \ let spec = {'dir': $NOTESIUM_DIR, 'options': '--with-nth 2.. '.prompt} |
  \ call fzf#vim#grep(
  \   'notesium links '.shellescape(<q-args>), 0,
  \   &columns > 79 ? fzf#vim#with_preview(spec, 'right', 'ctrl-/') : spec, <bang>0)

command! -bang -nargs=* NotesiumSearch
  \ let prompt = '--prompt "NotesiumSearch> "' |
  \ let spec = {'dir': $NOTESIUM_DIR, 'options': ' --with-nth 2.. '.prompt} |
  \ call fzf#vim#grep(
  \   'notesium lines '.shellescape(<q-args>), 0,
  \   &columns > 79 ? fzf#vim#with_preview(spec, 'right', 'ctrl-/') : spec, <bang>0)

nnoremap <Leader>nn :NotesiumNew<CR>
nnoremap <Leader>nl :NotesiumList --prefix=label --sort=title --color<CR>
nnoremap <Leader>nm :NotesiumList --prefix=mtime --sort=mtime --color<CR>
nnoremap <Leader>nb :NotesiumLinks --incoming <C-R>=expand("%:t")<CR><CR>
nnoremap <Leader>nk :NotesiumLinks --color <C-R>=expand("%:t")<CR><CR>
nnoremap <Leader>ns :NotesiumSearch --prefix=title --color<CR>
```

### Keybindings

| Mode   | Binding           | Comment
| ----   | --------          | -------
| insert | `[[`              | Opens note list, insert selection as markdown formatted link
| normal | `<Leader>nn`      | Opens new note for editing
| normal | `<Leader>nl`      | List with prefixed label, sorted by title
| normal | `<Leader>nm`      | List with prefixed date modified, sorted by mtime
| normal | `<Leader>nb`      | List all notes linking to this note (backlinks)
| normal | `<Leader>nk`      | List all links related to this note
| normal | `<Leader>ns`      | Full text search
| fzf    | `C-k` `C-j`       | Move up and down in fzf window
| fzf    | `enter`           | Open selection
| fzf    | `C-t` `C-x` `C-v` | Open selection in new tab, split, vertical split
| fzf    | `C-/`             | Toggle preview
| normal | `ge`              | Open the link under the cursor (vim-markdown)

### Fzf search syntax

| Token        | Match Type                 | Comment
| ------------ | ----------                 | -------
| `sbtrkt`     | fuzzy-match                | Items that fuzzy match `sbtrkt`
| `'word`      | exact-match                | Items that include `word`
| `^word`      | prefix exact-match         | Items that start with `word`
| `word$`      | suffix exact-match         | Items that end with `word`
| `!word`      | inverse exact-match        | Items that do not include `word`
| `!^word`     | inverse prefix exact-match | Items that do not start with `word`
| `!word$`     | inverse suffix exact-match | Items that do not end with `word`
| `foo bar`    | multiple exact match (AND) | Items that include both `foo` AND `bar`
| `foo \| bar` | multiple exact match (OR)  | Items that include either `foo` OR `bar`

## Regression tests

Test suites for all commands and their options (except for `--color`)
are included in the `tests/` directory, along with `fixtures` acting as
a notes corpus. The tests are dependent on [bats-core](https://github.com/bats-core/bats-core).

Some tests are dependent on the modification datetime of the notes
(sorting and prefixing), in which case the test suite will duplicate the
corpus to a temporary directory and modify the `mtime` deterministically
based on the note hexadecimal ID.

```
# run all test suites
bats tests

# run a specific test suite
bats tests/list.bats

# run a subset of tests within a specific test suite
bats tests/list.bats --filter "mtime"
```

