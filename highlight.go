package main

import (
	"bufio"
	"fmt"
	"io"
	"regexp"
	"strings"
)

const (
	ansiHeading    = "\033[1m"
	ansiBold       = "\033[1m"
	ansiItalic     = "\033[3m"
	ansiLink       = "\033[34m"
	ansiCodeBlock  = "\033[33m"
	ansiBlockQuote = "\033[36m"
	ansiListMarker = "\033[36m"
	ansiReset      = "\033[0m"
)
var (
	reBold           = regexp.MustCompile(`\*\*(.*?)\*\*`)
	reBoldAlt        = regexp.MustCompile(`__(.*?)__`)
	reItalic         = regexp.MustCompile(`\*(.*?)\*`)
	reItalicAlt      = regexp.MustCompile(`_(.*?)_`)
	reUnorderedList  = regexp.MustCompile(`^(\s*[-+*]) `)
	reOrderedList    = regexp.MustCompile(`^(\s*\d+\.) `)
	reLinkPlain      = regexp.MustCompile(`(?:https?://|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/[^\s]*)?`)
	reLinkMarkdown   = regexp.MustCompile(`\[(.[^]]*?)\]\((.[^)]*?)\)`)
)

func renderMarkdown(reader io.Reader, writer io.Writer) {
	inCodeBlock := false
	scanner := bufio.NewScanner(reader)

	for scanner.Scan() {
		line := scanner.Text()
		highlightedLine := highlightLine(line, &inCodeBlock)
		fmt.Fprintln(writer, highlightedLine)
	}

	if err := scanner.Err(); err != nil {
		fmt.Fprintf(writer, "Error reading content: %v\n", err)
	}
}

func highlightLine(line string, inCodeBlock *bool) string {
	// Code blocks
	if strings.HasPrefix(line, "```") {
		*inCodeBlock = !*inCodeBlock
		return ansiCodeBlock + line + ansiReset
	}
	if *inCodeBlock {
		return ansiCodeBlock + line + ansiReset
	}

	// Headers
	if strings.HasPrefix(line, "#") {
		return ansiHeading + line + ansiReset
	}

	// Blockquotes
	if strings.HasPrefix(line, "> ") {
		return ansiBlockQuote + line + ansiReset
	}

	// Links
	line = highlightLink(line, reLinkMarkdown, ansiLink)
	line = highlightRegex(line, reLinkPlain, ansiLink, 0)

	// Bold (**text** or __text__)
	line = highlightRegex(line, reBold, ansiBold, 2)
	line = highlightRegex(line, reBoldAlt, ansiBold, 2)

	// Italic (*text* or _text_)
	line = highlightRegex(line, reItalic, ansiItalic, 1)
	line = highlightRegex(line, reItalicAlt, ansiItalic, 1)

	// List markers
	line = highlightRegex(line, reUnorderedList, ansiListMarker, 0)
	line = highlightRegex(line, reOrderedList, ansiListMarker, 0)

	return line
}

func highlightRegex(line string, re *regexp.Regexp, ansiCode string, markerLength int) string {
	return re.ReplaceAllStringFunc(line, func(match string) string {
		inner := match[markerLength : len(match)-markerLength]
		return ansiCode + inner + ansiReset
	})
}

func highlightLink(line string, re *regexp.Regexp, ansiCode string) string {
	return re.ReplaceAllStringFunc(line, func(match string) string {
		matches := re.FindStringSubmatch(match)
		if len(matches) >= 2 {
			title := matches[1]
			return ansiCode + title + ansiReset
		}
		return match
	})
}
