package main

import (
	"errors"
	"fmt"
)

const usage = `Usage: notesium COMMAND [OPTIONS]

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
  graph             Print graph data
    --href=FORMAT   Node links format (default: file://%%:p:h/%%:t)
    --encoded-url   Encode graph data in base64 and append to graph file url
  version           Print version

Environment:
  NOTESIUM_DIR      Path to notes directory (default: $HOME/notes)
`

type Command struct {
	Name    string
	Options interface{}
}

type Color struct {
	Code  string
	Reset string
}

func parseOptions(args []string) (Command, error) {
	if len(args) < 1 {
		return Command{}, errors.New("no command provided")
	}

	cmd := Command{Name: args[0]}
	switch cmd.Name {
	case "new":
		return cmd, nil

	case "home":
		return cmd, nil

	case "list":
		return cmd, nil

	case "links":
		return cmd, nil

	case "lines":
		return cmd, nil

	case "stats":
		return cmd, nil

	case "graph":
		return cmd, nil

	default:
		return Command{}, fmt.Errorf("unrecognized command: %s", cmd.Name)
	}
}

func defaultColor() Color {
	return Color{
		Code:  "\033[0;36m",
		Reset: "\033[0m",
	}
}
