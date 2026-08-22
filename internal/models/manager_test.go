package models

import (
	"os"
	"path/filepath"
	"testing"
)

func TestGetCatalogStatus(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "models-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	mgr := NewManager(tempDir)
	catalog := mgr.GetCatalogStatus()

	if len(catalog) == 0 {
		t.Fatal("Expected non-empty catalog")
	}

	// Initially, none should be installed
	for _, item := range catalog {
		if item.IsInstalled {
			t.Errorf("Model %s should not be marked installed in empty dir", item.ID)
		}
	}

	// Create dummy ggml-tiny.bin (> 1KB)
	tinyFile := filepath.Join(tempDir, "ggml-tiny.bin")
	dummyData := make([]byte, 2048)
	if err := os.WriteFile(tinyFile, dummyData, 0644); err != nil {
		t.Fatalf("Failed to write dummy tiny file: %v", err)
	}

	// Recheck
	catalog = mgr.GetCatalogStatus()
	foundTiny := false
	for _, item := range catalog {
		if item.ID == "whisper-tiny" {
			foundTiny = true
			if !item.IsInstalled {
				t.Error("whisper-tiny should now be marked installed")
			}
		}
	}
	if !foundTiny {
		t.Error("whisper-tiny not found in catalog")
	}
}
