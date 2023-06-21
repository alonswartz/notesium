package main

import (
	"bufio"
	"bytes"
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var version = "dev"

func main() {
	helpFlags := map[string]bool{"-h": true, "--help": true, "help": true}
	if len(os.Args) < 2 || helpFlags[os.Args[1]] {
		fmt.Println(usage)
		os.Exit(1)
	}

	versionFlags := map[string]bool{"-v": true, "--version": true, "version": true}
	if len(os.Args) < 2 || versionFlags[os.Args[1]] {
		fmt.Println(version)
		os.Exit(0)
	}

	notesiumDir, err := getNotesiumDir()
	if err != nil {
		fatal("%v", err)
	}

	cmd, err := parseOptions(os.Args[1:])
	if err != nil {
		log.Fatal(err)
	}

	switch cmd.Name {
	case "home":
		fmt.Println(notesiumDir)
	case "new":
		notesiumNew(notesiumDir)
	case "list":
		notesiumList(notesiumDir, cmd.Options.(listOptions))
	case "links":
		notesiumLinks(notesiumDir, cmd.Options.(linksOptions))
	case "lines":
		notesiumLines(notesiumDir, cmd.Options.(linesOptions))
	case "stats":
		var table bool
		color := Color{}
		for _, arg := range os.Args[2:] {
			switch {
			case arg == "--color":
				color = defaultColor()
			case arg == "--table":
				table = true
			}
		}
		notesiumStats(notesiumDir, table, color)
	case "graph":
		var encodedUrl bool
		href := "file://%:p:h/%:t"
		for _, arg := range os.Args[2:] {
			switch {
			case arg == "--encoded-url":
				encodedUrl = true
			case strings.HasPrefix(arg, "--href="):
				href = strings.TrimPrefix(arg, "--href=")
			}
		}
		notesiumGraph(notesiumDir, href, encodedUrl)
	default:
		fatal("unrecognized command: %s", os.Args[1])
	}
}

func notesiumNew(dir string) {
	epochInt := time.Now().Unix()
	epochHex := fmt.Sprintf("%x", epochInt)
	newPath := filepath.Join(dir, fmt.Sprintf("%s.md", epochHex))
	fmt.Println(newPath)
}

func notesiumList(dir string, opts listOptions) {
	populateCache(dir)
	notes := getSortedNotes(opts.sortBy)

	switch opts.limit {
	case "labels":
		for _, note := range notes {
			if note.IsLabel {
				fmt.Printf("%s:1: %s\n", note.Filename, note.Title)
			}
		}
		return
	case "orphans":
		for _, note := range notes {
			if len(note.OutgoingLinks) == 0 && len(note.IncomingLinks) == 0 {
				fmt.Printf("%s:1: %s\n", note.Filename, note.Title)
			}
		}
		return
	}

	switch opts.prefix {
	case "label":
		var notesWithoutLabelLinks []*Note
		var outputLines []string
		for _, note := range notes {
			labelLinked := false
			for _, link := range note.OutgoingLinks {
				if linkNote, exists := noteCache[link.Filename]; exists && linkNote.IsLabel {
					line := fmt.Sprintf("%s:1: %s%s%s %s", note.Filename, opts.color.Code, linkNote.Title, opts.color.Reset, note.Title)
					if opts.sortBy == "alpha" {
						outputLines = append(outputLines, line)
					} else {
						fmt.Println(line)
					}
					labelLinked = true
				}
			}
			if !labelLinked {
				notesWithoutLabelLinks = append(notesWithoutLabelLinks, note)
			}
		}
		if opts.sortBy == "alpha" {
			sortLinesByField(outputLines, ": ", 1)
			for _, line := range outputLines {
				fmt.Println(line)
			}
		}
		for _, note := range notesWithoutLabelLinks {
			fmt.Printf("%s:1: %s\n", note.Filename, note.Title)
		}
		return
	case "ctime":
		for _, note := range notes {
			dateStamp := getDateStamp(note.Ctime, opts.dateFormat)
			fmt.Printf("%s:1: %s%s%s %s\n", note.Filename, opts.color.Code, dateStamp, opts.color.Reset, note.Title)
		}
		return
	case "mtime":
		for _, note := range notes {
			dateStamp := getDateStamp(note.Mtime, opts.dateFormat)
			fmt.Printf("%s:1: %s%s%s %s\n", note.Filename, opts.color.Code, dateStamp, opts.color.Reset, note.Title)
		}
		return
	}

	for _, note := range notes {
		fmt.Printf("%s:1: %s\n", note.Filename, note.Title)
	}
}

func notesiumLinks(dir string, opts linksOptions) {
	populateCache(dir)

	if opts.filename != "" {
		note, exists := noteCache[opts.filename]
		if !exists {
			log.Fatalf("filename does not exist")
		}
		switch opts.limit {
		case "outgoing":
			for _, link := range note.OutgoingLinks {
				linkNote, exists := noteCache[link.Filename]
				if exists {
					fmt.Printf("%s:1: %s\n", linkNote.Filename, linkNote.Title)
				}
			}
			return
		case "incoming":
			for _, link := range note.IncomingLinks {
				linkNote, exists := noteCache[link.Filename]
				if exists {
					fmt.Printf("%s:%d: %s\n", linkNote.Filename, link.LineNumber, linkNote.Title)
				}
			}
			return
		default:
			prefix := fmt.Sprintf("%soutgoing%s", opts.color.Code, opts.color.Reset)
			for _, link := range note.OutgoingLinks {
				linkNote, exists := noteCache[link.Filename]
				if exists {
					fmt.Printf("%s:1: %s %s\n", linkNote.Filename, prefix, linkNote.Title)
				}
			}
			prefix = fmt.Sprintf("%sincoming%s", opts.color.Code, opts.color.Reset)
			for _, link := range note.IncomingLinks {
				linkNote, exists := noteCache[link.Filename]
				if exists {
					fmt.Printf("%s:%d: %s %s\n", linkNote.Filename, link.LineNumber, prefix, linkNote.Title)
				}
			}
		}
		return
	}

	switch opts.limit {
	case "dangling":
		for _, note := range noteCache {
			for _, link := range note.OutgoingLinks {
				_, exists := noteCache[link.Filename]
				if !exists {
					fmt.Printf("%s:%d: %s%s%s → %s\n", note.Filename, link.LineNumber, opts.color.Code, note.Title, opts.color.Reset, link.Filename)
				}
			}
		}
		return
	}

	for _, note := range noteCache {
		for _, link := range note.OutgoingLinks {
			linkNote, exists := noteCache[link.Filename]
			linkTitle := link.Filename
			if exists {
				linkTitle = linkNote.Title
			}
			fmt.Printf("%s:%d: %s%s%s → %s\n", note.Filename, link.LineNumber, opts.color.Code, note.Title, opts.color.Reset, linkTitle)
		}
	}
}

func notesiumLines(dir string, opts linesOptions) {
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		log.Fatalf("Could not read directory: %s\n", err)
	}

	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".md") {
			filename := file.Name()
			path := filepath.Join(dir, filename)
			file, err := os.Open(path)
			if err != nil {
				log.Fatalf("Could not open file: %s\n", err)
			}

			var title string
			scanner := bufio.NewScanner(file)
			lineNumber := 0
			for scanner.Scan() {
				lineNumber++
				line := scanner.Text()
				if line == "" {
					continue
				}
				if opts.prefix == "title" {
					if title == "" && strings.HasPrefix(line, "# ") {
						title = strings.TrimPrefix(line, "# ")
					}
					fmt.Printf("%s:%d: %s%s%s %s\n", filename, lineNumber, opts.color.Code, title, opts.color.Reset, line)
				} else {
					fmt.Printf("%s:%d: %s\n", filename, lineNumber, line)
				}
			}

			if err := scanner.Err(); err != nil {
				log.Fatalf("scanner error: %s", err)
			}

			file.Close()
		}
	}
}

