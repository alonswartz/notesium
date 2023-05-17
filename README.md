Notesium (pronounced *no-tes-ee-im*), is an opiniated, simplistic yet
powerful system for creating, storing and accessing knowledge by means
of *notes*.

It aspires and is designed to:

- Do one thing, and do it well - per the unix philosophy.
- Support the concepts of [Evergreen notes](https://notes.andymatuschak.org/z4SDCZQeRo4xFEQ8H4qrSqd68ucpgE6LU155C) and [Zettelkasten](https://en.wikipedia.org/wiki/Zettelkasten).
- Be used with your own text editor (e.g., [Vim integration](#vim)).
- Be used with a local folder of markdown files.
- Be as close to zero friction as possible.
- Be lightweight and fast.

> Warning: Experimental, proof-of-concept. Here be dragons!

## Table of contents

- [Features](#features)
- [Screenshots](#screenshots)
- [CLI](#cli)
    - [Installation](#installation)
    - [Usage](#usage)
- [Vim](#vim)
    - [Example integration](#example-integration)
    - [Keybindings](#keybindings)
    - [Fzf search syntax](#fzf-search-syntax)
    - [Related Vim settings](#related-vim-settings)
- [Custom URI protocol](#custom-uri-protocol)
    - [Example integration](#example-integration-1)
    - [Handler registration](#handler-registration)
- [Design assumptions and rationale](#design-assumptions-and-rationale)
    - [Filenames are 8 hexidecimal digits](#filenames-are-8-hexidecimal-digits)
    - [Completely flat directory structure](#completely-flat-directory-structure)
    - [Titles are inferred from the first line](#titles-are-inferred-from-the-first-line)
    - [Notes with one-word titles are considered labels](#notes-with-one-word-titles-are-considered-labels)
    - [Links are inline](#links-are-inline)
- [Regression tests](#regression-tests)
- [Inspiration and thanks](#inspiration-and-thanks)
- [License](#license)

## Features

- Blazingly fast and powerful fuzzy search (fzf).
- Preview notes and links, line highlight where relevant (bat).
- Explore notes, their links and clusters with the force graph view (D3.js).
- No need to think what to name the file, or which folder to save it in.
- Instantly create a new note with a keybinding.
- Structure emerges organically by use of bi-directional links.
- Creating, listing, previewing and following links is frictionless.
- List: Display a list of all notes in the entire system.
- List: Sort the list alphabetically, by date created or date modified.
- List: Prefix titles with associated labels, date created or date modified.
- List: Customizable date format for prefixed date created or date modified.
- List: Limit the list to label notes (one-word titles).
- List: Limit the list to orphan notes (no incoming or outgoing links).
- Links: Quickly search and insert an automatically formatted link.
- Links: Display a list of all links in the entire system.
- Links: Display a list of all related links to the current note.
- Links: Limit the list to incoming links to the current note.
- Links: Limit the list to outgoing links from the current note.
- Links: Display a list of broken links and jump there instantly.
- Lines: Full text search across all notes in the entire system.
- Stats: Counts of notes, labels, orphans, links, lines, words, etc.
- Graph: Generate raw data or encoded url for browsing the graph.
- Graph: Customizable node link format for opening notes.
- Graph: Dynamic node size relative to bi-directional link count.
- Graph: Emphasize nodes and their links using search filter or node click.
- Graph: Tweak forces such as repel force, collide radius and strength.
- Graph: Drag, pan or zoom the graph for a better view or focus.
- Graph: Customize labels visibility or automatically scaled per zoom level.
- No caching or preprocessing: Everything is computed on the fly.

## Screenshots

*Graph: display all notes and links in a force graph view*
![image: force graph](https://www.notesium.com/images/screenshot-1682577852.png)
<br/>

*Graph: filter notes with emphasized matches in force graph view*
![image: force graph filtered](https://www.notesium.com/images/screenshot-1682579228.png)
<br/>

*Graph: force graph view dark mode enabled*
![image: force graph darkmode](https://www.notesium.com/images/screenshot-1682941869.png)
<br/>

*List: prefixed with associated labels and sorted alphabetically*
![image: prefixed label](https://www.notesium.com/images/screenshot-1681733208.png)
<br/>

*List: prefixed with modification date and sorted per modification time*
![image: prefixed mtime](https://www.notesium.com/images/screenshot-1681733355.png)
<br/>

*Links: display all links*
![image: links all](https://www.notesium.com/images/screenshot-1681733482.png)
<br/>

*Links: display links related to the current note*
![image: links related](https://www.notesium.com/images/screenshot-1681733712.png)
<br/>

*Links: link insertion triggered by `[[`*
![image: link insertion](https://www.notesium.com/images/screenshot-1681734183.png)
<br/>

*Lines: full text search (light theme)*
![image: full text search light](https://www.notesium.com/images/screenshot-1681734555.png)
<br/>

## CLI

Notesium is currently implemented as a simple shell script leveraging
basic UNIX utilities. It has only been tested on Linux.

### Installation

```bash
git clone https://github.com/alonswartz/notesium.git
ln -s $(pwd)/notesium/notesium.sh $HOME/.local/bin/notesium
```

### Usage

```
$ notesium help
Usage: notesium COMMAND [OPTIONS]

Commands:
  new               Print path for a new note
  home              Print path to notes directory
  list              Print list of notes
    --color         Color code prefix using ansi escape sequences
    --labels        Limit list to only label notes (ie. one word title)
    --orphans       Limit list to notes without outgoing or incoming links
    --match=PATTERN Limit list to notes where pattern appears
    --sort=WORD     Sort list by date or alphabetically (ctime|mtime|alpha)
    --prefix=WORD   Prefix title with date or linked label (ctime|mtime|label)
    --date=FORMAT   Date format for ctime/mtime prefix (default: %F)
  links [filename]  Print list of links
    --color         Color code using ansi escape sequences
    --outgoing      Limit list to outgoing links related to filename
    --incoming      Limit list to incoming links related to filename
    --dangling      Limit list to broken links
  lines             Print all lines of notes (ie. fulltext search)
    --color         Color code prefix using ansi escape sequences
    --prefix=title  Prefix each line with note title
  stats             Print statistics
    --color         Color code using ansi escape sequences
    --table         Format as table with whitespace delimited columns
    --fmtnum        Format counts with thousands separator using a comma
  graph             Print graph data
    --encoded-url   Encode graph data in base64 and append to graph file url
    --href=FORMAT   Node links format (default: file://%:p:h/%:t)

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
  \ 'options': '-d : --with-nth 3.. --prompt "NotesiumInsertLink> "',
  \ 'reducer': {l->"[". split(l[0],':1: ')[1] ."](".split(l[0],':')[0].")"},
  \ 'window': {'width': 0.5, 'height': 0.5}})

command! -bang NotesiumNew execute
  \ ":e" system("notesium new")

command! -bang NotesiumGraph execute
  \ ":silent !notesium graph --encoded-url | xargs -r -n 1 x-www-browser "

command! -bang -nargs=* NotesiumList
  \ let spec = {'dir': $NOTESIUM_DIR, 'options': '-d : --with-nth 3..'} |
  \ call fzf#vim#grep(
  \   'notesium list '.shellescape(<q-args>), 0,
  \   &columns > 79 ? fzf#vim#with_preview(spec, 'right', 'ctrl-/') : spec, <bang>0)

command! -bang -nargs=* NotesiumLinks
  \ let spec = {'dir': $NOTESIUM_DIR, 'options': '-d : --with-nth 3..'} |
  \ call fzf#vim#grep(
  \   'notesium links '.shellescape(<q-args>), 0,
  \   &columns > 79 ? fzf#vim#with_preview(spec, 'right', 'ctrl-/') : spec, <bang>0)

command! -bang -nargs=* NotesiumSearch
  \ let spec = {'dir': $NOTESIUM_DIR, 'options': '-d : --with-nth 3..'} |
  \ call fzf#vim#grep(
  \   'notesium lines '.shellescape(<q-args>), 0,
  \   &columns > 79 ? fzf#vim#with_preview(spec, 'right', 'ctrl-/') : spec, <bang>0)

nnoremap <Leader>nn :NotesiumNew<CR>
nnoremap <Leader>nl :NotesiumList --prefix=label --sort=alpha --color<CR>
nnoremap <Leader>nm :NotesiumList --prefix=mtime --sort=mtime --color<CR>
nnoremap <Leader>nc :NotesiumList --prefix=ctime --sort=ctime --color --date=%Y/Week%U<CR>
nnoremap <Leader>nb :NotesiumLinks --incoming <C-R>=expand("%:t")<CR><CR>
nnoremap <Leader>nk :NotesiumLinks --color <C-R>=expand("%:t")<CR><CR>
nnoremap <Leader>ns :NotesiumSearch --prefix=title --color<CR>
nnoremap <silent> <Leader>ng :NotesiumGraph<CR>
```

### Keybindings

| Mode   | Binding           | Comment
| ----   | --------          | -------
| insert | `[[`              | Opens note list, insert selection as markdown formatted link
| normal | `<Leader>nn`      | Opens new note for editing
| normal | `<Leader>ng`      | Opens browser with graph view
| normal | `<Leader>nl`      | List with prefixed label, sorted by alphabetically
| normal | `<Leader>nm`      | List with prefixed date modified, sorted by mtime
| normal | `<Leader>nc`      | List with prefixed date created in custom format, sorted by ctime
| normal | `<Leader>nb`      | List all notes linking to this note (backlinks)
| normal | `<Leader>nk`      | List all links related to this note
| normal | `<Leader>ns`      | Full text search
| fzf    | `C-k` `C-j`       | Move up and down in fzf window
| fzf    | `enter`           | Open selection
| fzf    | `C-t` `C-x` `C-v` | Open selection in new tab, split, vertical split
| fzf    | `C-/`             | Toggle preview
| fzf    | `Shift-Tab`       | Multiple selection
| normal | `ge`              | Open the link under the cursor (vim-markdown)
| normal | `[[` `]]`         | Jump back and forward between headings (vim-markdown)

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

### Related Vim settings

```vim
" junegunn/fzf.vim
let $FZF_DEFAULT_OPTS="--reverse --filepath-word --no-separator --no-scrollbar "
let g:fzf_buffers_jump = 1
let g:fzf_layout = { 'window': { 'width': 0.85, 'height': 0.85 } }
let g:fzf_colors = {
    \ 'fg':      ['fg', 'Normal'],
    \ 'bg':      ['bg', 'Normal'],
    \ 'hl':      ['fg', 'Comment'],
    \ 'fg+':     ['fg', 'CursorLine', 'CursorColumn', 'Normal'],
    \ 'bg+':     ['bg', 'CursorLine', 'CursorColumn'],
    \ 'hl+':     ['fg', 'Statement'],
    \ 'info':    ['fg', 'PreProc'],
    \ 'pointer': ['fg', 'Exception'],
    \ 'marker':  ['fg', 'Keyword'],
    \ 'spinner': ['fg', 'Label'],
    \ 'header':  ['fg', 'Comment'] }

" preservim/vim-markdown
let g:vim_markdown_folding_style_pythonic = 1
let g:vim_markdown_folding_level = 2
let g:vim_markdown_frontmatter = 1
let g:vim_markdown_auto_insert_bullets = 0
let g:vim_markdown_new_list_item_indent = 0
let g:vim_markdown_toc_autofit = 1
let g:vim_markdown_conceal_code_blocks = 0

let g:markdown_fenced_languages = ['json', 'sh', 'shell=bash']
hi def link mkdHeading htmlH1
autocmd FileType markdown setlocal conceallevel=2
```

## Custom URI protocol

Notesium does not support handling the custom URI protocol `notesium://`
itself directly, as this is very dependent on user preference. It is up
to the user to write their own script.

### Example integration

An example integration can been found in `contrib/xdg-urxvt-nvim.sh`,
which supports opening the notes listing as well as opening a note for
editing - in a new urxvt terminal window and neovim instance.

```bash
xdg-open notesium:///home/user/notes
xdg-open notesium:///home/user/notes/625d563f.md
```

Opening the listing is useful when integrated with a launcher or desktop
keybinding. Opening a note for editing is useful, for example, when
integrated with the `graph`:

```vim
command! -bang NotesiumGraph execute
  \ ":silent !notesium graph --encoded-url --href='notesium://\\%:p:h/\\%:t' | xargs -r -n 1 x-www-browser "
```

### Handler registration

To register the `x-scheme-handler` with the desktop environment, create the
file `$HOME/.local/share/applications/notesium.desktop` with contents
similar to the following (don't forget to update the `Exec` path):

```
[Desktop Entry]
Name=Notesium
Exec=/home/github/alonswartz/notesium/contrib/xdg-urxvt-nvim.sh %u
MimeType=x-scheme-handler/notesium;
Type=Application
Terminal=false
NoDisplay=true
```

## Design assumptions and rationale

### Filenames are 8 hexidecimal digits

> There are only two hard things in Computer Science: cache invalidation
> and naming things. ~ Phil Karlton

Naming is hard. With regards to notes, common conventions are to use the
current date, or note title, or both in concatenated form.

- **Titles**: Considering notes evolve, it is likely not to be certain
  exactly what the note will encompass. And even if it is, having to
  decide on a title can paralyze or cause cognitive overload prior to
  writing the content. Existing and future collisions also need to be
  accounted for. If a better title is thought of later, or the context
  of the note changes, renaming the file would break existing links.

- **Dates**: The current timestamp seems like a good choice, but depending
  on the format used, it could result in overly long filenames, especially
  considering the uniqueness requirement. Additionally, timezones and
  daylight saving could result in collisions and interfere with sorting.

Notesium addresses this by using the UNIX epoch time, and further
encoding it in hexidecimal, resulting in 8 characters for the identifier
(e.g., `625d563f.md`). This can later be easily decoded and formatted
depending on the use case.

The `.md` extension is required so external tools can easily identify
the filetype for syntax highlighting, as well as limit the processing of
files by the parser.

NOTE: Previous versions of Notesium used 8 **random** hexidecimal digits.
To aid in conversion, `contrib/ctimehex.sh` can be used to rename all
files to the new format as well as update all links. The ctime used
will be that of the first git commit or mtime of the file, whichever is
eariler.

### Completely flat directory structure

It is better to [prefer associative ontologies to hierarchical taxonomies](https://notes.andymatuschak.org/z29hLZHiVt7W2uss2uMpSZquAX5T6vaeSF6Cy).

Folders are often thought of as categories, but notes don't always fit
neatly into just one category, which could result in decision paralysis
when creating a new note, and can prematurely constrain what may emerge.

Links would also be broken when renaming a folder or moving a note from
one folder to another.

Notesium assumes a flat directory structure, having all notes be
siblings to one another, in one directory. Utilizing bi-directional
links allows for the structure to emerge over time. Additionally, the
[label convention](#notes-with-one-word-titles-are-considered-labels) allows for a meta-hierarchical taxonomy to be created
which can be useful in certain circumstances.

### Titles are inferred from the first line

[Note titles are like APIs](https://notes.andymatuschak.org/z3XP5GRmd9z1D2qCE7pxUvbeSVeQuMiqz9x1C), and when titled well they become an
abstraction.

Notesium assumes note titles are on the first line of the note, in
markdown H1 format, for example: `# this is the title of a note`.

### Notes with one-word titles are considered labels

Even though [tags are an ineffective association structure](https://notes.andymatuschak.org/z3MzhvmesiD2htMaEFQJif7gJgyaHAQvKH49Z), Notesium
supports the concept of *labels*, but there is no special label syntax.
Instead, a *label* is just a regular note, and only considered a label
if its title is one-word.

This becomes useful, for example, when issuing the following `list`
command, each note title will be prefixed with its associated label
(multiple times for each associated label), color coded, and sorted
alphabetically, effectively creating a hierarchical taxonomy listing,
which can further be filtered and searched.

```bash
notesium list --prefix=label --sort=alpha --color
```

### Links are inline

[Notes should be densely linked](https://notes.andymatuschak.org/z2HUE4ABbQjUNjrNemvkTCsLa1LPDRuwh1tXC), allowing for structure to emerge
organically, and may even help you see unexpected connections which may
[surprise you](https://notes.andymatuschak.org/z4KZ9973AoHhvM9Pj5Qrds48JXNbMEwVJmVRw).

Notesium assumes note links use the inline markdown syntax, for example:
`[link text](625d563f.md)`. This makes it easier to parse, and simple to
insert links with a keybinding.

Even though links are short, for an improved reading experience in Vim
consider enabling `conceallevel` (see [Related Vim settings](#related-vim-settings)).

## Regression tests

Test suites for all commands and their options (except for `--color`)
are included in the `tests/` directory, along with `fixtures` acting as
a notes corpus. The tests are dependent on [bats-core](https://github.com/bats-core/bats-core).

Some tests are dependent on the modification datetime of the notes
(sorting and prefixing), in which case the test suite will duplicate the
corpus to a temporary directory and modify the `mtime` deterministically.

These test suites can be paused prior to teardown for manual inspection
and additional testing by setting the `PAUSE` environmental variable.

```bash
# run all test suites
bats tests

# run a specific test suite
bats tests/list.bats

# run a subset of tests within a specific test suite
bats tests/list.bats --filter "mtime"

# run a specific test suite, but pause prior to teardown (--tap recommended)
PAUSE=y bats tests/list.bats --tap
```

## Inspiration and thanks

- Niklas Luhmann: Zettelkasten method.
- Andy Matuschak: Insightful notes.
- Sonke Ahrens: How to take smart notes (book).
- Junegunn Choi: Fzf and Vim plugins.
- The people behind Vim and Neovim.
- The people behind D3.js.
- Projects such as Obsidian, Logseq, Roam Research, and countless others...

## License

The MIT License (MIT)

Copyright (c) 2023 Alon Swartz
