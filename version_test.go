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
				t.Errorf("got %s, want %s", result, tt.expected)
			}
		})
	}
}
