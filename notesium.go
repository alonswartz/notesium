package main

import (
	"bufio"
	"embed"
	"fmt"
	"io"
	"io/fs"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

var version = "dev"

//go:embed completion.bash web/app
var embedfs embed.FS
var embedfsWebRoot = "web/app"

func main() {
	cmd, err := parseOptions(os.Args[1:])
	if err != nil {
		log.Fatal(err)
	}

	switch cmd.Name {
	case "help":
		fmt.Println(usage)
		os.Exit(1)
	case "version":
		fmt.Println(version)
		os.Exit(0)
	}

	notesiumDir, err := getNotesiumDir()
	if err != nil {
		log.Fatal(err)
	}

	switch cmd.Name {
	case "home":
		fmt.Println(notesiumDir)
	case "new":
		notesiumNew(notesiumDir)
	case "list":
		notesiumList(notesiumDir, cmd.Options.(listOptions), os.Stdout)
	case "links":
		notesiumLinks(notesiumDir, cmd.Options.(linksOptions), os.Stdout)
	case "lines":
		notesiumLines(notesiumDir, cmd.Options.(linesOptions), os.Stdout)
	case "stats":
		notesiumStats(notesiumDir, cmd.Options.(statsOptions))
	case "web":
		notesiumWeb(notesiumDir, cmd.Options.(webOptions))
	case "extract":
		notesiumExtract(cmd.Options.(extractOptions))
	}
}

func notesiumNew(dir string) {
	epochInt := time.Now().Unix()
	epochHex := fmt.Sprintf("%x", epochInt)
	newPath := filepath.Join(dir, fmt.Sprintf("%s.md", epochHex))
	fmt.Println(newPath)
}

func notesiumList(dir string, opts listOptions, w io.Writer) {
	populateCache(dir)
	notes := getSortedNotes(opts.sortBy)

	switch opts.limit {
	case "labels":
		for _, note := range notes {
			if note.IsLabel {
				fmt.Fprintf(w, "%s:1: %s\n", note.Filename, note.Title)
			}
		}
		return
	case "orphans":
		for _, note := range notes {
			if len(note.OutgoingLinks) == 0 && len(note.IncomingLinks) == 0 {
				fmt.Fprintf(w, "%s:1: %s\n", note.Filename, note.Title)
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
						fmt.Fprintln(w, line)
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
				fmt.Fprintln(w, line)
			}
		}
		for _, note := range notesWithoutLabelLinks {
			fmt.Fprintf(w, "%s:1: %s\n", note.Filename, note.Title)
		}
		return
	case "ctime":
		for _, note := range notes {
			dateStamp := getDateStamp(note.Ctime, opts.dateFormat)
			fmt.Fprintf(w, "%s:1: %s%s%s %s\n", note.Filename, opts.color.Code, dateStamp, opts.color.Reset, note.Title)
		}
		return
	case "mtime":
		for _, note := range notes {
			dateStamp := getDateStamp(note.Mtime, opts.dateFormat)
			fmt.Fprintf(w, "%s:1: %s%s%s %s\n", note.Filename, opts.color.Code, dateStamp, opts.color.Reset, note.Title)
		}
		return
	}

	for _, note := range notes {
		fmt.Fprintf(w, "%s:1: %s\n", note.Filename, note.Title)
	}
}

func notesiumLinks(dir string, opts linksOptions, w io.Writer) {
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
					fmt.Fprintf(w, "%s:1: %s\n", linkNote.Filename, linkNote.Title)
				}
			}
			return
		case "incoming":
			for _, link := range note.IncomingLinks {
				linkNote, exists := noteCache[link.Filename]
				if exists {
					fmt.Fprintf(w, "%s:%d: %s\n", linkNote.Filename, link.LineNumber, linkNote.Title)
				}
			}
			return
		default:
			prefix := fmt.Sprintf("%soutgoing%s", opts.color.Code, opts.color.Reset)
			for _, link := range note.OutgoingLinks {
				linkNote, exists := noteCache[link.Filename]
				if exists {
					fmt.Fprintf(w, "%s:1: %s %s\n", linkNote.Filename, prefix, linkNote.Title)
				}
			}
			prefix = fmt.Sprintf("%sincoming%s", opts.color.Code, opts.color.Reset)
			for _, link := range note.IncomingLinks {
				linkNote, exists := noteCache[link.Filename]
				if exists {
					fmt.Fprintf(w, "%s:%d: %s %s\n", linkNote.Filename, link.LineNumber, prefix, linkNote.Title)
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
					fmt.Fprintf(w, "%s:%d: %s%s%s → %s\n", note.Filename, link.LineNumber, opts.color.Code, note.Title, opts.color.Reset, link.Filename)
				}
			}
		}
		return
	}

	notes := getSortedNotes("alpha")
	for _, note := range notes {
		for _, link := range note.OutgoingLinks {
			linkNote, exists := noteCache[link.Filename]
			linkTitle := link.Filename
			if exists {
				linkTitle = linkNote.Title
			}
			fmt.Fprintf(w, "%s:%d: %s%s%s → %s\n", note.Filename, link.LineNumber, opts.color.Code, note.Title, opts.color.Reset, linkTitle)
		}
	}
}

