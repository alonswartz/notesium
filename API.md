# Notesium API

## Table of Contents

- [Introduction](#introduction)
- [Versioning](#versioning)
- [Errors](#errors)
- [Notes](#notes)
    - [The note object](#the-note-object)
    - [Create a note](#create-a-note)
    - [Update a note](#update-a-note)
    - [Delete a note](#delete-a-note)
    - [Retrieve a note](#retrieve-a-note)
    - [List all notes](#list-all-notes)
- [Runtime](#runtime)
    - [The runtime object](#the-runtime-object)
    - [Get runtime object](#get-runtime-object)
- [Raw command](#raw-command)
    - [New](#new)
    - [List](#list)
    - [Links](#links)
    - [Lines](#lines)
    - [Stats](#stats)
    - [Version](#version)
- [Heartbeat](#heartbeat)

## Introduction

> BASE URL

```shell
BASE_URL="http://localhost:PORT/api"
```

Notesium `web` provides a REST API, accepts JSON encoded requests and
responds with JSON-encoded responses, and uses standard HTTP response
codes.

## Versioning

Currently the API should be considered unstable, and therefore no API
version has been implemented. 

## Errors

> HTTP status code summary

```
200 - OK                 Everything worked as expected
400 - Bad Request        The request was unacceptable
403 - Forbidden          No permission to perform request
404 - Not Found          The requested resource doesn't exist
405 - Method Not Allowed The requested resource exists but method not supported
409 - Status Conflict    Indicates a conflict with state of target resource
500 - Error              Internal server error
```

The REST API uses conventional HTTP response codes to indicate the
success or failure of an API request. In general: Codes in the `2xx` range
indicate success. Codes in the `4xx` range indicate an error that failed
given the information provided (e.g., a required parameter was omitted).
Codes in the `5xx` range indicate an error with the REST API server.

Error responses may include the `Code` and `Error` (description) of the
error in the body of the response.

## Notes

> Endpoints

```
POST   /api/notes/
PATCH  /api/notes/:filename
DELETE /api/notes/:filename
GET    /api/notes/:filename
GET    /api/notes
```

This object represents a note in Notesium. Use it to create a new note,
update an existing note, retrieve a specific note along with its
metadata and content, as well as retrieve a list of all notes.

See `Raw` for alternative listing endpoints.

### The note object

> The note object

```json
{
  "Filename": "64214a1d.md",
  "Title": "richard feynman",
  "IsLabel": false,
  "OutgoingLinks": [
    {
      "Filename": "642146c7.md",
      "Title": "physicist",
      "LineNumber": 3
    },
    {
      "Filename": "64214930.md",
      "Title": "quantum mechanics",
      "LineNumber": 5
    }
  ],
  "IncomingLinks": [
    {
      "Filename": "64218087.md",
      "Title": "surely you're joking mr. feynman",
      "LineNumber": 3
    }
  ],
  "Ctime": "2023-03-27T10:47:41+03:00",
  "Mtime": "2023-11-30T14:22:44+02:00",
  "Lines": 6,
  "Words": 52,
  "Chars": 362,
  "Path": "/home/github/notesium/notesium/tmp/dir/64214a1d.md",
  "Content": "# richard feynman\n\nrichard phillips feynman was an..."
}
```

#### Attributes

Key           | Type     | Comment
---           | ----     | -------
Filename      | `string` | Note filename
Title         | `string` | Note title
IsLabel       | `bool`   | Whether note is considered a label note
OutgoingLinks | `list`   | List of outgoing links
IncomingLinks | `list`   | List of incoming links
Ctime         | `time`   | Creation datetime
Mtime         | `time`   | Modification datetime
Lines         | `int`    | Amount of lines excluding blank lines
Words         | `int`    | Amount of words
Chars         | `int`    | Amount of characters
Path          | `string` | Path to note on filesystem
Content       | `string` | Note content


### Create a note

> Create a note

```shell
$ curl -X POST $BASE_URL/notes/ \
  -H 'Content-Type: application/json' \
  -d '{"Content": "# new note\n\nthis is a new note\n",
       "Ctime": "2023-11-30T14:20:00+02:00"}'
```

A cache update will be triggered automatically upon a successful
request.

This endpoint will return a `Forbidden` error response unless the daemon
is started with the `--writable` option.

#### Parameters

Key     | Type     | Comment
---     | ----     | -------
Content | `string` | Note content
Ctime   | `time`   | The creation datetime

#### Returns

The `note` object.


### Update a note

> Update a note

```shell
$ curl -X PATCH $BASE_URL/notes/64214a1d.md \
  -H 'Content-Type: application/json' \
  -d '{"Content": "# mr. richard feynman\n...",
       "LastMtime": "2023-11-30T14:22:44+02:00"}'
```

If the last modified time does not match the current modified time of
the note on disk, updating the note will be refused as a fail-safe.

A cache update will be triggered automatically upon a successful
request.

This endpoint will return a `Forbidden` error response unless the daemon
is started with the `--writable` option.

#### Parameters

Key       | Type     | Comment
---       | ----     | -------
Content   | `string` | Note content
LastMtime | `time`   | The last modified datetime

#### Returns

The `note` object.


### Delete a note

> Delete a note

```shell
$ curl -X DELETE $BASE_URL/notes/64214a1d.md \
  -H 'Content-Type: application/json' \
  -d '{"LastMtime": "2023-11-30T14:22:44+02:00"}'
```

If the last modified time does not match the current modified time of
the note on disk, deleting the note will be refused as a fail-safe.

If the note has incoming links, deleting the note will be refused as to
not result in dangling links.

A cache update will be triggered automatically upon a successful
request.

This endpoint will return a `Forbidden` error response unless the daemon
is started with the `--writable` option.

#### Parameters

Key       | Type   | Comment
---       | ----   | -------
LastMtime | `time` | The last modified datetime

#### Returns

Returns an object with `Filename` and `Deleted` parameter on success.


### Retrieve a note

> Retrieve a note

```shell
$ curl $BASE_URL/notes/64214a1d.md
```

Retrieve a note with its metadata and full content.

#### Parameters

None.

#### Returns

The `note` object.


### List all notes

> List all notes

```shell
$ curl $BASE_URL/notes
```

#### Parameters

None.

#### Returns

A list of `note` objects (excluding `Content` and `Path` fields).


## Runtime

> Endpoints

```
GET  /api/runtime
```

This object represents the configuration, build details, host platform,
and memory usage of the running Notesium binary.

### The runtime object

> The runtime object

```json
{
  "home": "/home/github/notesium/notesium/tmp/dir/",
  "version": "0.1.2",
  "platform": "linux/amd64",
  "web": {
    "webroot": "embedded",
    "writable": true,
    "stop-on-idle": false,
    "daily-version-check": false
  },
  "build": {
    "gitversion": "v0.1.2-0-gda91f63",
    "buildtime": "2024-01-01T12:34:56Z",
    "goversion": "go1.20.5",
    "latest-release-url": "https://api.github.com/...notesium/releases/latest"
  },
  "memory": {
    "alloc": "510.0 KB",
    "total-alloc": "510.0 KB",
    "sys": "3.1 MB",
    "lookups": 0,
    "mallocs": 1866,
    "frees": 61
  }
}
```

#### Attributes

Key                      | Type     | Comment
---                      | ----     | -------
home                     | `string` | Path of notes directory
version                  | `string` | Version as determined from `gitversion`
platform                 | `string` | Operating system and architecture
web.webroot              | `string` | Path to webroot or `embedded`
web.writable             | `bool`   | Whether writing is allowed via API
web.stop-on-idle         | `bool`   | Whether to auto-stop on no activity
web.daily-version-check  | `bool`   | Whether to auto-check for new versions
build.gitversion         | `string` | Git version set at build
build.buildtime          | `time`   | Datetime of build
build.goversion          | `string` | GoLang version used to build
build.latest-release-url | `string` | URL to retrieve latest release version
memory.alloc             | `string` | Allocated heap objects
memory.total-alloc       | `string` | Total heap allocated
memory.sys               | `string` | Memory obtained from system
memory.lookups           | `uint64` | Number of pointer lookups
memory.mallocs           | `uint64` | Number of malloc calls
memory.frees             | `uint64` | Number of free calls

### Get runtime object

```shell
$ curl $BASE_URL/runtime
```

Retrieve runtime information.

#### Parameters

None

#### Returns

The `runtime` object.


## Raw command

> Endpoints

```
GET   /api/raw/new
GET   /api/raw/list
GET   /api/raw/links
GET   /api/raw/lines
GET   /api/raw/version
```

The API provides an **experimental** `raw/:cmd` endpoint, acting as a
pass-through for most of the CLI commands.

The same options as the CLI are supported. Boolean options must have
a value of `true` or `false`. Responses are returned as `text`.

### New

> New command

```shell
$ curl "$BASE_URL/raw/new?verbose=true"
```

Print path for a new note

#### Attributes

Key     | Type     | Comment
---     | ----     | -------
verbose | `bool`   | Output key:value pairs of related info
ctime   | `string` | Use specified ctime instead of now (YYYY-MM-DDThh:mm:ss)

#### Returns

Buffered raw text output of the command.

### List

> List command

```shell
$ curl "$BASE_URL/raw/list?color=true&sort=alpha"
```

Get list of notes

#### Attributes

Key     | Type     | Comment
---     | ----     | -------
color   | `bool`   | Color code prefix using ansi escape sequences
labels  | `bool`   | Limit list to only label notes (ie. one word title)
orphans | `bool`   | Limit list to notes without outgoing or incoming links
sort    | `string` | Sort list by date or alphabetically (ctime/mtime/alpha)
prefix  | `string` | Prefix title with date or linked label (ctime/mtime/label)
date    | `string` | Date format for ctime/mtime prefix (default: 2006-01-02)

#### Returns

Buffered raw text output of the command.

### Links

> Links command

```shell
$ curl "$BASE_URL/raw/links?filename=64214a1d.md"
```

Get list of all links or those related to filename.

#### Attributes

Key      | Type     | Comment
---      | ----     | -------
color    | `bool`   | Color code prefix using ansi escape sequences
outgoing | `bool`   | Limit list to outgoing links related to filename
incoming | `bool`   | Limit list to incoming links related to filename
dangling | `bool`   | Limit list to broken links
filename | `string` | Limit list to links related to filename

#### Returns

Buffered raw text output of the command.

### Lines

> Lines command

```shell
$ curl "$BASE_URL/raw/lines?color=true&prefix=title"
```

Get all lines of notes (ie. fulltext search)

#### Attributes

Key    | Type     | Comment
---    | ----     | -------
color  | `bool`   | Color code prefix using ansi escape sequences
prefix | `string` | Prefix each line with note title (title)
filter | `string` | Filter lines by query `AND (space), OR (\|), NOT (!)`

#### Returns

Buffered raw text output of the command.

### Stats

> Stats command

```shell
$ curl "$BASE_URL/raw/stats"
```

Get statistics

#### Attributes

Key   | Type   | Comment
---   | ----   | -------
color | `bool` | Color code prefix using ansi escape sequences
table | `bool` | Format as table with whitespace delimited columns

#### Returns

Buffered raw text output of the command.

### Version

> Version command

```shell
$ curl "$BASE_URL/raw/version?verbose=true"
```

Get version information

#### Attributes

Key     | Type   | Comment
---     | ----   | -------
verbose | `bool` | Output key:value pairs of related info
check   | `bool` | Check if a newer version is available

#### Returns

Buffered raw text output of the command.


## Heartbeat

> Send a heartbeat

```shell
$ curl $BASE_URL/heartbeat
```

The web daemon provides a `--stop-on-idle` option, which is used to
automatically stop the daemon when no activity is detected. Every API
request updates resets the idle time, but in order to keep the daemon
alive when the web interface is open but not actively being used, a
heartbeat must be sent.

This endpoint is only available when the daemon is started with the
`--stop-on-idle` option.

