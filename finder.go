package main

import (
	"fmt"

	fzf "github.com/junegunn/fzf/src"
)

type channelWriter struct {
	ch chan string
}

func (cw *channelWriter) Write(p []byte) (n int, err error) {
	str := string(p) // Convert bytes to string
	cw.ch <- str     // Send to channel
	return len(p), nil
}

func runFinder(inputChan chan string, outputChan chan string, opts []string) (int, error) {
	options, err := fzf.ParseOptions(false, opts)
	if err != nil {
		return 2, fmt.Errorf("fzf error: %w", err)
	}

	options.Input = inputChan
	options.Output = outputChan

	code, err := fzf.Run(options)
	if err != nil {
		return code, fmt.Errorf("error running fzf: %w", err)
	}

	return code, nil
}

