package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

var (
	mu            sync.Mutex
	lastHeartbeat time.Time
)

func heartbeatHandler(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	lastHeartbeat = time.Now()
	mu.Unlock()
}

func checkHeartbeat(server *http.Server) {
	for {
		time.Sleep(5 * time.Second)
		mu.Lock()
		if time.Since(lastHeartbeat) > 10*time.Second {
			fmt.Println("No active client, stopping server.")
			mu.Unlock()
			if err := server.Shutdown(context.Background()); err != nil {
				log.Fatalf("Server shutdown failed: %+v", err)
			}
			break
		}
		mu.Unlock()
	}
}
