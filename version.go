package main

import (
	"fmt"
	"regexp"
)

// 1:semver (2:major 3:minor 4:patch 5:prerelease 6:prereleaseV) 7:commits 8:hash 9:dirty
var gitVersionRegex = regexp.MustCompile(`^v((0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(alpha|beta|rc)(?:\.(0|[1-9]\d*))?)?)-(0|[1-9]\d*)-g([0-9a-fA-F]+)(-dirty)?$`)

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
