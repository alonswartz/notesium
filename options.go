package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

const usage = `Usage: notesium COMMAND [OPTIONS]

Commands:
  home              Print path to notes directory
  new               Print path for a new note
    --verbose       Output key:value pairs of related info
    --ctime=        Use specified ctime instead of now (YYYY-MM-DDThh:mm:ss)
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
    --no-check      Disable daily new version checks
    --writable      Allow writing of notes in NOTESIUM_DIR via API
  extract [path]    Print list of embedded files or contents of file path
  version           Print version
    --verbose       Output key:value pairs of related info
    --check         Check if a newer version is available

Environment:
  NOTESIUM_DIR      Path to notes directory (default: $HOME/notes)
`

type Command struct {
	Name    string
	Options interface{}
}

type newOptions struct {
	ctime   string
	verbose bool
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

type webOptions struct {
	host          string
	port          int
	webroot       string
	heartbeat     bool
	launchBrowser bool
	readOnly      bool
	check         bool
}

type extractOptions struct {
	path string
}

type versionOptions struct {
	verbose bool
	check   bool
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

	// backwards compat.
	case "-v", "--version":
		cmd.Name = "version"
		cmd.Options = versionOptions{}
		return cmd, nil

	case "home":
		if len(args) > 1 {
			return cmd, fmt.Errorf("unrecognized option: %s", args[1])
		}
		return cmd, nil

	case "new":
		opts := newOptions{}
		for _, opt := range args[1:] {
			switch {
			case opt == "--verbose":
				opts.verbose = true
			case strings.HasPrefix(opt, "--ctime="):
				opts.ctime = strings.TrimPrefix(opt, "--ctime=")
			default:
				return Command{}, fmt.Errorf("unrecognized option: %s", opt)
			}
		}
		cmd.Options = opts
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
			case strings.HasPrefix(opt, "--filename=") && strings.HasSuffix(opt, ".md"):
				opts.filename = strings.TrimPrefix(opt, "--filename=")
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

	case "web":
		opts := webOptions{
			host:    "127.0.0.1",
			port:    0,
			readOnly: true,
			webroot: "embedded",
			check:   true,
		}
		for _, opt := range args[1:] {
			switch {
			case strings.HasPrefix(opt, "--webroot="):
				opts.webroot = strings.TrimPrefix(opt, "--webroot=")
			case opt == "--open-browser":
				opts.launchBrowser = true
			case opt == "--stop-on-idle":
				opts.heartbeat = true
			case strings.HasPrefix(opt, "--port="):
				port, err := strconv.Atoi(strings.TrimPrefix(opt, "--port="))
				if err != nil || port < 1024 || port > 65535 {
					return Command{}, fmt.Errorf("invalid or out of range port number: %s", opt)
				}
				opts.port = port
			case strings.HasPrefix(opt, "--host="):
				opts.host = strings.TrimPrefix(opt, "--host=")
			case opt == "--no-check":
				opts.check = false
			case opt == "--writable":
				opts.readOnly = false
			default:
				return Command{}, fmt.Errorf("unrecognized option: %s", opt)
			}
		}
		if opts.webroot != "embedded" {
			webrootAbs, err := filepath.Abs(opts.webroot)
			if err != nil {
				return Command{}, fmt.Errorf("failed to get absolute path: %v", err)
			}
			webrootInfo, err := os.Stat(webrootAbs)
			if err != nil {
				return Command{}, fmt.Errorf("webroot does not exist: %v", err)
			}
			if !webrootInfo.IsDir() {
				return Command{}, fmt.Errorf("webroot is not a directory: %v", err)
			}
			opts.webroot = webrootAbs
		}
		cmd.Options = opts
		return cmd, nil

	case "version":
		opts := versionOptions{}
		for _, opt := range args[1:] {
			switch {
			case opt == "--verbose":
				opts.verbose = true
			case opt == "--check":
				opts.check = true
			default:
				return Command{}, fmt.Errorf("unrecognized option: %s", opt)
			}
		}
		cmd.Options = opts
		return cmd, nil

	case "extract":
		opts := extractOptions{}
		for _, opt := range args[1:] {
			opts.path = opt
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
