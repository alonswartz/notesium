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

func updateHeartbeat() {
	mu.Lock()
	lastHeartbeat = time.Now()
	mu.Unlock()
}

func heartbeatH(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		updateHeartbeat()
		next.ServeHTTP(w, r)
	})
}

func heartbeatF(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		updateHeartbeat()
		next(w, r)
	}
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
