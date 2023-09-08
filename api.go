package main

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type NoteResponse struct {
	Note
	Path    string `json:"Path"`
	Content string `json:"Content"`
}

func apiHeartbeat(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Heartbeat received."))
}

func apiList(w http.ResponseWriter, r *http.Request) {
	jsonResponse, err := json.Marshal(noteCache)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonResponse)
}

func apiNote(dir string, w http.ResponseWriter, r *http.Request) {
	filename := strings.Split(r.URL.Path, "/")[3]

	note, ok := noteCache[filename]
	if !ok {
		http.Error(w, "Note not found", http.StatusNotFound)
		return
	}

	path := filepath.Join(dir, filename)
	content, err := os.ReadFile(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	noteResponse := NoteResponse{
		Note:    *note,
		Path:    path,
		Content: string(content),
	}

	jsonResponse, err := json.Marshal(noteResponse)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonResponse)
}

//////////////////////////////// experimental ////////////////////////////////

type streamResponseWriter struct {
	w http.ResponseWriter
}

func (rw *streamResponseWriter) Write(p []byte) (n int, err error) {
	n, err = rw.w.Write(p)
	if f, ok := rw.w.(http.Flusher); ok {
		f.Flush()
	}
	return
}

func apiStream(dir string, w http.ResponseWriter, r *http.Request) {
	pathSegments := strings.Split(r.URL.Path, "/")
	if len(pathSegments) < 4 || pathSegments[3] == "" {
		http.Error(w, "no command specified", http.StatusNotFound)
		return
	}
	command := pathSegments[3]

	var writer io.Writer
	writer = &streamResponseWriter{w}

	switch command {
	case "list":
		opts := listOptions{}
		notesiumList(dir, opts, writer)
	default:
		http.Error(w, "unrecognized command: "+command, http.StatusBadRequest)
		return
	}
}
