package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	if len(os.Args) < 2 {
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
