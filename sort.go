package main

import (
	"sort"
	"strings"
)

type SortByCtime []*Note
type SortByMtime []*Note
type SortByTitle []*Note

func (n SortByCtime) Len() int           { return len(n) }
func (n SortByCtime) Less(i, j int) bool { return n[i].Ctime.After(n[j].Ctime) }
func (n SortByCtime) Swap(i, j int)      { n[i], n[j] = n[j], n[i] }

func (n SortByMtime) Len() int           { return len(n) }
func (n SortByMtime) Less(i, j int) bool { return n[i].Mtime.After(n[j].Mtime) }
func (n SortByMtime) Swap(i, j int)      { n[i], n[j] = n[j], n[i] }

func (n SortByTitle) Len() int           { return len(n) }
func (n SortByTitle) Less(i, j int) bool { return n[i].Title < n[j].Title }
func (n SortByTitle) Swap(i, j int)      { n[i], n[j] = n[j], n[i] }

func getSortedNotes(sortBy string) []*Note {
	notes := make([]*Note, 0, len(noteCache))

	for _, note := range noteCache {
		notes = append(notes, note)
	}

	switch sortBy {
	case "ctime":
		sort.Sort(SortByCtime(notes))
	case "mtime":
		sort.Sort(SortByMtime(notes))
	case "alpha":
		sort.Sort(SortByTitle(notes))
	}

	return notes
}

func sortLinesByField(lines []string, separator string, fieldIndex int) {
	sort.Slice(lines, func(i, j int) bool {
		sub_i := strings.SplitN(lines[i], separator, fieldIndex+1)[fieldIndex]
		sub_j := strings.SplitN(lines[j], separator, fieldIndex+1)[fieldIndex]
		return sub_i < sub_j
	})
}
