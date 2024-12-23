package main

import (
	"strings"
)

func evaluateFilterQuery(query string, input string) (bool, error) {
	input = strings.ToLower(input)
	tokens := strings.Fields(strings.ToLower(query))
	matches := true

	for _, token := range tokens {
		if strings.Contains(token, "|") {
			// OR logic
			terms := strings.Split(token, "|")
			orMatch := false
			for _, term := range terms {
				if strings.Contains(input, term) {
					orMatch = true
					break
				}
			}
			matches = matches && orMatch
		} else if strings.HasPrefix(token, "!") {
			// NOT logic
			term := strings.TrimPrefix(token, "!")
			if strings.Contains(input, term) {
				matches = false
				break
			}
		} else {
			// AND logic (implicit)
			if !strings.Contains(input, token) {
				matches = false
				break
			}
		}
	}

	return matches, nil
}
