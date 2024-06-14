package main

import (
	"fmt"
	"runtime"
)

type WebInfo struct {
	Webroot      string `json:"webroot"`
	Writable     bool   `json:"writable"`
	StopOnIdle   bool   `json:"stop-on-idle"`
	VersionCheck bool   `json:"daily-version-check"`
}

type BuildInfo struct {
	GitVersion       string `json:"gitversion"`
	Buildtime        string `json:"buildtime"`
	GoVersion        string `json:"goversion"`
	LatestReleaseUrl string `json:"latest-release-url"`
}

type MemoryInfo struct {
	MemoryAlloc      string `json:"alloc"`
	MemoryTotalAlloc string `json:"total-alloc"`
	MemorySys        string `json:"sys"`
	MemoryLookups    uint64 `json:"lookups"`
	MemoryMallocs    uint64 `json:"mallocs"`
	MemoryFrees      uint64 `json:"frees"`
}

type RuntimeResponse struct {
	Home     string     `json:"home"`
	Version  string     `json:"version"`
	Platform string     `json:"platform"`
	Web      WebInfo    `json:"web"`
	Build    BuildInfo  `json:"build"`
	Memory   MemoryInfo `json:"memory"`
}

func GetRuntimeInfo(dir string, webOpts webOptions) RuntimeResponse {
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	return RuntimeResponse{
		Home:     dir,
		Version:  getVersion(gitversion),
		Platform: fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH),
		Web: WebInfo{
			Webroot:      webOpts.webroot,
			Writable:     !webOpts.readOnly,
			StopOnIdle:   webOpts.heartbeat,
			VersionCheck: webOpts.check,
		},
		Build: BuildInfo{
			GitVersion:       gitversion,
			Buildtime:        buildtime,
			GoVersion:        runtime.Version(),
			LatestReleaseUrl: latestReleaseUrl,
		},
		Memory: MemoryInfo{
			MemoryAlloc:      bytesToHumanReadable(memStats.Alloc),
			MemoryTotalAlloc: bytesToHumanReadable(memStats.TotalAlloc),
			MemorySys:        bytesToHumanReadable(memStats.Sys),
			MemoryLookups:    memStats.Lookups,
			MemoryMallocs:    memStats.Mallocs,
			MemoryFrees:      memStats.Frees,
		},
	}
}

func bytesToHumanReadable(bytes uint64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}
