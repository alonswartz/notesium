package main

import (
	"fmt"
	"runtime"
)

type WebInfo struct {
	Webroot    string `json:"webroot"`
	Writable   bool   `json:"writable"`
	StopOnIdle bool   `json:"stop-on-idle"`
}

type BuildInfo struct {
	GitVersion       string `json:"gitversion"`
	Buildtime        string `json:"buildtime"`
	GoVersion        string `json:"goversion"`
	LatestReleaseUrl string `json:"latest-release-url"`
}

type RuntimeResponse struct {
	Home     string     `json:"home"`
	Version  string     `json:"version"`
	Platform string     `json:"platform"`
	Web      WebInfo    `json:"web"`
	Build    BuildInfo  `json:"build"`
}

func GetRuntimeInfo(dir string, webOpts webOptions) RuntimeResponse {
	return RuntimeResponse{
		Home:     dir,
		Version:  getVersion(gitversion),
		Platform: fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH),
		Web: WebInfo{
			Webroot:    webOpts.webroot,
			Writable:   !webOpts.readOnly,
			StopOnIdle: webOpts.heartbeat,
		},
		Build: BuildInfo{
			GitVersion:       gitversion,
			Buildtime:        buildtime,
			GoVersion:        runtime.Version(),
			LatestReleaseUrl: latestReleaseUrl,
		},
	}
}
