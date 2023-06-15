package main

import (
	"bufio"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type Link struct {
	LineNumber  int
	Destination string
}

type Note struct {
	Filename      string
	Title         string
	IsLabel       bool
	OutgoingLinks []Link
	Ctime         time.Time
	Mtime         time.Time
}

var noteCache map[string]*Note
var linkRegex = regexp.MustCompile(`\]\(([0-9a-f]{8}\.md)\)`)

func main() {
	helpFlags := map[string]bool{"-h": true, "--help": true, "help": true}
	if len(os.Args) < 2 || helpFlags[os.Args[1]] {
		usage()
	}

	notesiumDir, err := getNotesiumDir()
	if err != nil {
		fatal("%v", err)
	}

	switch os.Args[1] {
	case "home":
		fmt.Println(notesiumDir)
	case "new":
		notesiumNew(notesiumDir)
	case "list":
		var limit string
		var prefix string
		if len(os.Args) > 2 && os.Args[2] == "--labels" {
			limit = "labels"
		}
		if len(os.Args) > 2 && os.Args[2] == "--prefix=label" {
			prefix = "label"
		}
		if len(os.Args) > 2 && os.Args[2] == "--prefix=ctime" {
			prefix = "ctime"
		}
		if len(os.Args) > 2 && os.Args[2] == "--prefix=mtime" {
			prefix = "mtime"
		}
		notesiumList(notesiumDir, limit, prefix)
	case "links":
		var limit string
		if len(os.Args) > 2 && os.Args[2] == "--dangling" {
			limit = "dangling"
		}
		notesiumLinks(notesiumDir, limit)
	default:
		fatal("unrecognized command: %s", os.Args[1])
	}
}

func notesiumNew(dir string) {
	epochInt := time.Now().Unix()
	epochHex := fmt.Sprintf("%x", epochInt)
	fmt.Printf("%s/%s.md\n", dir, epochHex)
}

func notesiumList(dir string, limit string, prefix string) {
	populateCache(dir)

	switch limit {
	case "labels":
		for _, note := range noteCache {
			if note.IsLabel {
				fmt.Printf("%s:1: %s\n", note.Filename, note.Title)
			}
		}
		return
	}

	switch prefix {
	case "label":
		notesWithoutLabelLinks := make(map[string]*Note)
		for key, value := range noteCache {
			notesWithoutLabelLinks[key] = value
		}
		for _, note := range noteCache {
			for _, link := range note.OutgoingLinks {
				if linkNote, exists := noteCache[link.Destination]; exists && linkNote.IsLabel {
					fmt.Printf("%s:1: %s %s\n", note.Filename, linkNote.Title, note.Title)
					delete(notesWithoutLabelLinks, note.Filename)
				}
			}
		}
		for _, note := range notesWithoutLabelLinks {
			fmt.Printf("%s:1: %s\n", note.Filename, note.Title)
		}
		return
	case "ctime":
		for _, note := range noteCache {
			fmt.Printf("%s:1: %s %s\n", note.Filename, note.Ctime.Format("2006-01-02"), note.Title)
		}
		return
	case "mtime":
		for _, note := range noteCache {
			fmt.Printf("%s:1: %s %s\n", note.Filename, note.Mtime.Format("2006-01-02"), note.Title)
		}
		return
	}

	for _, note := range noteCache {
		fmt.Printf("%s:1: %s\n", note.Filename, note.Title)
	}
}

func notesiumLinks(dir string, limit string) {
	populateCache(dir)

	switch limit {
	case "dangling":
		for _, note := range noteCache {
			for _, link := range note.OutgoingLinks {
				_, exists := noteCache[link.Destination]
				if !exists {
					fmt.Printf("%s:%d: %s → %s\n", note.Filename, link.LineNumber, note.Title, link.Destination)
				}
			}
		}
		return
	}

	for _, note := range noteCache {
		for _, link := range note.OutgoingLinks {
			linkNote, exists := noteCache[link.Destination]
			linkTitle := link.Destination
			if exists {
				linkTitle = linkNote.Title
			}
			fmt.Printf("%s:%d: %s → %s\n", note.Filename, link.LineNumber, note.Title, linkTitle)
		}
	}
}

func populateCache(dir string) {
	noteCache = make(map[string]*Note)

	files, err := ioutil.ReadDir(dir)
	if err != nil {
		log.Fatalf("Could not read directory: %s\n", err)
	}

	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".md") {
			filename := file.Name()
			note, err := readNote(dir, filename)
			if err != nil {
				log.Fatalf("Could not read note: %s\n", err)
			}
			noteCache[filename] = note
		}
	}
}

func readNote(dir string, filename string) (*Note, error) {
	path := filepath.Join(dir, filename)
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("could not open file: %s", err)
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil {
		return nil, fmt.Errorf("could not get file info: %s", err)
	}
	mtime := info.ModTime()

	hexTime := strings.TrimSuffix(filename, ".md")
	unixTime, err := strconv.ParseInt(hexTime, 16, 64)
	if err != nil {
		return nil, err
	}
	ctime := time.Unix(unixTime, 0)

	var title string
	var isLabel bool
	var outgoingLinks []Link

	scanner := bufio.NewScanner(file)
	lineNumber := 0
	for scanner.Scan() {
		lineNumber++
		line := scanner.Text()
		if title == "" {
			title = strings.TrimPrefix(line, "# ")
			isLabel = len(strings.Fields(title)) == 1
			continue
		}
		matches := linkRegex.FindAllStringSubmatch(line, -1)
		for _, match := range matches {
			outgoingLinks = append(outgoingLinks, Link{LineNumber: lineNumber, Destination: match[1]})
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	note := &Note{
		Filename:      filename,
		Title:         title,
		IsLabel:       isLabel,
		OutgoingLinks: outgoingLinks,
		Ctime:         ctime,
		Mtime:         mtime,
	}

	return note, nil
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

func fatal(format string, a ...interface{}) {
	fmt.Fprintf(os.Stderr, "Fatal: "+format+"\n", a...)
	os.Exit(1)
}

func usage() {
	fmt.Printf(`Usage: %s COMMAND [OPTIONS]

Commands:
  new               Print path for a new note
  home              Print path to notes directory
  list              Print list of notes
    --labels        Limit list to only label notes (ie. one word title)
    --prefix=WORD   Prefix title with date or linked label (ctime|mtime|label)
  links             Print list of links
    --dangling      Limit list to broken links

Environment:
  NOTESIUM_DIR      Path to notes directory (default: $HOME/notes)

`, filepath.Base(os.Args[0]))
	os.Exit(1)
}
