package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
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
    --filter=QUERY  Filter lines by query: AND (space), OR (|), NOT (!)
  stats             Print statistics
    --color         Color code using ansi escape sequences
    --table         Format as table with whitespace delimited columns
  finder            Start finder (interactive filter selection TUI)
    --preview       Display note preview (toggle with ctrl-/)
    --prompt=STR    Set custom prompt text
    -- CMD [OPTS]   Input (default: list --color --prefix=label --sort=alpha)
  web               Start web server
    --webroot=PATH  Path to web root to serve (default: embedded webroot)
    --mount=DIR:URI Additional directory to serve under webroot (experimental)
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
	filter string
}

type finderOptions struct {
	input   []string
	prompt  string
	preview bool
}

type catOptions struct {
	filename string
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
	mounts        map[string]string
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
			case strings.HasPrefix(opt, "--filter="):
				opts.filter = strings.TrimPrefix(opt, "--filter=")
			default:
				return Command{}, fmt.Errorf("unrecognized option: %s", opt)
			}
		}
		cmd.Options = opts
		return cmd, nil

	case "finder":
		opts := finderOptions{}
		opts.input = []string{"list", "--color", "--prefix=label", "--sort=alpha"}
		for i, opt := range args[1:] {
			if opt == "--" {
				opts.input = args[i+2:]
				if len(opts.input) == 0 {
					return Command{}, fmt.Errorf("input command not specified")
				}
				break
			}
			switch {
			case opt == "--preview":
				opts.preview = true
			case strings.HasPrefix(opt, "--prompt="):
				opts.prompt = strings.TrimPrefix(opt, "--prompt=")
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
		opts := webOptions{}
		opts.host = "127.0.0.1"
		opts.port = 0
		opts.readOnly = true
		opts.webroot = "embedded"
		opts.check = true
		opts.mounts = make(map[string]string)
		for _, opt := range args[1:] {
			switch {
			case strings.HasPrefix(opt, "--webroot="):
				webrootStr := strings.TrimPrefix(opt, "--webroot=")
				webrootAbs, err := getAbsDir(webrootStr)
				if err != nil {
					return Command{}, fmt.Errorf("webroot %v: %s", err, webrootAbs)
				}
				opts.webroot = webrootAbs
			case opt == "--open-browser":
				opts.launchBrowser = true
			case opt == "--stop-on-idle":
				opts.heartbeat = true
			case strings.HasPrefix(opt, "--port="):
				portStr := strings.TrimPrefix(opt, "--port=")
				port, err := strconv.Atoi(portStr)
				if err != nil || port < 1024 || port > 65535 {
					return Command{}, fmt.Errorf("invalid or out of range port number: %s", portStr)
				}
				opts.port = port
			case opt == "--no-check":
				opts.check = false
			case opt == "--writable":
				opts.readOnly = false
			case strings.HasPrefix(opt, "--mount="):
				mountStr := strings.TrimPrefix(opt, "--mount=")
				mountPattern := regexp.MustCompile(`^(.+?):(/[a-zA-Z0-9-_]+/)$`)
				matches := mountPattern.FindStringSubmatch(mountStr)
				if matches == nil {
					return Command{}, fmt.Errorf("mount format mismatch: expected '%s'", mountPattern.String())
				}
				srcAbs, err := getAbsDir(matches[1])
				if err != nil {
					return Command{}, fmt.Errorf("mount source %v: %s", err, srcAbs)
				}
				opts.mounts[matches[2]] = srcAbs
			default:
				return Command{}, fmt.Errorf("unrecognized option: %s", opt)
			}
		}
		cmd.Options = opts
		return cmd, nil

	case "cat":
		if len(args) != 2 {
			return Command{}, fmt.Errorf("filename not specified or too many arguments")
		}
		filename := args[1]
		if colonIndex := strings.Index(filename, ":"); colonIndex != -1 {
			filename = filename[:colonIndex]
		}
		opts := catOptions{filename: filename}
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
	absDir, err := getAbsDir(dir)
	if err != nil {
		return "", fmt.Errorf("NOTESIUM_DIR %v: %s", err, absDir)
	}
	return absDir, nil
}

func getAbsDir(dir string) (string, error) {
	absDir, err := filepath.Abs(dir)
	if err != nil {
		return dir, fmt.Errorf("failed to resolve absolute path: %v", err)
	}
	realDir, err := filepath.EvalSymlinks(absDir)
	if err != nil {
		return absDir, fmt.Errorf("does not exist")
	}
	info, err := os.Stat(realDir)
	if err != nil {
		return realDir, fmt.Errorf("does not exist")
	}
	if !info.IsDir() {
		return realDir, fmt.Errorf("is not a directory")
	}
	return realDir, nil
}

func defaultColor() Color {
	return Color{
		Code:  "\033[0;36m",
		Reset: "\033[0m",
	}
}
