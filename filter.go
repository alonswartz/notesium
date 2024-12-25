package main

import (
	"strings"
)

func tokenizeFilterQuery(query string) []string {
	tokens := []string{}
	var currentToken string
	var inQuotes bool
	var quoteChar rune

	for i := 0; i < len(query); i++ {
		c := rune(query[i])

		// If we're not in quotes and encounter a quote, we enter 'quote mode'
		if !inQuotes && (c == '"' || c == '\'') {
			inQuotes = true
			quoteChar = c
			continue
		}

		// If we are in quotes and encounter the same quoteChar, we exit 'quote mode'
		if inQuotes && c == quoteChar {
			inQuotes = false
			continue
		}

		// If we're not in quotes and see a space, that's a token boundary
		if !inQuotes && c == ' ' {
			if currentToken != "" {
				tokens = append(tokens, currentToken)
				currentToken = ""
			}
			continue
		}

		// Otherwise, accumulate the character
		currentToken += string(c)
	}

	// Append the last token if non-empty
	if currentToken != "" {
		tokens = append(tokens, currentToken)
	}

	return tokens
}

func evaluateFilterQuery(query string, input string) (bool, error) {
	input = strings.ToLower(input)
	tokens := tokenizeFilterQuery(strings.ToLower(query))
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
