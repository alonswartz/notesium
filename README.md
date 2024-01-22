Notesium (pronounced *no-tes-ee-im*), is an opiniated, simplistic yet
powerful system for creating, storing and accessing knowledge by means
of *notes*.

It aspires and is designed to:

- Do one thing, and do it well - per the unix philosophy.
- Support the concepts of [Evergreen notes](https://notes.andymatuschak.org/z4SDCZQeRo4xFEQ8H4qrSqd68ucpgE6LU155C) and [Zettelkasten](https://en.wikipedia.org/wiki/Zettelkasten).
- Be used with your own text editor (e.g., [Vim integration](#vim)) or embedded [Web app](#web).
- Be used with a local folder of markdown files.
- Be as close to zero friction as possible.
- Be lightweight and fast.

> Warning: Experimental, proof-of-concept. Here be dragons!

## Table of contents

- [Features](#features)
- [Screenshots](#screenshots)
- [CLI](#cli)
    - [Installation](#installation)
    - [Shell completion](#shell-completion)
    - [Usage](#usage)
- [Web](#web)
    - [Keybindings](#keybindings)
    - [Finder search syntax](#finder-search-syntax)
    - [Syntax highlighting and concealment](#syntax-highlighting-and-concealment)
- [Vim](#vim)
    - [Example integration](#example-integration)
    - [Keybindings](#keybindings-1)
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
- [Versioning](#versioning)
- [Regression tests](#regression-tests)
- [Inspiration and thanks](#inspiration-and-thanks)
- [License](#license)

## Features

- Blazingly fast and powerful search.
- Preview notes and links, with line highlighting where relevant.
- Explore notes, their links, and clusters with the force graph view.
- Create and edit notes with your own editor or the embedded web app.
- No need to think about file names or folder locations.
- Instantly create a new note with a keybinding.
- Structure emerges organically through bi-directional links.
- Frictionless creation, listing, previewing, and following of links.
- No caching or preprocessing: Everything is computed on the fly.
- **List**
    - Display a list of all notes in the entire system.
    - Sort the list alphabetically, by date created, or date modified.
    - Prefix titles with associated labels, date created, or date modified.
    - Customize date format for prefixed date created or date modified.
    - Limit the list to label notes (one-word titles).
    - Limit the list to orphan notes (no incoming or outgoing links).
- **Links**
    - Quickly search and insert an automatically formatted link.
    - Display a list of all links in the entire system.
    - Display a list of all related links to the current note.
    - Limit the list to incoming links to the current note.
    - Limit the list to outgoing links from the current note.
    - Display a list of broken links and jump there instantly.
- **Lines**
    - Perform a full text search across all notes in the entire system.
    - Optionally prefix each line with the note title for context.
- **Stats**
    - View counts of notes, labels, orphans, links, lines, words, etc.
- **Web (app)**
    - Completely self-contained and runs locally.
    - Create and edit notes with web based editor.
    - Markdown syntax highlighting, special char and links concealment.
    - Open multiple notes in tabs, drag to re-order, keybindings to switch.
    - Finder integration for List, Links and Lines with preview.
    - Sidepanels for labels, notes list and note metadata with linktrees.
- **Web (graph)**
    - Visual overview of notes structure with a force graph view.
    - Cluster nodes based on links, inferred from titles or creation date.
    - Adjust node size dynamically based on bi-directional link count.
    - Emphasize nodes and their links using search filter or node click.
    - Preview notes in a side panel. Open for editing via `notesium://` link.
    - Tweak forces such as repel force, collide radius, and strength.
    - Drag, pan, or zoom the graph for a better view or focus.
    - Customize label visibility or automatically scale per zoom level.

## Screenshots

*Graph: display all notes and their links in a force graph view*
![image: force graph cluster links](https://www.notesium.com/images/screenshot-1688650369.png)
<br/>

*Graph: cluster notes based on their titles instead of links*
![image: force graph cluster titles](https://www.notesium.com/images/screenshot-1687865971.png)
<br/>

*Graph: filter notes with emphasized matches. preview note content (dark mode)*
![image: force graph note preview](https://www.notesium.com/images/screenshot-1690971723.png)
<br/>

*Graph: zoomed out large note collection (dark mode)*
![image: force graph zoom](https://www.notesium.com/images/screenshot-1682941869.png)
<br/>

*[Web] Panels: Toggleable labels, notes list and note metadata sidepanels*
![image: web panels](https://www.notesium.com/images/screenshot-1704976637.png)
<br/>

*[Web] List: prefixed with associated labels and sorted alphabetically*
![image: web prefixed label](https://www.notesium.com/images/screenshot-1702907201.png)
<br/>

*[Web] List: prefixed with modification date and sorted per modification time*
![image: web prefixed mtime](https://www.notesium.com/images/screenshot-1702907446.png)
<br/>

*[Web] Links: display all links*
![image: web links all](https://www.notesium.com/images/screenshot-1702908693.png)
<br/>

*[Web] Links: display links related to the current note*
![image: web links related](https://www.notesium.com/images/screenshot-1702908878.png)
<br/>

*[Web] Links: link insertion triggered by `[[`*
![image: web link insertion](https://www.notesium.com/images/screenshot-1702909758.png)
<br/>

*[Web] Lines: full text search*
![image: web full text search](https://www.notesium.com/images/screenshot-1702909937.png)
<br/>

*[Vim] List: prefixed with associated labels and sorted alphabetically*
![image: vim prefixed label](https://www.notesium.com/images/screenshot-1681733208.png)
<br/>

*[Vim] List: prefixed with modification date and sorted per modification time*
![image: vim prefixed mtime](https://www.notesium.com/images/screenshot-1681733355.png)
<br/>

*[Vim] Links: display all links*
![image: vim links all](https://www.notesium.com/images/screenshot-1681733482.png)
<br/>

*[Vim] Links: display links related to the current note*
![image: vim links related](https://www.notesium.com/images/screenshot-1681733712.png)
<br/>

*[Vim] Links: link insertion triggered by `[[`*
![image: vim link insertion](https://www.notesium.com/images/screenshot-1681734183.png)
<br/>

*[Vim] Lines: full text search (light theme)*
![image: vim full text search light](https://www.notesium.com/images/screenshot-1681734555.png)
<br/>

## CLI

Notesium is primarily tested and supported on Linux, with only
preliminary tests performed on MacOS and Windows.

### Installation

Download the [latest release](https://github.com/alonswartz/notesium/releases/latest) for your platform, making sure to give it
executable permissions and available in your `PATH`.

```bash
# Example for Linux 64-bit
curl -sLO https://github.com/alonswartz/notesium/releases/latest/download/notesium-linux-amd64
curl -sLO https://github.com/alonswartz/notesium/releases/latest/download/checksums.txt
sha256sum --check --ignore-missing checksums.txt && rm checksums.txt
chmod +x notesium-linux-amd64
mv notesium-linux-amd64 $HOME/.local/bin/notesium
```

Or build from source.

```bash
git clone https://github.com/alonswartz/notesium.git
cd notesium
./web/app/make.sh all
./web/graph/make.sh all
go build -ldflags "-s -w -X main.version=$(git describe | sed 's/^v//; s/-/+/')"
ln -s $(pwd)/notesium $HOME/.local/bin/notesium
```

### Shell completion

```bash
# if you downloaded the latest release binary, extract completion.bash, for example:
notesium extract completion.bash > /path/to/notesium/completion.bash

# update $HOME/.bashrc or similar to source completion.bash, for example:
[ -f "/path/to/notesium/completion.bash" ] && source "/path/to/notesium/completion.bash"
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
    --sort=WORD     Sort list by date or alphabetically (ctime|mtime|alpha)
    --prefix=WORD   Prefix title with date or linked label (ctime|mtime|label)
    --date=FORMAT   Date format for ctime/mtime prefix (default: 2006-01-02)
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
  web               Start web server
    --webroot=PATH  Path to web root to serve (default: embedded webroot)
    --open-browser  Launch default web browser with web server URL
    --stop-on-idle  Automatically stop when no activity is detected
    --port=INT      Port for web server to listen on (default: random)
    --writable      Allow writing of notes in NOTESIUM_DIR via API
  extract [path]    Print list of embedded files or contents of file path
  version           Print version

Environment:
  NOTESIUM_DIR      Path to notes directory (default: $HOME/notes)
```

## Web

Notesium ships with an embedded web interface which is self contained
and runs locally. To allow writing of notes, be sure to specify the
`--writable` flag.

```bash
notesium web --writable --open-browser
```

### Keybindings

| Mode   | Binding     | Comment
| ----   | --------    | -------
| edit   | `[[`        | Opens note list, insert selection as markdown formatted link
| edit   | `ctrl+s`    | Save note
| global | `space n n` | Opens new note for editing
| global | `space n l` | List with prefixed label, sorted by alphabetically
| global | `space n m` | List with prefixed date modified, sorted by mtime
| global | `space n c` | List with prefixed date created in custom format, sorted by ctime
| global | `space n k` | List all links related to this note
| global | `space n s` | Full text search
| global | `space n g` | Opens force graph view
| finder | `C-k` `C-j` | Move selection up and down
| finder | `enter`     | Open selection
| finder | `C-p`       | Toggle preview
| tab    | `C-h` `C-l` | Switch to previous (left) or next tab (right)
| tab    | `C-o`       | Switch to previous active tab

For more keybindings see the integrated settings.

### Finder search syntax

| Token        | Match Type                 | Comment
| ------------ | ----------                 | -------
| `word`       | exact-match                | Items that include `word`
| `foo bar`    | multiple exact match (AND) | Items that include both `foo` AND `bar`

### Syntax highlighting and concealment

The editor is configured to syntax highlight based on `markdown`
formatting.

By default, special characters used for **bold**, *italic* and `code`
will be concealed except on the active-line. In addition, links will
also be concealed and only display the title. This setting can be
toggled using the icon in the note sidebar.

## Vim

Notesium does not supply a Vim plugin, it is up to the user to write
their own Vim commands and configure keybindings. That said, below are
some fairly generic commands, with preferences configured in the
keybindings.

- Dependencies: [fzf](https://github.com/junegunn/fzf) and [fzf.vim](https://github.com/junegunn/fzf.vim).
- Recommended: [bat](https://github.com/sharkdp/bat) for syntax highlighting in the preview.
- Recommended: [vim-markdown](https://github.com/preservim/vim-markdown) for general markdown goodness.
- Recommended: [goyo.vim](https://github.com/junegunn/goyo.vim) and [lightlight.vim](https://github.com/junegunn/limelight.vim) for distraction free writing.

### Example integration

```vim
let $NOTESIUM_DIR = trim(system("notesium home"))

autocmd BufRead,BufNewFile $NOTESIUM_DIR/*.md inoremap <expr> [[ fzf#vim#complete({
  \ 'source': 'notesium list --sort=mtime',
  \ 'options': '+s -d : --with-nth 3.. --prompt "NotesiumInsertLink> "',
  \ 'reducer': {l->"[". split(l[0],':1: ')[1] ."](".split(l[0],':')[0].")"},
  \ 'window': {'width': 0.5, 'height': 0.5}})

command! -bang NotesiumNew
  \ execute ":e" system("notesium new")

command! -bang NotesiumWeb
  \ let options = "--stop-on-idle --open-browser" |
  \ execute ":silent !nohup notesium web ".options." > /dev/null 2>&1 &"

command! -bang -nargs=* NotesiumList
  \ let spec = {'dir': $NOTESIUM_DIR, 'options': '+s -d : --with-nth 3..'} |
  \ call fzf#vim#grep(
  \   'notesium list '.join(map(split(<q-args>), 'shellescape(v:val)'), ' '), 0,
  \   &columns > 79 ? fzf#vim#with_preview(spec, 'right', 'ctrl-/') : spec, <bang>0)

command! -bang -nargs=* NotesiumLinks
  \ let spec = {'dir': $NOTESIUM_DIR, 'options': '-d : --with-nth 3..'} |
  \ call fzf#vim#grep(
  \   'notesium links '.join(map(split(<q-args>), 'shellescape(v:val)'), ' '), 0,
  \   &columns > 79 ? fzf#vim#with_preview(spec, 'right', 'ctrl-/') : spec, <bang>0)

command! -bang -nargs=* NotesiumSearch
  \ let spec = {'dir': $NOTESIUM_DIR, 'options': '-d : --with-nth 3..'} |
  \ call fzf#vim#grep(
  \   'notesium lines '.join(map(split(<q-args>), 'shellescape(v:val)'), ' '), 0,
  \   &columns > 79 ? fzf#vim#with_preview(spec, 'right', 'ctrl-/') : spec, <bang>0)

nnoremap <Leader>nn :NotesiumNew<CR>
nnoremap <Leader>nl :NotesiumList --prefix=label --sort=alpha --color<CR>
nnoremap <Leader>nm :NotesiumList --prefix=mtime --sort=mtime --color<CR>
nnoremap <Leader>nc :NotesiumList --prefix=ctime --sort=ctime --color --date=2006-01<CR>
nnoremap <Leader>nb :NotesiumLinks --incoming <C-R>=expand("%:t")<CR><CR>
nnoremap <Leader>nk :NotesiumLinks --color <C-R>=expand("%:t")<CR><CR>
nnoremap <Leader>ns :NotesiumSearch --prefix=title --color<CR>
nnoremap <silent> <Leader>nw :NotesiumWeb<CR>

" overrides for journal
if $NOTESIUM_DIR =~ '**/journal/*'
  nnoremap <Leader>nl :NotesiumList --prefix=label --sort=mtime --color<CR>
endif
```

### Keybindings

| Mode   | Binding           | Comment
| ----   | --------          | -------
| insert | `[[`              | Opens note list, insert selection as markdown formatted link
| normal | `<Leader>nn`      | Opens new note for editing
| normal | `<Leader>nw`      | Opens browser with web view (auto stop webserver on idle)
| normal | `<Leader>nl`      | List with prefixed label, sorted by alphabetically (mtime if journal)
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

For Vim users, opening the listing is useful when integrated with a
launcher or desktop keybinding. Opening a note for editing is useful,
for example, when using the `web` force graph view.

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
consider enabling `conceallevel` (see [Related Vim settings](#related-vim-settings)). This is
implemented in the web app and enabled by default.

## Versioning

Versions are specified using git tags, based on [semantic versioning](https://semver.org),
and use the format **MAJOR.MINOR.PATCH**. While the MAJOR version is 0,
MINOR version bumps are considered MAJOR bumps per the semver spec.

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

Copyright (c) 2023-2024 Alon Swartz
