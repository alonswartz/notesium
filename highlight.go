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
	ansiInlineCode = "\033[33m"
	ansiBlockQuote = "\033[36m"
	ansiListMarker = "\033[36m"
	ansiLineBg     = "\033[40m"
	ansiReset      = "\033[0m"
)
var (
	reBold           = regexp.MustCompile(`\*\*(.*?)\*\*`)
	reBoldAlt        = regexp.MustCompile(`__(.*?)__`)
	reItalic         = regexp.MustCompile(`\*(.*?)\*`)
	reItalicAlt      = regexp.MustCompile(`_(.*?)_`)
	reUnorderedList  = regexp.MustCompile(`^(\s*[-+*]) `)
	reOrderedList    = regexp.MustCompile(`^(\s*\d+\.) `)
	reInlineCode     = regexp.MustCompile("`(.*?)`")
	reLinkPlain      = regexp.MustCompile(`(?:https?://|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/[^\s]*)?`)
	reLinkMarkdown   = regexp.MustCompile(`\[(.[^]]*?)\]\((.[^)]*?)\)`)
	reAnsi           = regexp.MustCompile(`\x1b\[[0-9;]*m`)
	reReset          = regexp.MustCompile(`\x1b\[0m`)
)

func renderMarkdown(reader io.Reader, writer io.Writer, lineNumber int) {
	inCodeBlock := false
	scanner := bufio.NewScanner(reader)

	for lineIndex := 1; scanner.Scan(); lineIndex++ {
		line := scanner.Text()
		highlightedLine := highlightLine(line, &inCodeBlock)
		if lineNumber > 0 && lineNumber == lineIndex {
			highlightedLine = highlightLineWithBackground(highlightedLine)
		}
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

	// Inline code
	matches := reInlineCode.FindAllStringSubmatchIndex(line, -1)
	if len(matches) > 0 {
		return highlightLineWithInlineCode(line, matches)
	}

	return highlightString(line)
}

func highlightString(line string) string {
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

func highlightLineWithInlineCode(line string, matches [][]int) string {
	var builder strings.Builder
	prevIndex := 0

	for _, match := range matches {
		start, end := match[0], match[1]
		groupStart, groupEnd := match[2], match[3]

		// Handle text before inline code
		if start > prevIndex {
			builder.WriteString(highlightString(line[prevIndex:start]))
		}

		builder.WriteString(ansiInlineCode)
		builder.WriteString(line[groupStart:groupEnd])
		builder.WriteString(ansiReset)

		prevIndex = end
	}

	// Handle text after inline code
	if prevIndex < len(line) {
		builder.WriteString(highlightString(line[prevIndex:]))
	}

	return builder.String()
}


func highlightLineWithBackground(highlightedLine string) string {
	// apply bg after resets to handle segments
	highlightedLine = reReset.ReplaceAllStringFunc(highlightedLine, func(reset string) string {
		return reset + ansiLineBg
	})

	// apply padding
	termWidth := 79
	visibleChars := len(reAnsi.ReplaceAllString(highlightedLine, ""))
	requiredPadding := termWidth - visibleChars
	if requiredPadding > 0 {
		padding := strings.Repeat(" ", requiredPadding)
		highlightedLine += ansiLineBg + padding
	}

	return ansiLineBg + highlightedLine + ansiReset
}
