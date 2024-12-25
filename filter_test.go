package main

import (
	"reflect"
	"testing"
)

func TestTokenizeFilterQuery(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{
			name:     "No quotes, single tokens only",
			input:    "book physics !math",
			expected: []string{"book", "physics", "!math"},
		},
		{
			name:     "Double-quoted phrase",
			input:    `"earth science" physics`,
			expected: []string{"earth science", "physics"},
		},
		{
			name:     "Single-quoted phrase",
			input:    `book 'social science' biology`,
			expected: []string{"book", "social science", "biology"},
		},
		{
			name:     "Mixed single and double quotes",
			input:    `"environmental science" 'earth science' math`,
			expected: []string{"environmental science", "earth science", "math"},
		},
		{
			name:  "Unclosed quote (double)",
			input: `"science math`,
			// The entire remainder after the first quote goes into the same token
			// This behavior depends on your parser design; you might decide to handle or error out.
			expected: []string{"science math"},
		},
		{
			name:     "Unclosed quote (single)",
			input:    `'science math`,
			expected: []string{"science math"},
		},
		{
			name:  "Multiple separate phrases with OR inside",
			input: `"earth science"|chemistry !biology`,
			// This gets tokenized into 3 tokens:
			//  1. earth science|chemistry
			//  2. !biology
			//
			// Because there's no space between "earth science"|chemistry,
			// they remain in one token (the user might intend that).
			expected: []string{"earth science|chemistry", "!biology"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tokenizeFilterQuery(tt.input)
			if !reflect.DeepEqual(got, tt.expected) {
				t.Errorf("got %v, want %v", got, tt.expected)
			}
		})
	}
}

func TestEvaluateFilterQuery(t *testing.T) {
	tests := []struct {
		name          string
		query         string
		input         string
		expectedMatch bool
	}{
		// ----------------------------------
		// Basic AND (space)
		{
			name:          "Simple AND matches",
			query:         "book chemistry",
			input:         "I found a physics book today",
			expectedMatch: false,
		},
		{
			name:          "Simple AND true",
			query:         "book physics",
			input:         "I found a physics book today",
			expectedMatch: true,
		},

		// ----------------------------------
		// OR logic (|)
		{
			name:          "OR logic - one term found",
			query:         "science|math",
			input:         "I enjoy reading about science topics",
			expectedMatch: true,
		},
		{
			name:          "OR logic - no term found",
			query:         "apple|banana",
			input:         "I love oranges",
			expectedMatch: false,
		},

		// ----------------------------------
		// NOT logic (!)
		{
			name:          "NOT logic - excluded term present => false",
			query:         "book !math",
			input:         "I have a math book",
			expectedMatch: false,
		},
		{
			name:          "NOT logic - excluded term absent => true",
			query:         "book !math",
			input:         "I have a science book",
			expectedMatch: true,
		},

		// ----------------------------------
		// Phrase testing (quotes)
		{
			name:          "Double-quoted phrase present",
			query:         `"earth science"`,
			input:         "My earth science teacher is great",
			expectedMatch: true,
		},
		{
			name:          "Double-quoted phrase absent",
			query:         `"earth science"`,
			input:         "I love rocket science",
			expectedMatch: false,
		},
		{
			name:  "Single-quoted phrase present",
			query: `book 'social science'`,
			input: "I have a social science book for class",
			// We want both "book" AND "social science" => expect true
			expectedMatch: true,
		},
		{
			name:  "Single-quoted phrase absent",
			query: `book 'social science'`,
			input: "I have a math book",
			// Missing "social science"
			expectedMatch: false,
		},

		// ----------------------------------
		// Combined logic with OR + phrase
		{
			name:  "Phrase + OR logic pass",
			query: `"earth science"|biology`,
			input: "I am studying biology this semester",
			// OR logic => "earth science" or "biology"
			expectedMatch: true,
		},
		{
			name:          "Phrase + OR logic fail",
			query:         `"earth science"|biology`,
			input:         "I am studying math and physics",
			expectedMatch: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := evaluateFilterQuery(tt.query, tt.input)
			if err != nil {
				t.Errorf("evaluateFilterQuery returned error: %v", err)
			}

			if got != tt.expectedMatch {
				t.Errorf("query=%q input=%q => got %v, want %v",
					tt.query, tt.input, got, tt.expectedMatch)
			}
		})
	}
}
