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

func TestGitBranches(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "writer_branch_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	_, err = InitRepo(tempDir)
	if err != nil {
		t.Fatalf("Failed to init repo: %v", err)
	}

	// Commit inicial para tener HEAD
	err = os.WriteFile(tempDir+"/README.md", []byte("# Compendio"), 0644)
	if err != nil {
		t.Fatalf("Failed to write file: %v", err)
	}
	_, err = CommitFiles(tempDir, []string{"README.md"}, "Initial commit", "Autor Test", "autor@test.com")
	if err != nil {
		t.Fatalf("Failed to commit: %v", err)
	}

	_, initialBranch, err := ListBranches(tempDir)
	if err != nil {
		t.Fatalf("Failed to list initial branches: %v", err)
	}

	// Crear nueva rama
	err = CreateBranch(tempDir, "feature/catequesis-sacramentos", true)
	if err != nil {
		t.Fatalf("Failed to create and checkout branch: %v", err)
	}

	branches, current, err := ListBranches(tempDir)
	if err != nil {
		t.Fatalf("Failed to list branches: %v", err)
	}

	if current != "feature/catequesis-sacramentos" {
		t.Errorf("Expected current branch to be 'feature/catequesis-sacramentos', got '%s'", current)
	}

	if len(branches) < 2 {
		t.Errorf("Expected at least 2 branches, got %d: %v", len(branches), branches)
	}

	// Volver a la rama inicial
	err = CheckoutBranch(tempDir, initialBranch)
	if err != nil {
		t.Fatalf("Failed to checkout %s: %v", initialBranch, err)
	}

	_, currentAfter, _ := ListBranches(tempDir)
	if currentAfter != initialBranch {
		t.Errorf("Expected current branch to be '%s', got '%s'", initialBranch, currentAfter)
	}
}

func TestGetPullRequestURL(t *testing.T) {
	githubURL := "https://github.com/catequesis/compendio-2026.git"
	prURL := GetPullRequestURL(githubURL, "feature/oracion", "main")
	expected := "https://github.com/catequesis/compendio-2026/compare/main...feature/oracion?expand=1"
	if prURL != expected {
		t.Errorf("Expected %s, got %s", expected, prURL)
	}

	sshURL := "git@github.com:catequesis/compendio-2026.git"
	prURL2 := GetPullRequestURL(sshURL, "feature/oracion", "main")
	if prURL2 != expected {
		t.Errorf("Expected %s, got %s", expected, prURL2)
	}

	gitlabURL := "https://gitlab.com/catequesis/compendio-2026.git"
	glPR := GetPullRequestURL(gitlabURL, "feature/oracion", "main")
	expectedGL := "https://gitlab.com/catequesis/compendio-2026/-/merge_requests/new?merge_request[source_branch]=feature/oracion&merge_request[target_branch]=main"
	if glPR != expectedGL {
		t.Errorf("Expected %s, got %s", expectedGL, glPR)
	}
}

