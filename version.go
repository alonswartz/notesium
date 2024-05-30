package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
)

// 1:semver (2:major 3:minor 4:patch 5:prerelease 6:prereleaseV) 7:commits 8:hash 9:dirty
var gitVersionRegex = regexp.MustCompile(`^v((0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(alpha|beta|rc)(?:\.(0|[1-9]\d*))?)?)-(0|[1-9]\d*)-g([0-9a-fA-F]+)(-dirty)?$`)

var latestReleaseUrl = "https://api.github.com/repos/alonswartz/notesium/releases/latest"

type releaseInfo struct {
	Version     string `json:"-"`
	TagName     string `json:"tag_name"`
	HtmlUrl     string `json:"html_url"`
	PublishedAt string `json:"published_at"`
}

func getVersion(gitVersion string) string {
	if matches := gitVersionRegex.FindStringSubmatch(gitVersion); matches != nil {
		semver := matches[1]
		commits := matches[7]
		isDirty := matches[9] == "-dirty"

		if isDirty {
			return fmt.Sprintf("%s+%s-dirty", semver, commits)
		}

		if commits != "0" {
			return fmt.Sprintf("%s+%s", semver, commits)
		}

		return semver
	}
	return "0.0.0-dev"
}

func getLatestReleaseInfo() (releaseInfo, error) {
	var release releaseInfo

	req, err := http.NewRequest("GET", latestReleaseUrl, nil)
	if err != nil {
		return release, fmt.Errorf("error creating request: %s", err)
	}

	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return release, fmt.Errorf("error making request: %s", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return release, fmt.Errorf("error status code: %d", resp.StatusCode)
	}

	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return release, fmt.Errorf("error decoding response: %s", err)
	}

	if release.TagName == "" || release.HtmlUrl == "" || release.PublishedAt == "" {
		return release, fmt.Errorf("missing required field in response")
	}

	release.Version = strings.TrimPrefix(release.TagName, "v")
	return release, nil
}
