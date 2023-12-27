## 0.5.1

Added:

- Web/App: Note LinkTree providing an expandable list of note links.
- Web/App: Note LinkTree links include linenumber where applicable.
- Web/App: Note LinkTree expanded note links include direction badges.

- Web/App: Note sidebar incoming and outgoing links displayed as LinkTrees.
- Web/App: Note sidebar includes incoming and outgoing link counts.
- Web/App: Note sidebar includes dangling links list, with direct link.

- Web/App: Note sidebar global toggle functionality.
- Web/App: Note sidebar will be hidden on new unsaved notes (ghost).
- Web/App: Note `save` floating button when sidebar hidden.

Changed:

- Web/App: Note sidebar is now fixed width.
- Web/App: Note sidebar backlinks list replaced with LinkTree.

## 0.5.0

Notesium now includes an embedded Web App which is completely
self-contained and runs locally. It includes an Editor to view and edit
notes with syntax highlighting, and a Finder which mimics the Vim
user-experience example integration (Fzf, bats, keybindings, etc.).

This version includes **backwards incompatible changes**.

Added:

- Web: `--writable` option to allow writing of notes in NOTESIUM_DIR via API.
- Graph: XDG edit links will be hidden if `?noxdg` parameter is set.
- Links: Accepts `--filename=` as alternative to filename as argument.

- API: Initial specification documented in `API.md`.
- API: Note creation provided via `POST  /api/notes/`.
- API: Note updating provided via `PATCH /api/notes/:filename`.
- API: Note updating refusal if provided `lastMtime` mismatch to filesystem.
- API: Experimental CLI pass-through commands: `/api/raw/list|links|lines`.

- Web/App: Finder opening via keybind sequences similar to Vim.
- Web/App: Finder for displaying `list` `links` `lines` results.
- Web/App: Finder filtering exact-match and multi-match (AND).
- Web/App: Finder preview with syntax and linenumber highlighting.
- Web/App: Finder preview toggle via keybinding.
- Web/App: Finder keybindings for navigation in addition to mouse.
- Web/App: Finder initial query filter support.
- Web/App: Finder selection will open note:linenumber or switch if open.
- Web/App: Tabs support for opening multiple notes concurrently.
- Web/App: Tabs open right of source Tab or last if via Finder.
- Web/App: Tabs visual indicator of unsaved changes.
- Web/App: Tabs close refusal if note has unsaved changes.
- Web/App: Tabs close will switch to previously active or last.
- Web/App: Tabs switching keybindings for next, previous, previously active.
- Web/App: Tabs re-ordering via mouse drag.
- Web/App: Tabs note.IncomingLinks update on Save for potential changes.
- Web/App: Editor link-insertion Finder without preview via `[[` keybinding.
- Web/App: Editor markdown syntax and active-line highlighting.
- Web/App: Editor conceal links and formatting unless active-line (toggable).
- Web/App: Editor inline-link click support if concealed, edit or view mode.
- Web/App: Editor keybinding for Save when in edit-mode.
- Web/App: Editor changeSet markClean on successful Save.
- Web/App: Note sidebar actions: Conceal-formatting. Related-links. XDG-open.
- Web/App: Note sidebar stats: Lines, Words, Characters.
- Web/App: Note sidebar dates: Modified, Created. Open Finder of same day.
- Web/App: Note sidebar backlinks: Links to `source:ln` of IncomingLinks.
- Web/App: Note sidebar backlinks: Updated when referenced note is saved.
- Web/App: Note link clicks will open note or switch if open.
- Web/App: Warn on closing browser tab if any notes have unsaved changes.
- Web/App: Navbar actions: new, list, links, lines, graph, keybindings.
- Web/App: Empty state: new, list, lines quickstart.
- Web/App: Settings overlay for keybindings with filter search.
- Web/App: Alert notifications on errors - auto-dismiss or sticky.
- Web/App: Heartbeat support for Web option `--stop-on-idle`.
- Web/App: Embedded build includes minified, concatenated vendor files.

Changed:

- Links are sorted alphabetically if filename not specified.
- Note titles will be returned as `untitled` if no Title was enumerated.
- API notes list Incoming/OutgoingLinks now include dst/src note `Title`.

- Embedded webroot set to `web` instead of `web/graph` (redirect to `/app`).
- Embedded `web/graph` now located at `/graph` instead of `/`.
- Readme Vim Graph command changed to Web command.
- Readme updated to include `web/app` and related screenshots.

- Cache population will be skipped if already exists.
- API errors are returned as JSON `{Error, Code}`.

## 0.4.2

Fixed:

- Web graph filtered results search term highlight for click capture.

Added:

- Web graph note preview syntax highlighting for headings, code blocks,
  inline code, bold, outgoing links with visual indicator.

Changed:

- Web graph note preview backlinks refactor.
- Web graph input filter event handling.

## 0.4.1

Added:

- Embedded `web/graph` and `completion.bash` in binary.
- Web command will serve embedded webroot by default.
- Extract command to print embedded files list of file content.

Changed:

- Web option `--webroot` is no longer required (default: embedded webroot).
- Web graph requires local d3.js and compiled tailwind.css (instead of CDN).
- Readme Vim graph command updated to not specify a webroot.

## 0.4.0

This version includes **backwards incompatible changes**.

Added:

- Web command with options for webroot, stop-on-idle, open-browser, port.
- Web API tests and endpoints: `/api/notes` `/api/notes/:id` `/api/heartbeat`.
- Web option to automatically stop web server when no activity detected.
- Web option to launch browser with web server URL for convenience.
- Web graph now includes note preview panel, with auto-generated backlinks.
- Web graph note preview markdown links are converted to html links.
- Readme Vim keybinding override journal example.

Changed:

- Graph command has been removed, superseded by Web command.
- Web graph webroot was duplicated from Graph, updated to use API.
- Web graph edit links formatted with `notesium://` URI protocol.
- Readme Vim graph command updated for Web (stop-on-idle, open-browser).

## 0.3.1

Fixed:

- Graph path enumeration when binary is symlinked (OSX).

## 0.3.0

Notesium has been completely rewritten in `golang`, and provides feature
parity with the previous shell script implementation. Minor changes in
flag options are the only deviations from the previous version, as
detailed below.

This version includes **backwards incompatible changes**.

Changed:

- List command option `--date=` requires golang date format.
- List command option `--match=` is no longer supported.
- Stats command option `--fmtnum` is no longer supported.
- Version command prints the version set at build time.
- Readme Fzf commands updated to shellescape each argument.

## 0.2.3

Added:

- Bash shell completion for all commands and their options.

Changed:

- Readme link insertion Fzf example includes `+s` to retain user sorting.

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

