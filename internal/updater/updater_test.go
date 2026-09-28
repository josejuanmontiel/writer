package updater

import (
	"os"
	"path/filepath"
	"testing"
)

func TestIsNewerVersion(t *testing.T) {
	tests := []struct {
		latest   string
		current  string
		expected bool
	}{
		{"v1.1.19", "v1.1.18", true},
		{"1.1.19", "1.1.18", true},
		{"v1.2.0", "v1.1.18", true},
		{"v2.0.0", "v1.9.9", true},
		{"v1.1.18", "v1.1.18", false},
		{"v1.1.17", "v1.1.18", false},
		{"v1.0.99", "v1.1.0", false},
		{"", "v1.1.18", false},
		{"v1.1.18", "", true},
	}

	for _, tt := range tests {
		got := isNewerVersion(tt.latest, tt.current)
		if got != tt.expected {
			t.Errorf("isNewerVersion(%q, %q) = %v; want %v", tt.latest, tt.current, got, tt.expected)
		}
	}
}

func TestSelectAssetForPlatform(t *testing.T) {
	assets := []ReleaseAsset{
		{Name: "antigravity-writer-windows-offline.zip", BrowserDownloadURL: "http://win-full", Size: 800000000},
		{Name: "antigravity-writer-windows-slim.zip", BrowserDownloadURL: "http://win-slim", Size: 20000000},
		{Name: "antigravity-writer-macos-offline.zip", BrowserDownloadURL: "http://mac-full", Size: 800000000},
		{Name: "antigravity-writer-macos-slim.zip", BrowserDownloadURL: "http://mac-slim", Size: 20000000},
		{Name: "AntigravityWriter-x86_64.AppImage", BrowserDownloadURL: "http://linux-appimage", Size: 800000000},
		{Name: "antigravity-writer-linux-slim.tar.gz", BrowserDownloadURL: "http://linux-slim", Size: 20000000},
	}

	winAsset := selectAssetForPlatform(assets, "windows", "amd64")
	if winAsset == nil || winAsset.Name != "antigravity-writer-windows-slim.zip" {
		t.Errorf("Expected windows slim asset, got: %+v", winAsset)
	}

	macAsset := selectAssetForPlatform(assets, "darwin", "arm64")
	if macAsset == nil || macAsset.Name != "antigravity-writer-macos-slim.zip" {
		t.Errorf("Expected macos slim asset, got: %+v", macAsset)
	}

	linuxAsset := selectAssetForPlatform(assets, "linux", "amd64", false)
	if linuxAsset == nil || linuxAsset.Name != "antigravity-writer-linux-slim.tar.gz" {
		t.Errorf("Expected linux slim asset, got: %+v", linuxAsset)
	}

	linuxAppImageAsset := selectAssetForPlatform(assets, "linux", "amd64", true)
	if linuxAppImageAsset == nil || linuxAppImageAsset.Name != "AntigravityWriter-x86_64.AppImage" {
		t.Errorf("Expected linux AppImage asset, got: %+v", linuxAppImageAsset)
	}
}

func TestGetExecutablePathWithAppImage(t *testing.T) {
	// Crear archivo temporal simulando un AppImage
	tmpFile, err := os.CreateTemp("", "test-appimage-*.AppImage")
	if err != nil {
		t.Fatalf("Error creando archivo temporal: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	tmpFile.Close()

	origAppImage := os.Getenv("APPIMAGE")
	defer os.Setenv("APPIMAGE", origAppImage)

	os.Setenv("APPIMAGE", tmpFile.Name())

	if !IsAppImage() {
		t.Errorf("Expected IsAppImage() to be true when APPIMAGE points to an existing file")
	}

	execPath, err := GetExecutablePath()
	if err != nil {
		t.Fatalf("GetExecutablePath failed: %v", err)
	}

	// Debe coincidir con la ruta del archivo simulado
	evalTmp, _ := filepath.EvalSymlinks(tmpFile.Name())
	if execPath != evalTmp {
		t.Errorf("Expected GetExecutablePath() = %q, got %q", evalTmp, execPath)
	}
}

func TestCheckWritable(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "test-checkwritable-*")
	if err != nil {
		t.Fatalf("Error creando directorio temporal: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	testFilePath := filepath.Join(tmpDir, "testapp.AppImage")
	if err := checkWritable(testFilePath); err != nil {
		t.Errorf("Expected writable directory to pass, got error: %v", err)
	}
}
