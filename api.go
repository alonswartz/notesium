package main

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type NoteResponse struct {
	Note
	Content string `json:"Content"`
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

	content, err := os.ReadFile(filepath.Join(dir, filename))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	noteResponse := NoteResponse{
		Note:    *note,
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
