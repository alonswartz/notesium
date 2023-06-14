package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	helpFlags := map[string]bool{"-h": true, "--help": true, "help": true}
	if len(os.Args) < 2 || helpFlags[os.Args[1]] {
		usage()
	}

	switch os.Args[1] {
	default:
		fatal("unrecognized command: %s", os.Args[1])
	}
}

func fatal(format string, a ...interface{}) {
    fmt.Fprintf(os.Stderr, "Fatal: "+format+"\n", a...)
    os.Exit(1)
}

func usage() {
	fmt.Printf("Usage: %s COMMAND [OPTIONS]\n\n", filepath.Base(os.Args[0]))
	os.Exit(1)
}
