package git

import (
	"errors"
	"fmt"
	"strings"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/transport/http"
)

// RemoteInfo almacena los detalles de configuración del repositorio remoto
type RemoteInfo struct {
	Name          string `json:"name"`
	URL           string `json:"url"`
	CurrentBranch string `json:"current_branch"`
	AheadCount    int    `json:"ahead_count"`
	BehindCount   int    `json:"behind_count"`
	HasRemote     bool   `json:"has_remote"`
}

// SetRemoteURL añade o actualiza la URL del remoto (por defecto 'origin')
func SetRemoteURL(repoPath string, remoteName string, remoteURL string) error {
	repo, err := OpenRepo(repoPath)
	if err != nil {
		return err
	}

	if remoteName == "" {
		remoteName = "origin"
	}
	remoteURL = strings.TrimSpace(remoteURL)

	rem, err := repo.Remote(remoteName)
	if err != nil {
		if errors.Is(err, git.ErrRemoteNotFound) {
			_, err = repo.CreateRemote(&config.RemoteConfig{
				Name: remoteName,
				URLs: []string{remoteURL},
			})
			return err
		}
		return err
	}

	// Si ya existe, actualizamos la URL
	cfg := rem.Config()
	cfg.URLs = []string{remoteURL}
	return repo.DeleteRemote(remoteName)
}

// GetRemoteInfo devuelve el estado del remoto y la rama activa
func GetRemoteInfo(repoPath string, remoteName string) (*RemoteInfo, error) {
	repo, err := OpenRepo(repoPath)
	if err != nil {
		return nil, err
	}

	if remoteName == "" {
		remoteName = "origin"
	}

	info := &RemoteInfo{
		Name:          remoteName,
		CurrentBranch: "main",
		HasRemote:     false,
	}

	head, err := repo.Head()
	if err == nil {
		info.CurrentBranch = head.Name().Short()
	}

	rem, err := repo.Remote(remoteName)
	if err == nil && rem != nil {
		cfg := rem.Config()
		if len(cfg.URLs) > 0 {
			info.URL = cfg.URLs[0]
			info.HasRemote = true
		}
	}

	return info, nil
}

// PushRemote envía los commits locales al repositorio remoto
func PushRemote(repoPath string, remoteName string, branchName string, token string, username string) error {
	repo, err := OpenRepo(repoPath)
	if err != nil {
		return err
	}

	if remoteName == "" {
		remoteName = "origin"
	}
	if branchName == "" {
		branchName = "main"
	}

	pushOpts := &git.PushOptions{
		RemoteName: remoteName,
	}

	if token != "" {
		if username == "" {
			username = "oauth2" // Compatible con GitHub PAT y GitLab
		}
		pushOpts.Auth = &http.BasicAuth{
			Username: username,
			Password: token,
		}
	}

	err = repo.Push(pushOpts)
	if err != nil {
		if errors.Is(err, git.NoErrAlreadyUpToDate) {
			return nil
		}
		return fmt.Errorf("error al hacer push: %w", err)
	}

	return nil
}

// PullRemote descarga y fusiona los cambios desde el repositorio remoto
func PullRemote(repoPath string, remoteName string, branchName string, token string, username string) error {
	repo, err := OpenRepo(repoPath)
	if err != nil {
		return err
	}

	if remoteName == "" {
		remoteName = "origin"
	}
	if branchName == "" {
		branchName = "main"
	}

	wt, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("error obteniendo árbol de trabajo: %w", err)
	}

	pullOpts := &git.PullOptions{
		RemoteName:    remoteName,
		ReferenceName: plumbing.NewBranchReferenceName(branchName),
	}

	if token != "" {
		if username == "" {
			username = "oauth2"
		}
		pullOpts.Auth = &http.BasicAuth{
			Username: username,
			Password: token,
		}
	}

	err = wt.Pull(pullOpts)
	if err != nil {
		if errors.Is(err, git.NoErrAlreadyUpToDate) {
			return nil
		}
		return fmt.Errorf("error al hacer pull: %w", err)
	}

	return nil
}