func notesiumLines(dir string, opts linesOptions, w io.Writer) {
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
					fmt.Fprintf(w, "%s:%d: %s%s%s %s\n", filename, lineNumber, opts.color.Code, title, opts.color.Reset, line)
				} else {
					fmt.Fprintf(w, "%s:%d: %s\n", filename, lineNumber, line)
				}
			}

			if err := scanner.Err(); err != nil {
				log.Fatalf("scanner error: %s", err)
			}

			file.Close()
		}
	}
}

func notesiumStats(dir string, opts statsOptions) {
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

	keyFormat := opts.color.Code + (map[bool]string{true: "%-9s", false: "%s"}[opts.table]) + opts.color.Reset
	fmt.Printf(keyFormat+" %d\n", "notes", len(noteCache))
	fmt.Printf(keyFormat+" %d\n", "labels", labels)
	fmt.Printf(keyFormat+" %d\n", "orphans", orphans)
	fmt.Printf(keyFormat+" %d\n", "links", links)
	fmt.Printf(keyFormat+" %d\n", "dangling", dangling)
	fmt.Printf(keyFormat+" %d\n", "lines", lines)
	fmt.Printf(keyFormat+" %d\n", "words", words)
	fmt.Printf(keyFormat+" %d\n", "chars", chars)
}

func notesiumWeb(dir string, opts webOptions) {
	populateCache(dir)

	var httpfs http.FileSystem

	if opts.webroot == "" {
		subfs, err := fs.Sub(embedfs, embedfsWebRoot)
		if err != nil {
			log.Fatalf("embedded webroot sub error: %v", err)
		}
		httpfs = http.FS(subfs)
	} else {
		httpfs = http.Dir(opts.webroot)
	}

	ln, err := net.Listen("tcp", fmt.Sprintf("%s:%d", opts.host, opts.port))
	if err != nil {
		log.Fatalf("Failed to listen on a port: %v", err)
	}
	defer ln.Close()

	url := "http://localhost:" + strings.Split(ln.Addr().String(), ":")[1]
	server := &http.Server{
		Addr: ln.Addr().String(),
	}

	http.Handle("/", heartbeatH(http.FileServer(httpfs)))
	http.HandleFunc("/api/notes", heartbeatF(apiList))
	http.HandleFunc("/api/notes/", heartbeatF(func(w http.ResponseWriter, r *http.Request) {
		apiNote(dir, w, r, opts.readOnly)
	}))

	http.HandleFunc("/api/raw/", heartbeatF(func(w http.ResponseWriter, r *http.Request) {
		apiRaw(dir, w, r)
	}))

	var idleStopMsg string
	if opts.heartbeat {
		idleStopMsg = " (stop-on-idle enabled)"
		http.HandleFunc("/api/heartbeat", heartbeatF(apiHeartbeat))
		go checkHeartbeat(server)
	}

	if opts.launchBrowser {
		go func() {
			time.Sleep(500 * time.Millisecond)

			var cmd *exec.Cmd
			switch runtime.GOOS {
			case "linux":
				cmd = exec.Command("xdg-open", url)
			case "darwin":
				cmd = exec.Command("open", url)
			case "windows":
				cmd = exec.Command("cmd", "/c", "start", url)
			default:
				log.Println("Unsupported OS for launching browser")
				return
			}

			err := cmd.Start()
			if err != nil {
				log.Printf("Failed to launch the browser: %v", err)
			}
		}()
	}

	fmt.Printf("Serving on %s (bind address %s)\n", url, opts.host)
	fmt.Printf("Press Ctrl+C to stop%s\n", idleStopMsg)
	if err := server.Serve(ln); err != http.ErrServerClosed {
		log.Fatalf("Server closed unexpected:%+v", err)
	}
}

func notesiumExtract(opts extractOptions) {
	switch opts.path {
	case "":
		var files []string
		fs.WalkDir(embedfs, ".", func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if !d.IsDir() {
				files = append(files, path)
			}
			return nil
		})

		for _, file := range files {
			fmt.Println(file)
		}

	default:
		content, err := fs.ReadFile(embedfs, opts.path)
		if err != nil {
			log.Fatalf("Failed to read file: %s", err)
		}
		fmt.Println(string(content))
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
