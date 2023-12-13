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
	Filename   string
	Title      string
	LineNumber int
}

type Note struct {
	Filename      string
	Title         string
	IsLabel       bool
	OutgoingLinks []*Link
	IncomingLinks []*Link
	Ctime         time.Time
	Mtime         time.Time
	Lines         int
	Words         int
	Chars         int
}

var noteCache map[string]*Note
var linkRegex = regexp.MustCompile(`\]\(([0-9a-f]{8}\.md)\)`)

func populateCache(dir string) {
	if noteCache != nil {
		return
	}

	noteCache = make(map[string]*Note)

	files, err := ioutil.ReadDir(dir)
	if err != nil {
		log.Fatalf("could not read directory: %s\n", err)
	}

	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".md") {
			filename := file.Name()
			note, err := readNote(dir, filename)
			if err != nil {
				log.Fatalf("could not read note: %s\n", err)
			}
			noteCache[filename] = note
		}
	}

	for _, note := range noteCache {
		for _, link := range note.OutgoingLinks {
			if targetNote, exists := noteCache[link.Filename]; exists {
				link.Title = targetNote.Title
				targetNote.IncomingLinks = append(targetNote.IncomingLinks, &Link{
					Filename:   note.Filename,
					Title:      note.Title,
					LineNumber: link.LineNumber,
				})
			}
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
	var outgoingLinks []*Link
	var lines, words, chars int

	scanner := bufio.NewScanner(file)
	lineNumber := 0
	for scanner.Scan() {
		lineNumber++
		line := scanner.Text()
		if line != "" {
			lines++
			words += len(strings.Fields(line))
			chars += len(line)
		}
		if title == "" {
			title = strings.TrimPrefix(line, "# ")
			isLabel = len(strings.Fields(title)) == 1
			continue
		}
		matches := linkRegex.FindAllStringSubmatch(line, -1)
		for _, match := range matches {
			outgoingLinks = append(outgoingLinks, &Link{LineNumber: lineNumber, Filename: match[1]})
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	if title == "" {
		title = "untitled"
	}

	note := &Note{
		Filename:      filename,
		Title:         title,
		IsLabel:       isLabel,
		OutgoingLinks: outgoingLinks,
		Ctime:         ctime,
		Mtime:         mtime,
		Lines:         lines,
		Words:         words,
		Chars:         chars,
	}

	return note, nil
}
