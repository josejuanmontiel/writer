package git

import (
	"os"
	"testing"
)

func TestGitRemoteConfig(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "writer_remote_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	_, err = InitRepo(tempDir)
	if err != nil {
		t.Fatalf("Failed to init repo: %v", err)
	}

	testURL := "https://github.com/example/my-compendium.git"
	err = SetRemoteURL(tempDir, "origin", testURL)
	if err != nil {
		t.Fatalf("Failed to set remote URL: %v", err)
	}

	info, err := GetRemoteInfo(tempDir, "origin")
	if err != nil {
		t.Fatalf("Failed to get remote info: %v", err)
	}

	if !info.HasRemote {
		t.Errorf("Expected has_remote to be true")
	}
	if info.URL != testURL {
		t.Errorf("Expected URL %s, got %s", testURL, info.URL)
	}
}
