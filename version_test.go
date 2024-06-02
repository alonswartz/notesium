package main

import (
	"testing"
)

func TestGetVersion(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"v0.1.2-0-g1234567", "0.1.2"},
		{"v0.1.2-2-g1234567", "0.1.2+2"},
		{"v0.1.2-0-g1234567-dirty", "0.1.2+0-dirty"},
		{"v0.1.2-2-g1234567-dirty", "0.1.2+2-dirty"},
		{"v0.2.0-beta-0-g1234567", "0.2.0-beta"},
		{"v0.2.0-beta-0-g1234567-dirty", "0.2.0-beta+0-dirty"},
		{"v0.2.0-beta-2-g1234567", "0.2.0-beta+2"},
		{"v0.2.0-rc.2-0-g1234567", "0.2.0-rc.2"},
		{"v0.2.0-rc.2-0-g1234567-dirty", "0.2.0-rc.2+0-dirty"},
		{"v0.2.0-rc.2-2-g1234567", "0.2.0-rc.2+2"},
		{"v0.1.2-0-g1234567-foo", "0.0.0-dev"},
		{"v0.1.2-foo-g1234567", "0.0.0-dev"},
		{"0.1.2-0-g1234567", "0.0.0-dev"},
		{"unset", "0.0.0-dev"},
		{"foo", "0.0.0-dev"},
		{"", "0.0.0-dev"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := getVersion(tt.input)
			if result != tt.expected {
				t.Errorf("getVersion(%s), want %s", result, tt.expected)
			}
		})
	}
}

func TestCompareVersions(t *testing.T) {
	// -1 if v1 < v2, 1 if v1 > v2, and 0 if they are equal.
	tests := []struct {
		v1       string
		v2       string
		expected int
	}{
		{"", "", 0},
		{"1.2.3", "", 1},
		{"0.0.0", "", 0},
		{"0.0.0-dev", "", -1},
		{"0.0.0-dev", "1.2.3", -1},
		{"1.2.3", "1.2.2", 1},
		{"1.2.3", "1.2.3", 0},
		{"1.2.3", "1.2.4", -1},
		{"1.2.3+2", "1.2.2", 1},
		{"1.2.3+2", "1.2.3", 0},
		{"1.2.3+2", "1.2.4", -1},
		{"1.2.3-beta", "1.2.1", 1},
		{"1.2.3-beta", "1.2.2", 0},
		{"1.2.3-beta", "1.2.3", -1},
		{"1.2.3-beta", "1.2.4", -1},
		{"1.2.0-beta", "1.2.0", -1},
		{"1.2.0-beta", "1.2.4-beta", 1},
		{"1.2.1-beta.2", "1.2.1", -1},
	}

	for _, tt := range tests {
		t.Run(tt.v1+"_"+tt.v2, func(t *testing.T) {
			result := compareVersions(tt.v1, tt.v2)
			if result != tt.expected {
				t.Errorf("compareVersions(%s, %s) = %d; want %d", tt.v1, tt.v2, result, tt.expected)
			}
		})
	}
}