func notesiumStats(dir string, table bool, color Color) {
	populateCache(dir)

	labels := 0
	orphans := 0
	links := 0
	dangling := 0
	lines := 0
	words := 0
	chars := 0

	for _, note := range noteCache {
		if note.IsLabel {
			labels++
		}
		if len(note.OutgoingLinks) == 0 && len(note.IncomingLinks) == 0 {
			orphans++
		}
		for _, link := range note.OutgoingLinks {
			_, exists := noteCache[link.Filename]
			if !exists {
				dangling++
			}
		}

		links += len(note.OutgoingLinks)
		lines += note.Lines
		words += note.Words
		chars += note.Chars
	}

	keyFormat := color.Code + (map[bool]string{true: "%-9s", false: "%s"}[table]) + color.Reset
	fmt.Printf(keyFormat+" %d\n", "notes", len(noteCache))
	fmt.Printf(keyFormat+" %d\n", "labels", labels)
	fmt.Printf(keyFormat+" %d\n", "orphans", orphans)
	fmt.Printf(keyFormat+" %d\n", "links", links)
	fmt.Printf(keyFormat+" %d\n", "dangling", dangling)
	fmt.Printf(keyFormat+" %d\n", "lines", lines)
	fmt.Printf(keyFormat+" %d\n", "words", words)
	fmt.Printf(keyFormat+" %d\n", "chars", chars)
}

func notesiumGraph(dir string, href string, encodedUrl bool) {
	populateCache(dir)

	var buffer bytes.Buffer
	fmt.Fprintf(&buffer, "%s\n", strings.Replace(href, "%:p:h", dir, -1))
	fmt.Fprintf(&buffer, "-----\n")
	fmt.Fprintf(&buffer, "id,title\n")
	for _, note := range noteCache {
		fmt.Fprintf(&buffer, "%s,%s\n", note.Filename, note.Title)
	}
	fmt.Fprintf(&buffer, "-----\n")
	fmt.Fprintf(&buffer, "source,target\n")
	for _, note := range noteCache {
		for _, link := range note.OutgoingLinks {
			fmt.Fprintf(&buffer, "%s,%s\n", note.Filename, link.Filename)
		}
	}

	if encodedUrl {
		exePath, err := os.Executable()
		if err != nil {
			log.Fatalf("Could not get executable path: %v\n", err)
		}
		graphIndex := filepath.Join(filepath.Dir(exePath), "graph", "index.html")
		if _, err := os.Stat(graphIndex); os.IsNotExist(err) {
			log.Fatalf("%s does not exist\n", graphIndex)
		}
		fmt.Printf("file://%s?data=%s\n", graphIndex, base64.StdEncoding.EncodeToString(buffer.Bytes()))
	} else {
		fmt.Print(buffer.String())
	}
}

func getDateStamp(t time.Time, dateFormat string) string {
	dateStamp := t.Format(dateFormat)

	// experimental: monday first day of week
	if strings.Contains(dateStamp, "%V") {
		_, week := t.ISOWeek()
		dateStamp = strings.Replace(dateStamp, "%V", fmt.Sprintf("%02d", week), 1)
	}

	// experimental: sunday first day of week
	if strings.Contains(dateStamp, "%U") {
		_, week := t.ISOWeek()
		if t.Weekday() == time.Sunday {
			_, week = t.AddDate(0, 0, 1).ISOWeek()
			if t.Month() == time.January && t.Day() == 1 {
				week = 1
			}
		}
		dateStamp = strings.Replace(dateStamp, "%U", fmt.Sprintf("%02d", week), 1)
	}

	return dateStamp
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
