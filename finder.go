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

func runFinder(inputChan chan string, opts []string) ([]string, int, error) {
	options, err := fzf.ParseOptions(false, opts)
	if err != nil {
		return nil, 2, fmt.Errorf("fzf error: %w", err)
	}

	outputChan := make(chan string)
	resultChan := make(chan struct {
		code int
		err  error
	}, 1)

	options.Input = inputChan
	options.Output = outputChan

	go func() {
		code, runErr := fzf.Run(options)
		close(outputChan)

		resultChan <- struct {
			code int
			err  error
		}{code, runErr}

		close(resultChan)
	}()

	var lines []string
	for line := range outputChan {
		lines = append(lines, line)
	}

	result := <-resultChan
	return lines, result.code, result.err
}

