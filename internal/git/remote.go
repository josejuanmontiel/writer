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

// ListBranches lista todas las ramas locales y devuelve la rama activa
func ListBranches(repoPath string) ([]string, string, error) {
	repo, err := OpenRepo(repoPath)
	if err != nil {
		return nil, "", err
	}

	currentBranch := "main"
	head, err := repo.Head()
	if err == nil {
		currentBranch = head.Name().Short()
	}

	branchesIter, err := repo.Branches()
	if err != nil {
		return []string{currentBranch}, currentBranch, nil
	}

	var branches []string
	_ = branchesIter.ForEach(func(ref *plumbing.Reference) error {
		branches = append(branches, ref.Name().Short())
		return nil
	})

	if len(branches) == 0 {
		branches = append(branches, currentBranch)
	}

	return branches, currentBranch, nil
}

// CreateBranch crea una nueva rama y opcionalmente hace checkout
func CreateBranch(repoPath string, branchName string, checkout bool) error {
	repo, err := OpenRepo(repoPath)
	if err != nil {
		return err
	}

	branchName = strings.TrimSpace(branchName)
	if branchName == "" {
		return fmt.Errorf("el nombre de la rama no puede estar vacío")
	}

	head, err := repo.Head()
	if err != nil {
		return fmt.Errorf("no se pudo obtener el commit actual (HEAD): %w", err)
	}

	branchRefName := plumbing.NewBranchReferenceName(branchName)
	ref := plumbing.NewHashReference(branchRefName, head.Hash())
	if err := repo.Storer.SetReference(ref); err != nil {
		return fmt.Errorf("error creando rama %s: %w", branchName, err)
	}

	if checkout {
		return CheckoutBranch(repoPath, branchName)
	}
	return nil
}

// CheckoutBranch cambia el árbol de trabajo a la rama indicada
func CheckoutBranch(repoPath string, branchName string) error {
	repo, err := OpenRepo(repoPath)
	if err != nil {
		return err
	}

	branchName = strings.TrimSpace(branchName)
	wt, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("error accediendo al árbol de trabajo: %w", err)
	}

	err = wt.Checkout(&git.CheckoutOptions{
		Branch: plumbing.NewBranchReferenceName(branchName),
	})
	if err != nil {
		return fmt.Errorf("error al cambiar a la rama %s: %w", branchName, err)
	}

	return nil
}

// GetPullRequestURL construye la URL web para crear una Pull Request / Merge Request directa
func GetPullRequestURL(remoteURL string, sourceBranch string, targetBranch string) string {
	remoteURL = strings.TrimSpace(remoteURL)
	if remoteURL == "" || sourceBranch == "" {
		return ""
	}
	if targetBranch == "" {
		targetBranch = "main"
	}

	// Normalizar URLs SSH (git@github.com:usuario/repo.git -> https://github.com/usuario/repo)
	cleanURL := remoteURL
	if strings.HasPrefix(cleanURL, "git@") {
		cleanURL = strings.TrimPrefix(cleanURL, "git@")
		cleanURL = strings.Replace(cleanURL, ":", "/", 1)
		cleanURL = "https://" + cleanURL
	}
	cleanURL = strings.TrimSuffix(cleanURL, ".git")

	if strings.Contains(cleanURL, "github.com") {
		return fmt.Sprintf("%s/compare/%s...%s?expand=1", cleanURL, targetBranch, sourceBranch)
	} else if strings.Contains(cleanURL, "gitlab.com") || strings.Contains(cleanURL, "gitlab") {
		return fmt.Sprintf("%s/-/merge_requests/new?merge_request[source_branch]=%s&merge_request[target_branch]=%s", cleanURL, sourceBranch, targetBranch)
	} else if strings.Contains(cleanURL, "bitbucket.org") {
		return fmt.Sprintf("%s/pull-requests/new?source=%s&dest=%s", cleanURL, sourceBranch, targetBranch)
	}

	return fmt.Sprintf("%s/compare/%s...%s", cleanURL, targetBranch, sourceBranch)
}

