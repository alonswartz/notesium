package main

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

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
	case "new":
		notesiumNew(notesiumDir)
	case "home":
		fmt.Println(notesiumDir)
	default:
		fatal("unrecognized command: %s", os.Args[1])
	}
}

func notesiumNew(notesiumDir string) {
	epochInt := time.Now().Unix()
	epochHex := fmt.Sprintf("%x", epochInt)
	fmt.Printf("%s/%s.md\n", notesiumDir, epochHex)
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

Environment:
  NOTESIUM_DIR      Path to notes directory (default: $HOME/notes)

`, filepath.Base(os.Args[0]))
	os.Exit(1)
}
