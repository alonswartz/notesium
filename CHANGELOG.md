## 0.6.3

This release introduces a new **lines** `--filter` option with support
for AND, OR, and NOT conditionals. It also implements tokenization for
quoted terms, enabling more advanced and flexible queries directly
on the CLI and via the API.

The **web** command now includes an experimental `--mount` option,
making it easier to serve additional directories under the webroot, such
as the experimental [Notesium-GPT](https://github.com/alonswartz/notesium-gpt) *addon*, which leverages the new lines
filter via the API for enhanced functionality.

Additionally, **arm64 builds** are now included in the CI/CD pipeline,
expanding compatibility to more systems. The installation examples in
the README have been updated to dynamically detect the architecture for
the appropriate build.

Added:

- CLI: Web - mount option to serve additional directories under webroot.
- CLI: Lines - filter query option with AND, OR, and NOT conditionals.
- CI/CD: Github Actions workflows - build and publish for arm64 architecture.

Changed:

- API: Updated spec `api/raw/lines` with new filter option.
- Cache: Note mtime truncation to remove milliseconds.
- Readme: Install examples updated to detect architecture dynamically.
- Options: Improved absolute directory path handling and validation.

## 0.6.2

Notesium now supports **section folding** in the web/app editor, making
it easier to view and edit your notes, especially longer ones. Folds can
be toggled via the Fold gutter or keybindings, which work whether the
cursor is on the section heading or anywhere within the section.

Folded sections are visually distinct, featuring a subtle full-width
background, displaying the line count, and unfolding when clicked.

Fixed:

- Web/App: Sidepanel - support capitalized labels in labelQuery filter.
- Web/App: Sidepanel - deduplicate labels for detailed view and searchStr.
- Web/App: Sidepanel - use deduplicated linked notes over note links.

Added:

- Web/App: Fold - section folding support in Editor.
- Web/App: Fold - fold-marker with header text and line count.
- Web/App: Fold - fold-marker with full-width subtle background.
- Web/App: Fold - fold-marker readonly when folded, click to unfold.
- Web/App: Fold - toggle keybinding for section folds (`C-Enter`).
- Web/App: Fold - vimmode keybindings (`za zo zc zR zM`).
- Web/App: Fold - scanUp on folding (cursor on header or in section).
- Web/App: FoldGutter - displays collapsible sections, click to toggle.
- Web/App: FoldGutter - vimMode command to set `[no]fold`.
- Web/App: FoldGutter - state setting in **Settings:Editor**.
- Web/App: FoldGutter - state toggle in **StatusBar**.

- Web/App: Sidepanel - include finder list-links icon in labelTree labels.

Changed:

- Web/App: Note sidebar - removed editor options included in Statusbar.
- Web/App: Vendor - upgraded to `alonswartz/notesium-cm5` v5.65.18-2.

## 0.6.1

This release focuses on enhancements to the web/app editor,
including improvements to link insertion, global keybindings sequence
handling, and resolving issues with international keyboard layouts.

Fixed:

- Web/App: Editor - reimplemented bracket handling (non EN keyboard layouts).
- Web/App: Editor - remove first leftBracket on insertLink cancellation.
- Web/App: Editor - fixed concealed horizontal rule (firefox).
- Web/App: Editor vimmode - ignore `Tab` in non-insert mode.
- Web/App: Editor vimmode - removed global key-sequence refocus timeout.
- Web/App: Global key-sequence: improved timeout handling and reset behavior.

Added:

- Web/App: Editor - added additional insertLink keybinding, `Alt-k`.
- CI/CD: Github Actions workflows - upload build artifacts.

Changed:

- Web/App: Vendor - transitioned to `alonswartz/notesium-cm5` (v5.65.18-1).

## 0.6.0

This release introduces **Vim mode** to the Web/App editor, emulating
key features of Vim such as motions, operators, visual modes, macro
support, incremental highlighted search, search and replace, jump
lists, sort, marks, cross-buffer yank/paste, and expected commands for
writing, quitting, and adjusting editor settings. It also supports link
insertion, link following, and passthrough for Notesium's global and
note-tab keybindings.

A **StatusBar** has been added, displaying the focus state (or Vim
mode), editor mode, editor settings, note link counts, and note actions.
Additionally, a new Editor sub-section has been introduced in Settings.

To further enhance keyboard usage, `Tab` can be used to gain editor
focus, and `C-s` to save the active note even when the editor is not
focused.

This version includes **backwards incompatible changes**.

Fixed:

- Links: Handle `file-not-found` gracefully instead of hard-fail.
- Web/App: Note - focus activeFilename editor on `Tab`.

Added:

- Web/App: Note - save activeFilename even if not focused on `C-s`.
- Web/App: State - editorVimMode bool set and tracked via state management.
- Web/App: Vendor - codemirror vim, dialog and searchcursor addons.

- Web/App: Editor vim-mode - all common motions, operators, and text objects.
- Web/App: Editor vim-mode - operator-motion orthogonality.
- Web/App: Editor vim-mode - visual mode - characterwise, linewise, blockwise.
- Web/App: Editor vim-mode - full macro support (`q @`).
- Web/App: Editor vim-mode - incremental highlighted search (`/ ? # * g# g*`).
- Web/App: Editor vim-mode - search/replace with confirm (`:substitute :%s`).
- Web/App: Editor vim-mode - search history.
- Web/App: Editor vim-mode - jump lists (`C-o C-i`).
- Web/App: Editor vim-mode - sort (`:sort`).
- Web/App: Editor vim-mode - marks (`` ` ' ``).
- Web/App: Editor vim-mode - cross-buffer yank/paste.

- Web/App: Editor vim-mode - keybind for write and set normal mode (`C-s`).
- Web/App: Editor vim-mode - commands for write and quit (`:w :wq :q :q!`).
- Web/App: Editor vim-mode - commands to set `[no]wrap` and `[no]conceal`.
- Web/App: Editor vim-mode - insert link via finder on `[[`.
- Web/App: Editor vim-mode - open link under cursor (`ge` `gx`).
- Web/App: Editor vim-mode - unset highlighted search on `Esc`.
- Web/App: Editor vim-mode - passthrough global keybinds (`space n <char>`).
- Web/App: Editor vim-mode - passthrough note-tab keybinds (`C-l|h|6|^`).
- Web/App: Editor vim-mode - autofocus on activeFilename change and match.
- Web/App: Editor vim-mode - autofocus on note.Linenum change.

- Web/App: StatusBar - displayed in default and Vim modes.
- Web/App: StatusBar - default (focus state), Vim (colored mode).
- Web/App: StatusBar - editor settings for mode, wrap, and conceal.
- Web/App: StatusBar - note link counts and action icons (if sideBar closed).

- Web/App: Settings Editor - vimMode lineWrapping concealFormatting toggles.
- Web/App: Settings Editor - default mode keybinds.
- Web/App: Settings Editor - vim mode keybinds and info.
- Web/App: Settings Editor - table support keybinds and info.

Changed:

- Web/App: Note tabs - switch to recent note keybind, `C-6` (`C-o` deprecated).
- Web/App: Settings Keybindings - split into global finder note-tabs sections.
- Web/App: Settings Keybindings - moved edit and table to Settings Editor.

- Readme: Web reorganized and updated to include `Editor modes`.

**Backwards incompatible changes**:

- The Web/App keybinding for **switching to the previously active note**
  has been changed from `C-o` to `C-6` (`C-^` is also supported). This
  promotes consistency for all editor modes, as Vim uses `C-o` for the
  jumplist, and `C-6` to switch to the previous buffer.

## 0.5.11

This release brings refinements to the Web/App, including improved
editor link insertion and concealment enhancements. It also adds support
for discarding unsaved changes. The README has been updated with new
documentation.

Fixed:

- Web/App: Editor insertLink - move cursor to end of formatted link.
- Web/App: Editor conceal - fix unconceal font-size (firefox).

Added:

- Web/App: Editor insertLink - apply timing threshold between bracket presses.
- Web/App: Editor insertLink - change cursor until next keypress or threshold.
- Web/App: Editor conceal - transition font-size for less jarring effect.

- Web/App: Support discarding changes on note close.
- Web/App: Replaced native confirm with custom implementation.

- Readme: Documented Web/App state and preferences are port specific.
- Readme: Documented Web/App supported Markdown highlighting and concealment.
- Readme: Documented installation examples for macOS and Windows.

Changed:

- Readme: Updated bash shell completion to source inline from embedded file.

## 0.5.10

The Web/App features a brand-new Ribbon, a Force Graph panel that
optionally updates in real-time emphasizing the active note and its
relationships, and inline toggling of the note metadata side panel.

The Notes list side panel includes more sorting options, note preview on
hover, scoped dark mode, detailed and compact views, a compact
expandable tree-like labels section, and improved integration with the
Labels panel.

Fixed:

- Web/App: Note sidebar - wrap action icons on pane resize when needed.
- Web/App: Notes list panel - handling of future dates (periodic notes).
- Web/App: Preview - adheres to editorLineWrapping state setting.

Added:

- Web/App: Ribbon - replaces and expands on NavBar action icons.
- Web/App: Ribbon - includes graph-panel, mtime-list, dangling-links.
- Web/App: Ribbon - visual identification of panel state.

- Web/App: Graph panel - side-by-side view of graph and editor tabs.
- Web/App: Graph panel - node and relationship emphasis of active note.
- Web/App: Graph panel - automatic re-render only when required.
- Web/App: Graph panel - maintain position and zoom on re-render.
- Web/App: Graph panel - collapsed filter, display and forces settings.

- Web/App: List panel - note preview on hover.
- Web/App: List panel - sort and density, labels related dropdowns on hover.
- Web/App: List panel - sort via title, mtime, ctime or link count.
- Web/App: List panel - detailed and compact view.
- Web/App: List panel - compact labels-tree, with dedicated sorting.
- Web/App: List panel - scoped darkmode for detailed and compact views.
- Web/App: List panel - filter match count and link to full-text search.
- Web/App: List panel - filter optimizations and `label:` support.
- Web/App: List panel - filter clear icon when applicable.
- Web/App: List panel - optimized date handling and formatting.
- Web/App: List panel - new label with verification when label panel closed.

- Web/App: Labels panel - new label with verification.
- Web/App: Labels panel - improved integration with Notes panel.

Changed:

- Web/App: NavBar - action icons removed, replaced with Ribbon.
- Web/App: Labels panel - label click opens finder if Notes list closed.
- Web/App: Graph overlay - only full screen, overlay replaced by graph panel.
- Web/App: Periodic notes - refactored into dedicated component and improved.
- Web/App: Note metadata panel - graph link changed to Graph panel.
- Web/App: Note metadata panel - inline toggle instead navbar panels dropdown.

## 0.5.9

Building upon daily note support introduced in version 0.5.7, weekly
note support has now been added in the embedded Web App and Vim, along
with a configurable "start of week" setting. The Web App also features a
custom datepicker displaying existing daily and weekly notes, and allows
for the creation of past and future periodic notes.

Additionally, the Web App now includes a global reactive state
management system that retains user preferences across sessions.

Fixed:

- Vim: Use script-local variables to avoid namespace conflicts.

Added:

- Web/App: Editor line wrapping support.

- Web/App: State - Global reactive state management.
- Web/App: State - Exposed in settings.about.runtime.state.
- Web/App: State - Used by Panels - show state and width.
- Web/App: State - Used by Editor - line wrapping and conceal.
- Web/App: State - Used by Datepicker - start of week.

- Web/App: Datepicker - Custom implementation replacing native HTML5.
- Web/App: Datepicker - Configurable start of week.
- Web/App: Datepicker - Existing periodic notes visualized by colored dots.
- Web/App: Datepicker - Buttons for daily and weekly periodic notes.

- Web/App: Keybinding to open new or existing weekly note.
- Vim: `NotesiumWeekly` command/keybinding to open new or existing weekly note.
- Vim: `$NOTESIUM_WEEKSTART` variable for determining weekly note dates.

- Readme: Documented deterministic periodic notes convention.
- Tests: Weekly note test implementations for bash, vim, and javascript.

Changed:

- Vim: `NotesiumWeb` keybinding changed from `<Leader>nw` to `<Leader>nW`.

- Web/App: Native HTML5 datepicker replaced with custom implementation.
- Web/App: Panel state changed from sessionStorage to new state management.

## 0.5.8

The Web/App now supports note deletion, first verifying there are no
incoming links to avoid dangling links, followed by a confirmation
dialog prior to deletion.

Checking for software updates is now supported via the CLI and the
Web/App, along with detailed version and runtime information. A handy
`Report an issue` link is included with the body preset to include
version information. The Web/App also features a high-level statistics
count section integrated with the Finder.

Fixed:

- Web/App: Editor concealment has been improved for selected lines.
- Web/App: Editor concealed `hr` is now centered horizontally, and darker.
- Web/App: Heartbeat will only start if `stop-on-idle` is set.
- Web: Absolute path of webroot will be used if set.

Added:

- Web/App: Note deletion with incoming-links verification and confirmation.
- Web/App: Settings Stats - Counts with integrated Finder links.
- Web/App: Settings About - Software update, Resources and Runtime.
- Web/App: Settings About - Runtime webOptions, build info and memory usage.
- Web/App: Settings About - Report an issue link with version info as body.
- Web/App: Nav actions visual notification if new version available.

- CLI: `version` command now supports `--check` and `--verbose` options.
- CLI: `web` command now supports `--no-check` option to disable daily check.

- API: `api/runtime` `GET` is now supported.
- API: `api/raw/stats` `GET` is now supported.
- API: `api/raw/version` `GET` is now supported.
- API: `api/notes/:filename` `DELETE` is now supported.
- API: New endpoints added to specification.

- Tests: Unit tests for deriving semantic version.
- Tests: Unit tests for comparing semantic version and latest version.
- Tests: Integration tests with custom builds and mock release response.
- Tests: Integration tests for semantic version and new version comparisons.
- Tests: Integration tests for note deletion via API.
- Tests: Integration tests for runtime via API.
- Tests: Integration tests for stats via API.
- CI/CD: Github Actions updated to run unit tests and print version.

Changed:

- Building from source now uses `gitversion` and `buildtime` flags.
- Notesium version is now derived from `gitversion`.

## 0.5.7

Setting a custom `ctime` for new notes is now supported, enabling
deterministic note filenames. Using the `00:00:00` convention, daily
notes are now supported in the embedded Web App and in Vim via the
`NotesiumDaily` command.

Fixed:

- Web/App: Avoid losing editor focus on the first save of a new note.
- Web/App: Skip updating `activeFilenamePrevious` if there is no change.
- Web/App: Alert dismissal race condition.

Added:

- CLI: `new` command now supports `--ctime=` and `--verbose` options.
- API: `api/raw/new` is now available.
- Tests: Added CLI and Web tests for the `new` options.

- Vim: `NotesiumDaily` command/keybinding to open new or existing daily note.
- Web/App: Daily note icon and keybinding to open new or existing daily note.
- Web/App: Daily note custom date selector on icon hover.

Changed:

- API: Note creation now requires `Ctime` argument.
- Web/App: newNote updated to use `api/raw/new` with verbose output.
- Web/App: saveNote updated to include `Ctime` requirement.

## 0.5.6

Fixed:

- CI/CD: Disable CGO to ensure static binary compilation.

## 0.5.5

Fixed:

- Cache: Skip `non-hex8.md` files instead of hard-fail.
- API: Note update `lastMtime` verification now uses UTC for comparison.
- Tests: Use `Mtime` from API instead of hardcoding (timezones).

Added:

- Web/App: Editor softTab insertion on `Tab`.
- Web/App: Editor softTab removal if left-of-cursor on `Bksp`.
- Web/App: Documented default indentation keybindings (Auto, Less, More).

- Web/App: Sidepanel resize support (Labels, Notes list and Note metadata).
- Web/App: Sidepanel resize via click-and-drag and dbl-click to restore.
- Web/App: Sidepanel width preservation with sessionStorage.
- Web/App: Sidepanel show-state preservation with sessionStorage.

- CI/CD: Github Actions scripts (install-deps, build-bin, run-tests, release-notes).
- CI/CD: Github Actions workflow for pull-requests.
- CI/CD: Github Actions workflow for merges into master and tagged releases.
- CI/CD: Contrib `release.sh tag` for verification to reduce human error.

Changed:

- Web/App: Navbar sidepanels dropdown on hover instead of click.
- Web: App and Graph updated to use d3.js versioned URL.

## 0.5.4

Added:

- Web/App: Editor table automatic formatting on `Tab`.
- Web/App: Editor table formatting with column alignment.
- Web/App: Editor table formatting with dynamic column adjustment.
- Web/App: Editor table formatting with concealment support.
- Web/App: Editor table header separator auto-match header column count.
- Web/App: Editor table navigation via `Tab`, `Shift-Tab` and `Alt-Arrow`.

## 0.5.3

The `web/graph` has been rewritten and implemented in `web/app`, with
all of same features (except cluster settings and darkmode), tighter
integration, and additional improvements.

Fixed:

- Web/App: Preview activeline disabled if lineNumber not specified.

Added:

- Web/App: Graph to visualize the relationships between notes.
- Web/App: Graph search filter to emphasize nodes and their links.
- Web/App: Graph node and immediate links emphasis on title click.
- Web/App: Graph emphasis removal via graph-empty-space click.
- Web/App: Graph dynamic node radius based on bi-directional link count.
- Web/App: Graph title visibility toggle and auto-scale per zoom level.
- Web/App: Graph customizable force, collide radius and strength.
- Web/App: Graph drag, pan and zoom for a better view or focus.
- Web/App: Graph different node color for notes considered labels.
- Web/App: Graph toggleable settings and sub-setting sections.
- Web/App: Graph toggleable context aware fullscreen and overlay views.

- Web/App: Graph fullscreen open via navbar, welcome screen and keybind.
- Web/App: Graph fullscreen node title click opens note preview overlay.
- Web/App: Graph fullscreen filter single-match `enter` opens note preview.
- Web/App: Graph fullscreen preview includes section with incoming-links.
- Web/App: Graph fullscreen preview link clicks switch preview and node emphasis.
- Web/App: Graph fullscreen preview edit icon to open note for editing.
- Web/App: Graph fullscreen preview close via `x` icon, `esc` or outside click.
- Web/App: Graph fullscreen close via `x` icon or `esc`.

- Web/App: Graph overlay open via node-sidebar with note emphasized.
- Web/App: Graph overlay node title click opens note for editing.
- Web/App: Graph overlay close via `x` icon, `esc` or outside click.

- Web/App: Editor conceal support for `~~strikethrough~~`.
- Web/App: Editor conceal support and highlight for `---` (horizontal rule).

Changed:

- Web/App: Graph navbar icon opens integrated graph (was `/graph?noxdg`).
- Embedded webroot set to `web/app` (`web/graph` no longer included).

## 0.5.2

Fixed:

- Web/App: Editor activeline unconceal only if focused and editable.
- Web/App: Finder entries overflow hidden and truncated.
- Web/App: Alerts positioning and always in front.

Added:

- Web/App: Sidepanels for Notes and Labels, independently usable/toggleable.
- Web/App: Sidepanels auto-update on lastSave timestamp change.

- Web/App: Notes sidepanel entries with `title`, `mtime` elapsed and `labels`.
- Web/App: Notes sidepanel entries `label` click sets filter query.
- Web/App: Notes sidepanel filter by `title` and associated `labels`.
- Web/App: Notes sidepanel sortable by `title` or `mtime`.

- Web/App: Labels sidepanel with All, Recent and `labels` including count.
- Web/App: Labels sidepanel Notes sidepanel filter query integration if open.
- Web/App: Labels sidepanel Finder integration if Notes sidepanel not open.

- Web/App: Customized vertical and horizontal scrollbar styling.

Changed:

- Web/App: Navbar action note-sidebar toggle replaced with Panels dropdown.
- Web/App: Notes sidebar actions header sticky.
- Web/App: Notes sidebar tweaked styling.

- Contrib: XDG URxvt example script support for custom title.

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

