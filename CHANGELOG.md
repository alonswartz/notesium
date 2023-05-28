## 0.2.2

Added:

- Graph clustering support by creation date (day, week, month).
- Graph clustering support inferred from titles.
- Graph settings persistence when changing clustering method.
- Graph settings sections collapse/expand.

Fixed:

- Graph dangling links set as type ghost, void href links.

## 0.2.1

Added:

- Changelog going back to initial public release.
- Version command utilizing `git describe`.
- Readme versioning section.

## 0.2.0

This version includes **backwards incompatible changes**.

Added:

- List sorting by creation datetime: `--sort=ctime`.
- List prefix with creation datetime: `--prefix=ctime`.
- List prefix ctime and mtime customizable date format: `--date=FORMAT`.
- Script to rename files and update links: `contrib/ctimehex.sh`.

Changed:

- New filenames are now unix epoch encoded hexidecimal instead of random.
- List sorting by title has been renamed: `--sort=title` `--sort=alpha`.
- Tests and fixtures updated for the new ctimehex based filenames.
- Tests fixtures deterministic mtimes are now hardcoded.
- Readme NotesiumList Fzf example includes `+s` to retain user sorting.

## 0.1.9

Fixed:

- Improved inline markdown link regular expression to conform to spec.

## 0.1.8

Added:

- Stats command to output counts for notes, labels, orphans, links,
  dangling links, lines, words, characters.
- Stats can be formatted as a table, thousands with comma, color coded.

## 0.1.7

Changed:

- Readme updates for latest Fzf version.

## 0.1.6

Added:

- Force graph support for loading raw graph data from file.

## 0.1.5

Added:

- Force graph filter result list search word emphasis.
- Force graph filter result list results toggle support.
- Force graph keybinding to focus filter input field `/`.
- Force graph keybinding to remove focus and unset filter `esc`.

Changed:

- Force graph filter result list moved side-by-side with settings.

## 0.1.4

Added:

- Force graph darkmode support.

Fixed:

- Force graph hiding of labels correctly.

## 0.1.3

Added:

- Force graph label toggling.
- Force graph dynamic node radius based on links count.
- Force graph search word-wise, display matches list and emphasize nodes.
- Force graph nodes (and their links, labels) emphasis on click.
- Force graph automatic scaling label font-size on zoom.
- Force graph settings: repel strength, collide strength, collide radius.

## 0.1.2

Added:

- URI protocol handler documentation and example integration.
- Graph command customizable node links format.

## 0.1.1

Added:

- Graph command to generate raw data.
- Graph option to encode data in base64 and append to graph file URL.
- Force graph data decode, parse and display, httpserver not needed.
- Force graph handling of dangling links.
- Force graph node href for viewing file.
- Force graph node labels colored differently.
- Force graph zoom on mouse scroll.
- Force graph related tests.

## 0.1.0

Initial public release.

- List: Display a list of all notes.
- List: Sort the list alphabetically by title or modification time.
- List: Prefix titles with associated labels or modification date.
- List: Limit the list to label notes (one-word titles).
- List: Limit the list to orphan notes (no incoming or outgoing links).
- List: Limit the list to notes where a specific pattern appears.

- Links: Display a list of all links.
- Links: Display a list of all related links of a specific note.
- Links: Limit the list to incoming links of a specific note.
- Links: Limit the list to outgoing links of a specific note.
- Links: Limit the list to broken or dangling links.

- Lines: Print all lines of notes (useful for fulltext search).
- Lines: Prefix each line with note title, optional color coding.

- Vim/Fzf: Insert mode `[[` to select and insert note markdown formatted link.
- Vim/Fzf: NotesiumNew example command and keybinding.
- Vim/Fzf: NotesiumList example command and keybindings.
- Vim/Fzf: NotesiumLinks example command and keybindings.
- Vim/Fzf: NotesiumSearch example command and keybindings.

- Regression tests for all commands, their options and fixtures corpus.
- Documented design assumptions and rationale.

