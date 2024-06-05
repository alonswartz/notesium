package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type NoteResponse struct {
	Note
	Path    string `json:"Path"`
	Content string `json:"Content"`
}

type NotePost struct {
	Content string    `json:"Content"`
	Ctime   time.Time `json:"Ctime"`
}

type NotePatch struct {
	Content   string    `json:"Content"`
	LastMtime time.Time `json:"LastMtime"`
}

type NoteDelete struct {
	LastMtime time.Time `json:"LastMtime"`
}

type ErrorResponse struct {
	Error string `json:"Error"`
	Code  int    `json:"Code"`
}

func respondWithError(w http.ResponseWriter, errMsg string, statusCode int) {
	errorResponse := ErrorResponse{Error: errMsg, Code: statusCode}
	errorJSON, _ := json.Marshal(errorResponse)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write(errorJSON)
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

func apiNote(dir string, w http.ResponseWriter, r *http.Request, readOnly bool) {
	pathSegments := strings.Split(r.URL.Path, "/")

	var filename string
	if len(pathSegments) >= 4 {
		filename = pathSegments[3]
	}

	switch r.Method {
	case "GET":
		if filename == "" {
			respondWithError(w, "Filename not specified", http.StatusBadRequest)
			return
		}

	case "POST":
		if readOnly {
			respondWithError(w, "NOTESIUM_DIR is set to read-only mode", http.StatusForbidden)
			return
		}

		if filename != "" {
			respondWithError(w, "Filename should not be specified", http.StatusBadRequest)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			respondWithError(w, err.Error(), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		var notePost NotePost
		if err := json.Unmarshal(body, &notePost); err != nil {
			respondWithError(w, err.Error(), http.StatusBadRequest)
			return
		}

		if notePost.Ctime.IsZero() {
			respondWithError(w, "Ctime field is required", http.StatusBadRequest)
			return
		}

		epochInt := notePost.Ctime.Unix()
		epochHex := fmt.Sprintf("%x", epochInt)
		filename = fmt.Sprintf("%s.md", epochHex)

		path := filepath.Join(dir, filename)
		if _, err := os.Stat(path); err == nil {
			respondWithError(w, "File already exists", http.StatusConflict)
			return
		}

		if err := os.WriteFile(path, []byte(notePost.Content), 0644); err != nil {
			respondWithError(w, "Error writing file: "+err.Error(), http.StatusInternalServerError)
			return
		}

		noteCache = nil
		populateCache(dir)

	case "PATCH":
		if readOnly {
			respondWithError(w, "NOTESIUM_DIR is set to read-only mode", http.StatusForbidden)
			return
		}

		if filename == "" {
			respondWithError(w, "Filename not specified", http.StatusBadRequest)
			return
		}

		if _, ok := noteCache[filename]; !ok {
			respondWithError(w, "Note not found", http.StatusNotFound)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			respondWithError(w, err.Error(), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		var notePatch NotePatch
		if err := json.Unmarshal(body, &notePatch); err != nil {
			respondWithError(w, err.Error(), http.StatusBadRequest)
			return
		}

		if notePatch.Content == "" {
			respondWithError(w, "Content field is required", http.StatusBadRequest)
			return
		}
		if notePatch.LastMtime.IsZero() {
			respondWithError(w, "LastMtime field is required", http.StatusBadRequest)
			return
		}

		path := filepath.Join(dir, filename)
		info, err := os.Stat(path)
		if err != nil {
			if os.IsNotExist(err) {
				respondWithError(w, "File does not exist: "+err.Error(), http.StatusNotFound)
			} else {
				respondWithError(w, "Error accessing file: "+err.Error(), http.StatusInternalServerError)
			}
			return
		}

		if !info.ModTime().UTC().Equal(notePatch.LastMtime.UTC()) {
			respondWithError(w, "Refusing to overwrite. File changed on disk.", http.StatusConflict)
			return
		}

		if err := os.WriteFile(path, []byte(notePatch.Content), 0644); err != nil {
			respondWithError(w, "Error writing file: "+err.Error(), http.StatusInternalServerError)
			return
		}

		noteCache = nil
		populateCache(dir)

	case "DELETE":
		if readOnly {
			respondWithError(w, "NOTESIUM_DIR is set to read-only mode", http.StatusForbidden)
			return
		}

		if filename == "" {
			respondWithError(w, "Filename not specified", http.StatusBadRequest)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			respondWithError(w, err.Error(), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		var noteDelete NoteDelete
		if err := json.Unmarshal(body, &noteDelete); err != nil {
			respondWithError(w, err.Error(), http.StatusBadRequest)
			return
		}

		if noteDelete.LastMtime.IsZero() {
			respondWithError(w, "LastMtime field is required", http.StatusBadRequest)
			return
		}

		note, ok := noteCache[filename]
		if !ok {
			respondWithError(w, "Note not found", http.StatusNotFound)
			return
		}

		path := filepath.Join(dir, filename)
		info, err := os.Stat(path)
		if err != nil {
			if os.IsNotExist(err) {
				respondWithError(w, "File does not exist: "+err.Error(), http.StatusNotFound)
			} else {
				respondWithError(w, "Error accessing file: "+err.Error(), http.StatusInternalServerError)
			}
			return
		}

		if !info.ModTime().UTC().Equal(noteDelete.LastMtime.UTC()) {
			respondWithError(w, "Refusing to delete. File changed on disk.", http.StatusConflict)
			return
		}

		if len(note.IncomingLinks) > 0 {
			respondWithError(w, "Refusing to delete. Note has IncomingLinks.", http.StatusConflict)
			return
		}

		err = os.Remove(path)
		if err != nil {
			respondWithError(w, "Error deleting file: "+err.Error(), http.StatusInternalServerError)
			return
		}

		noteCache = nil
		populateCache(dir)

		response := map[string]interface{}{
			"Filename": filename,
			"Deleted":  true,
		}
		jsonResponse, _ := json.Marshal(response)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(jsonResponse)
		return

	default:
		respondWithError(w, "Method not supported", http.StatusMethodNotAllowed)
	}

	note, ok := noteCache[filename]
	if !ok {
		respondWithError(w, "Note not found", http.StatusNotFound)
		return
	}

	path := filepath.Join(dir, filename)
	content, err := os.ReadFile(path)
	if err != nil {
		respondWithError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	noteResponse := NoteResponse{
		Note:    *note,
		Path:    path,
		Content: string(content),
	}

	jsonResponse, err := json.Marshal(noteResponse)
	if err != nil {
		respondWithError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonResponse)
}

//////////////////////////////// experimental ////////////////////////////////

type bufferedResponseWriter struct {
	buf bytes.Buffer
	w   http.ResponseWriter
}

func (rw *bufferedResponseWriter) Write(p []byte) (n int, err error) {
	return rw.buf.Write(p)
}

func (rw *bufferedResponseWriter) Flush() {
	rw.w.Write(rw.buf.Bytes())
	if f, ok := rw.w.(http.Flusher); ok {
		f.Flush()
	}
}

func apiRaw(dir string, w http.ResponseWriter, r *http.Request) {
	pathSegments := strings.Split(r.URL.Path, "/")
	if len(pathSegments) < 4 || pathSegments[3] == "" {
		http.Error(w, "no command specified", http.StatusNotFound)
		return
	}
	command := pathSegments[3]

	args := []string{command}
	queryParameters := r.URL.Query()
	for key, values := range queryParameters {
		for _, value := range values {
			if value == "true" {
				arg := fmt.Sprintf("--%s", key)
				args = append(args, arg)
			} else if value != "" && value != "false" {
				arg := fmt.Sprintf("--%s=%s", key, value)
				args = append(args, arg)
			}
		}
	}

	cmd, err := parseOptions(args)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	writer := &bufferedResponseWriter{w: w}
	defer writer.Flush()

	switch cmd.Name {
	case "new":
		notesiumNew(dir, cmd.Options.(newOptions), writer)
	case "list":
		notesiumList(dir, cmd.Options.(listOptions), writer)
	case "links":
		notesiumLinks(dir, cmd.Options.(linksOptions), writer)
	case "lines":
		notesiumLines(dir, cmd.Options.(linesOptions), writer)
	default:
		http.Error(w, fmt.Sprintf("unrecognized command: %s", command), http.StatusBadRequest)
		return
	}
}
