package git

import (
	"errors"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
)

// CommitInfo represents basic information about a git commit
type CommitInfo struct {
	Hash        string    `json:"hash"`
	ShortHash   string    `json:"short_hash"`
	Message     string    `json:"message"`
	AuthorName  string    `json:"author_name"`
	AuthorEmail string    `json:"author_email"`
	Timestamp   time.Time `json:"timestamp"`
	DateStr     string    `json:"date_str"`
}

// FileStatus represents the status of a file in the working tree
type FileStatus struct {
	Path     string `json:"path"`
	Status   string `json:"status"` // "modified", "untracked", "added", "deleted"
	Staged   bool   `json:"staged"`
}

// InitRepo initializes a new Git repository at target path
func InitRepo(path string) (*git.Repository, error) {
	repo, err := git.PlainInit(path, false)
	if err != nil {
		if errors.Is(err, git.ErrRepositoryAlreadyExists) {
			return git.PlainOpen(path)
		}
		return nil, fmt.Errorf("failed to init repository at %s: %w", path, err)
	}
	return repo, nil
}

// OpenRepo opens an existing Git repository at target path
func OpenRepo(path string) (*git.Repository, error) {
	repo, err := git.PlainOpen(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open repository at %s: %w", path, err)
	}
	return repo, nil
}

// CommitFiles adds specified relative paths to the staging area and creates a commit.
// If relativePaths is empty, it adds all tracked/untracked changes.
func CommitFiles(repoPath string, relativePaths []string, message string, authorName, authorEmail string) (string, error) {
	repo, err := OpenRepo(repoPath)
	if err != nil {
		return "", err
	}

	wt, err := repo.Worktree()
	if err != nil {
		return "", fmt.Errorf("failed to get worktree: %w", err)
	}

	if len(relativePaths) == 0 {
		// Stage all changes
		err = wt.AddWithOptions(&git.AddOptions{All: true})
		if err != nil {
			return "", fmt.Errorf("failed to add all files: %w", err)
		}
	} else {
		for _, relPath := range relativePaths {
			// Normalize to forward slashes for git
			cleanPath := filepath.ToSlash(filepath.Clean(relPath))
			cleanPath = strings.TrimPrefix(cleanPath, "/")
			if cleanPath == "" || cleanPath == "." {
				err = wt.AddWithOptions(&git.AddOptions{All: true})
				if err != nil {
					return "", fmt.Errorf("failed to add all: %w", err)
				}
				break
			}
			_, addErr := wt.Add(cleanPath)
			if addErr != nil {
				// If adding specific path fails (e.g. directory deleted), stage all changes
				_ = wt.AddWithOptions(&git.AddOptions{All: true})
			}
		}
	}

	// Check if there are staged changes
	status, err := wt.Status()
	if err != nil {
		return "", fmt.Errorf("failed to check status: %w", err)
	}

	if status.IsClean() {
		// No changes to commit
		head, err := repo.Head()
		if err == nil {
			return head.Hash().String(), nil
		}
		return "", nil
	}

	if authorName == "" {
		authorName = "Antigravity Writer"
	}
	if authorEmail == "" {
		authorEmail = "writer@antigravity.local"
	}

	commitHash, err := wt.Commit(message, &git.CommitOptions{
		Author: &object.Signature{
			Name:  authorName,
			Email: authorEmail,
			When:  time.Now(),
		},
	})
	if err != nil {
		return "", fmt.Errorf("failed to commit: %w", err)
	}

	return commitHash.String(), nil
}

// GetFileHistory returns the commit history that modified a given file (or all commits if relativePath is empty).
func GetFileHistory(repoPath string, relativePath string, limit int) ([]CommitInfo, error) {
	repo, err := OpenRepo(repoPath)
	if err != nil {
		return nil, err
	}

	head, err := repo.Head()
	if err != nil {
		return []CommitInfo{}, nil // Empty repo or unborn branch
	}

	cleanRelPath := filepath.ToSlash(filepath.Clean(relativePath))
	cleanRelPath = strings.TrimPrefix(cleanRelPath, "/")

	cIter, err := repo.Log(&git.LogOptions{
		From:  head.Hash(),
		Order: git.LogOrderDFS,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get commit log: %w", err)
	}
	defer cIter.Close()

	var commits []CommitInfo
	count := 0

	err = cIter.ForEach(func(c *object.Commit) error {
		if limit > 0 && count >= limit {
			return io.EOF
		}

		include := false
		if cleanRelPath == "" || cleanRelPath == "." {
			include = true
		} else {
			// Check if this commit modified the specific file
			stats, err := c.Stats()
			if err == nil {
				for _, s := range stats {
					if s.Name == cleanRelPath {
						include = true
						break
					}
				}
			} else {
				// Fallback: check if the file exists in tree
				_, fileErr := c.File(cleanRelPath)
				if fileErr == nil {
					include = true
				}
			}
		}

		if include {
			hashStr := c.Hash.String()
			shortHash := hashStr
			if len(shortHash) > 7 {
				shortHash = shortHash[:7]
			}

			commits = append(commits, CommitInfo{
				Hash:        hashStr,
				ShortHash:   shortHash,
				Message:     strings.TrimSpace(c.Message),
				AuthorName:  c.Author.Name,
				AuthorEmail: c.Author.Email,
				Timestamp:   c.Author.When,
				DateStr:     c.Author.When.Format("2006-01-02 15:04:05"),
			})
			count++
		}

		return nil
	})

	if err != nil && !errors.Is(err, io.EOF) {
		return nil, fmt.Errorf("error iterating commits: %w", err)
	}

	return commits, nil
}

// GetFileContentAtCommit returns the content of a file at a specific commit hash
func GetFileContentAtCommit(repoPath string, commitHash string, relativePath string) (string, error) {
	repo, err := OpenRepo(repoPath)
	if err != nil {
		return "", err
	}

	hash := plumbing.NewHash(commitHash)
	commit, err := repo.CommitObject(hash)
	if err != nil {
		return "", fmt.Errorf("failed to find commit %s: %w", commitHash, err)
	}

	cleanRelPath := filepath.ToSlash(filepath.Clean(relativePath))
	cleanRelPath = strings.TrimPrefix(cleanRelPath, "/")

	file, err := commit.File(cleanRelPath)
	if err != nil {
		return "", fmt.Errorf("file %s not found in commit %s: %w", cleanRelPath, commitHash, err)
	}

	content, err := file.Contents()
	if err != nil {
		return "", fmt.Errorf("failed to read file content: %w", err)
	}

	return content, nil
}

// GetStatus returns the current working tree status
func GetStatus(repoPath string) ([]FileStatus, error) {
	repo, err := OpenRepo(repoPath)
	if err != nil {
		return nil, err
	}

	wt, err := repo.Worktree()
	if err != nil {
		return nil, err
	}

	status, err := wt.Status()
	if err != nil {
		return nil, err
	}

	var results []FileStatus
	for path, fileStatus := range status {
		st := "unmodified"
		if fileStatus.Staging == git.Added || fileStatus.Worktree == git.Untracked {
			st = "added/untracked"
		} else if fileStatus.Staging == git.Modified || fileStatus.Worktree == git.Modified {
			st = "modified"
		} else if fileStatus.Staging == git.Deleted || fileStatus.Worktree == git.Deleted {
			st = "deleted"
		}

		results = append(results, FileStatus{
			Path:   path,
			Status: st,
			Staged: fileStatus.Staging != git.Unmodified && fileStatus.Staging != git.Untracked,
		})
	}

	return results, nil
}
