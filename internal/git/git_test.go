package git

import (
	"os"
	"path/filepath"
	"testing"
)

func TestGitInitAndCommit(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "writer-git-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// 1. Test InitRepo
	repo, err := InitRepo(tempDir)
	if err != nil {
		t.Fatalf("InitRepo failed: %v", err)
	}
	if repo == nil {
		t.Fatalf("InitRepo returned nil repo")
	}

	// 2. Create a test file
	testFileRel := "content/sesion-01.md"
	testFileAbs := filepath.Join(tempDir, testFileRel)
	if err := os.MkdirAll(filepath.Dir(testFileAbs), 0755); err != nil {
		t.Fatalf("failed to create dir: %v", err)
	}
	initialContent := "# Sesión 1: Introducción"
	if err := os.WriteFile(testFileAbs, []byte(initialContent), 0644); err != nil {
		t.Fatalf("failed to write file: %v", err)
	}

	// 3. Test Commit
	commitHash1, err := CommitFiles(tempDir, []string{testFileRel}, "Crear sesión 1", "Profesor", "profesor@curso.local")
	if err != nil {
		t.Fatalf("CommitFiles failed: %v", err)
	}
	if commitHash1 == "" {
		t.Fatalf("expected valid commit hash, got empty string")
	}

	// 4. Modify file and commit again
	secondContent := "# Sesión 1: Introducción Actualizada\n\nContenido añadido."
	if err := os.WriteFile(testFileAbs, []byte(secondContent), 0644); err != nil {
		t.Fatalf("failed to update file: %v", err)
	}

	commitHash2, err := CommitFiles(tempDir, []string{testFileRel}, "Actualizar sesión 1 con contenido", "Profesor", "profesor@curso.local")
	if err != nil {
		t.Fatalf("second CommitFiles failed: %v", err)
	}

	// 5. Test History
	history, err := GetFileHistory(tempDir, testFileRel, 10)
	if err != nil {
		t.Fatalf("GetFileHistory failed: %v", err)
	}
	if len(history) != 2 {
		t.Fatalf("expected 2 commits in history, got %d", len(history))
	}

	// 6. Test GetFileContentAtCommit (Time-Travel / rollback)
	pastContent, err := GetFileContentAtCommit(tempDir, commitHash1, testFileRel)
	if err != nil {
		t.Fatalf("GetFileContentAtCommit for commit 1 failed: %v", err)
	}
	if pastContent != initialContent {
		t.Fatalf("expected past content %q, got %q", initialContent, pastContent)
	}

	currentContentInGit, err := GetFileContentAtCommit(tempDir, commitHash2, testFileRel)
	if err != nil {
		t.Fatalf("GetFileContentAtCommit for commit 2 failed: %v", err)
	}
	if currentContentInGit != secondContent {
		t.Fatalf("expected current content in git %q, got %q", secondContent, currentContentInGit)
	}
}
