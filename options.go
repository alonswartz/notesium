package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
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

type listOptions struct {
	color      Color
	limit      string
	prefix     string
	sortBy     string
	dateFormat string
}

type linksOptions struct {
	color    Color
	limit    string
	filename string
}

type linesOptions struct {
	color  Color
	prefix string
}

type statsOptions struct {
	color Color
	table bool
}

type graphOptions struct {
	href       string
	encodedUrl bool
}

type Color struct {
	Code  string
	Reset string
}

func parseOptions(args []string) (Command, error) {
	if len(args) < 1 {
		return Command{Name: "help"}, nil
	}

	cmd := Command{Name: args[0]}
	switch cmd.Name {
	case "-h", "--help", "help":
		cmd.Name = "help"
		return cmd, nil

	case "-v", "--version", "version":
		cmd.Name = "version"
		return cmd, nil

	case "new", "home":
		if len(args) > 1 {
			return cmd, fmt.Errorf("unrecognized option: %s", args[1])
		}
		return cmd, nil

	case "list":
		opts := listOptions{}
		opts.dateFormat = "2006-01-02"
		for _, opt := range args[1:] {
			switch {
			case opt == "--color":
				opts.color = defaultColor()
			case opt == "--labels":
				opts.limit = "labels"
			case opt == "--orphans":
				opts.limit = "orphans"
			case opt == "--prefix=ctime":
				opts.prefix = "ctime"
			case opt == "--prefix=mtime":
				opts.prefix = "mtime"
			case opt == "--prefix=label":
				opts.prefix = "label"
			case opt == "--sort=ctime":
				opts.sortBy = "ctime"
			case opt == "--sort=mtime":
				opts.sortBy = "mtime"
			case opt == "--sort=alpha":
				opts.sortBy = "alpha"
			case strings.HasPrefix(opt, "--date="):
				opts.dateFormat = strings.TrimPrefix(opt, "--date=")
			default:
				return Command{}, fmt.Errorf("unrecognized option: %s", opt)
			}
		}
		cmd.Options = opts
		return cmd, nil

	case "links":
		opts := linksOptions{}
		filenameRequired := false
		for _, opt := range args[1:] {
			switch {
			case opt == "--color":
				opts.color = defaultColor()
			case opt == "--dangling":
				opts.limit = "dangling"
			case opt == "--outgoing":
				opts.limit = map[bool]string{true: "", false: "outgoing"}[opts.limit == "incoming"]
				filenameRequired = true
			case opt == "--incoming":
				opts.limit = map[bool]string{true: "", false: "incoming"}[opts.limit == "outgoing"]
				filenameRequired = true
			case strings.HasSuffix(opt, ".md"):
				opts.filename = opt
			default:
				return Command{}, fmt.Errorf("unrecognized option: %s", opt)
			}
		}
		if opts.filename != "" && opts.limit == "dangling" {
			return Command{}, fmt.Errorf("filename not supported")
		}
		if opts.filename == "" && filenameRequired {
			return Command{}, fmt.Errorf("filename is required")
		}
		cmd.Options = opts
		return cmd, nil

	case "lines":
		opts := linesOptions{}
		for _, opt := range args[1:] {
			switch {
			case opt == "--color":
				opts.color = defaultColor()
			case opt == "--prefix=title":
				opts.prefix = "title"
			default:
				return Command{}, fmt.Errorf("unrecognized option: %s", opt)
			}
		}
		cmd.Options = opts
		return cmd, nil

	case "stats":
		opts := statsOptions{}
		for _, opt := range args[1:] {
			switch {
			case opt == "--color":
				opts.color = defaultColor()
			case opt == "--table":
				opts.table = true
			default:
				return Command{}, fmt.Errorf("unrecognized option: %s", opt)
			}
		}
		cmd.Options = opts
		return cmd, nil

	case "graph":
		opts := graphOptions{}
		opts.href = "file://%:p:h/%:t"
		for _, opt := range args[1:] {
			switch {
			case opt == "--encoded-url":
				opts.encodedUrl = true
			case strings.HasPrefix(opt, "--href="):
				opts.href = strings.TrimPrefix(opt, "--href=")
			default:
				return Command{}, fmt.Errorf("unrecognized option: %s", opt)
			}
		}
		cmd.Options = opts
		return cmd, nil

	default:
		if strings.HasPrefix(cmd.Name, "-") {
			return cmd, fmt.Errorf("unrecognized option: %s", cmd.Name)
		}
		return cmd, fmt.Errorf("unrecognized command: %s", cmd.Name)
	}
}

func getNotesiumDir() (string, error) {
	dir, exists := os.LookupEnv("NOTESIUM_DIR")
	if !exists {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		dir = filepath.Join(home, "notes")
	}
	absDir, err := filepath.Abs(dir)
	if err != nil {
		return "", err
	}
	realDir, err := filepath.EvalSymlinks(absDir)
	if err != nil {
		return "", fmt.Errorf("NOTESIUM_DIR does not exist: %s", absDir)
	}
	info, err := os.Stat(realDir)
	if err != nil {
		return "", fmt.Errorf("NOTESIUM_DIR does not exist: %s", realDir)
	}
	if !info.IsDir() {
		return "", fmt.Errorf("NOTESIUM_DIR is not a directory: %s", realDir)
	}

	return realDir, nil
}

func defaultColor() Color {
	return Color{
		Code:  "\033[0;36m",
		Reset: "\033[0m",
	}
}
