package main

import (
	"bufio"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Note struct {
	Filename string
	Title    string
}

var noteCache map[string]*Note

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
		notesiumList(notesiumDir)
	default:
		fatal("unrecognized command: %s", os.Args[1])
	}
}

func notesiumNew(dir string) {
	epochInt := time.Now().Unix()
	epochHex := fmt.Sprintf("%x", epochInt)
	fmt.Printf("%s/%s.md\n", dir, epochHex)
}

func notesiumList(dir string) {
	populateCache(dir)

	for _, note := range noteCache {
		fmt.Printf("%s:1: %s\n", note.Filename, note.Title)
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

	var title string

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if title == "" {
			title = strings.TrimPrefix(line, "# ")
			break
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	note := &Note{
		Filename: filename,
		Title:    title,
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
		return "", fmt.Errorf("NOTESIUM_DIR does not exist: %s", dir)
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

Environment:
  NOTESIUM_DIR      Path to notes directory (default: $HOME/notes)

`, filepath.Base(os.Args[0]))
	os.Exit(1)
}
