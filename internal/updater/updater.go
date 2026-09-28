package updater

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const (
	RepoOwner = "josejuanmontiel"
	RepoName  = "writer"
)

type UpdateInfo struct {
	Available      bool   `json:"available"`
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	ReleaseNotes   string `json:"releaseNotes"`
	DownloadURL    string `json:"downloadUrl"`
	AssetName      string `json:"assetName"`
	AssetSize      int64  `json:"assetSize"`
	PublishedAt    string `json:"publishedAt"`
}

type ReleaseAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	Size               int64  `json:"size"`
}

type GitHubRelease struct {
	TagName     string         `json:"tag_name"`
	Name        string         `json:"name"`
	Body        string         `json:"body"`
	PublishedAt string         `json:"published_at"`
	Assets      []ReleaseAsset `json:"assets"`
}

type Updater struct {
	currentVersion string
	client         *http.Client
}

func NewUpdater(currentVersion string) *Updater {
	return &Updater{
		currentVersion: currentVersion,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// CheckForUpdates consulta la API pública de GitHub para obtener la última release
func (u *Updater) CheckForUpdates() (*UpdateInfo, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", RepoOwner, RepoName)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creando petición: %w", err)
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "AntigravityWriter-Updater")

	resp, err := u.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error al conectar con GitHub: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("código de estado GitHub inesperado: %s", resp.Status)
	}

	var release GitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, fmt.Errorf("error decodificando respuesta de GitHub: %w", err)
	}

	latestTag := release.TagName
	hasUpdate := isNewerVersion(latestTag, u.currentVersion)

	info := &UpdateInfo{
		Available:      hasUpdate,
		CurrentVersion: u.currentVersion,
		LatestVersion:  latestTag,
		ReleaseNotes:   release.Body,
		PublishedAt:    release.PublishedAt,
	}

	if hasUpdate {
		matchedAsset := selectAssetForPlatform(release.Assets, runtime.GOOS, runtime.GOARCH)
		if matchedAsset != nil {
			info.DownloadURL = matchedAsset.BrowserDownloadURL
			info.AssetName = matchedAsset.Name
			info.AssetSize = matchedAsset.Size
		} else {
			// Si no hay paquete específico de auto-update, no marcamos disponible
			info.Available = false
		}
	}

	return info, nil
}

// IsAppImage devuelve true si la aplicación se está ejecutando dentro de un contenedor AppImage en Linux
func IsAppImage() bool {
	if runtime.GOOS != "linux" {
		return false
	}
	appImage := os.Getenv("APPIMAGE")
	if appImage == "" {
		return false
	}
	if _, err := os.Stat(appImage); err == nil {
		return true
	}
	return false
}

// GetExecutablePath devuelve la ruta del ejecutable real que debe ser actualizado o reiniciado.
// En entornos AppImage de Linux, os.Executable() apunta al punto de montaje temporal
// de solo lectura (/tmp/.mount_xxx/usr/bin/writer). Esta función devuelve en su lugar
// la ruta del archivo .AppImage real a través de la variable de entorno $APPIMAGE.
func GetExecutablePath() (string, error) {
	if runtime.GOOS == "linux" && IsAppImage() {
		appImagePath := os.Getenv("APPIMAGE")
		absPath, err := filepath.Abs(appImagePath)
		if err != nil {
			return "", fmt.Errorf("error obteniendo ruta absoluta de APPIMAGE (%s): %w", appImagePath, err)
		}
		evalPath, err := filepath.EvalSymlinks(absPath)
		if err != nil {
			evalPath = absPath
		}
		return evalPath, nil
	}

	execPath, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("no se pudo determinar la ruta del ejecutable actual: %w", err)
	}
	evalPath, err := filepath.EvalSymlinks(execPath)
	if err != nil {
		evalPath = execPath
	}

	if runtime.GOOS == "linux" && strings.Contains(evalPath, "/.mount_") {
		return "", fmt.Errorf("detectada ejecución dentro de montaje AppImage temporal (%s), pero la variable $APPIMAGE no está definida o el archivo no existe; no se puede auto-actualizar un sistema de archivos de solo lectura", evalPath)
	}

	return evalPath, nil
}

// checkWritable comprueba si la ruta destino y su directorio tienen permisos de escritura.
func checkWritable(targetPath string) error {
	dir := filepath.Dir(targetPath)
	dirInfo, err := os.Stat(dir)
	if err != nil {
		return fmt.Errorf("el directorio destino '%s' no es accesible: %w", dir, err)
	}
	if !dirInfo.IsDir() {
		return fmt.Errorf("la ruta '%s' no es un directorio válido", dir)
	}

	// Probar creación de archivo temporal para verificar permisos reales de escritura en el directorio
	testFile := filepath.Join(dir, fmt.Sprintf(".test_write_%d.tmp", time.Now().UnixNano()))
	f, err := os.OpenFile(testFile, os.O_CREATE|os.O_WRONLY|os.O_EXCL, 0600)
	if err != nil {
		if os.IsPermission(err) {
			return fmt.Errorf("sin permisos de escritura en '%s'. Mueva la aplicación a una carpeta con permisos de usuario o ejecute con permisos suficientes", dir)
		}
		return fmt.Errorf("error verificando permisos de escritura en '%s': %w", dir, err)
	}
	_ = f.Close()
	_ = os.Remove(testFile)

	// Si el archivo destino ya existe, comprobar si podemos abrirlo para escritura
	if _, err := os.Stat(targetPath); err == nil {
		f, err := os.OpenFile(targetPath, os.O_WRONLY, 0)
		if err != nil && os.IsPermission(err) {
			return fmt.Errorf("sin permisos de escritura sobre el archivo '%s'", targetPath)
		}
		if err == nil {
			_ = f.Close()
		}
	}

	return nil
}

// DownloadAndApplyUpdate descarga el artefacto y actualiza el binario o AppImage
func (u *Updater) DownloadAndApplyUpdate(downloadURL string, onProgress func(percent int)) error {
	if downloadURL == "" {
		return fmt.Errorf("URL de descarga vacía")
	}

	// 1. Obtener la ruta del ejecutable destino y comprobar permisos antes de descargar
	targetExec, err := GetExecutablePath()
	if err != nil {
		return err
	}

	if err := checkWritable(targetExec); err != nil {
		return err
	}

	// 2. Crear directorio temporal
	tempDir, err := os.MkdirTemp("", "writer-update-*")
	if err != nil {
		return fmt.Errorf("error creando directorio temporal: %w", err)
	}
	defer os.RemoveAll(tempDir)

	// 3. Descargar archivo con seguimiento de progreso
	archivePath := filepath.Join(tempDir, "update-archive")
	err = u.downloadFile(downloadURL, archivePath, onProgress)
	if err != nil {
		return fmt.Errorf("error descargando actualización: %w", err)
	}

	// 4. Extraer el binario según el formato
	var newBinaryPath string
	lowerURL := strings.ToLower(downloadURL)
	if strings.HasSuffix(lowerURL, ".zip") {
		newBinaryPath, err = extractBinaryFromZip(archivePath, tempDir)
	} else if strings.HasSuffix(lowerURL, ".tar.gz") || strings.HasSuffix(lowerURL, ".tgz") {
		newBinaryPath, err = extractBinaryFromTarGz(archivePath, tempDir)
	} else {
		// Asumimos binario directo si no es archivo comprimido (ej: .AppImage)
		newBinaryPath = archivePath
	}

	if err != nil {
		return fmt.Errorf("error extrayendo binario: %w", err)
	}

	// 5. Reemplazar ejecutable actual
	return replaceExecutable(targetExec, newBinaryPath)
}

func (u *Updater) downloadFile(url, destPath string, onProgress func(percent int)) error {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "AntigravityWriter-Updater")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("error HTTP al descargar: %s", resp.Status)
	}

	out, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer out.Close()

	totalSize := resp.ContentLength
	var downloaded int64
	buf := make([]byte, 64*1024)
	var lastPercent int

	for {
		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			_, writeErr := out.Write(buf[:n])
			if writeErr != nil {
				return writeErr
			}
			downloaded += int64(n)
			if totalSize > 0 && onProgress != nil {
				percent := int((downloaded * 100) / totalSize)
				if percent != lastPercent {
					lastPercent = percent
					onProgress(percent)
				}
			}
		}
		if readErr != nil {
			if readErr == io.EOF {
				break
			}
			return readErr
		}
	}

	if onProgress != nil {
		onProgress(100)
	}
	return nil
}

// replaceExecutable realiza el intercambio del binario de forma segura
func replaceExecutable(currentExecPath, newBinaryPath string) error {
	if runtime.GOOS == "windows" {
		oldExecPath := currentExecPath + ".old"
		// Si ya existe un .old anterior, intentamos eliminarlo
		_ = os.Remove(oldExecPath)

		// Renombrar el ejecutable actual en ejecución (Windows permite renombrar archivos abiertos)
		if err := os.Rename(currentExecPath, oldExecPath); err != nil {
			return fmt.Errorf("error renombrando ejecutable actual en Windows: %w", err)
		}

		// Copiar el nuevo binario a la ruta original
		if err := copyFile(newBinaryPath, currentExecPath); err != nil {
			// Rollback si falla la copia
			_ = os.Rename(oldExecPath, currentExecPath)
			return fmt.Errorf("error copiando nuevo ejecutable: %w", err)
		}
		return nil
	}

	// Linux / macOS:
	// Primero damos permisos de ejecución
	if err := os.Chmod(newBinaryPath, 0755); err != nil {
		return fmt.Errorf("error asignando permisos de ejecución a la actualización: %w", err)
	}

	// Evitar intentar escribir dentro de puntos de montaje AppImage de solo lectura
	if strings.Contains(currentExecPath, "/.mount_") {
		return fmt.Errorf("no se puede reemplazar un archivo dentro del montaje temporal de AppImage (%s)", currentExecPath)
	}

	// Crear archivo backup temporal
	backupPath := currentExecPath + ".old"
	_ = os.Remove(backupPath)
	if err := os.Rename(currentExecPath, backupPath); err != nil {
		return fmt.Errorf("error preparando reemplazo de %s (compruebe permisos de escritura): %w", currentExecPath, err)
	}

	// Copiar el nuevo binario a un archivo temporal en el mismo directorio de destino
	// para que el reemplazo final sea una operación de renombrado atómica
	destDir := filepath.Dir(currentExecPath)
	tempDest := filepath.Join(destDir, fmt.Sprintf(".update-%d.tmp", time.Now().UnixNano()))
	if err := copyFile(newBinaryPath, tempDest); err != nil {
		_ = os.Rename(backupPath, currentExecPath)
		return fmt.Errorf("error copiando nueva versión al destino: %w", err)
	}

	if err := os.Chmod(tempDest, 0755); err != nil {
		_ = os.Remove(tempDest)
		_ = os.Rename(backupPath, currentExecPath)
		return fmt.Errorf("error asignando permisos a la nueva versión: %w", err)
	}

	if err := os.Rename(tempDest, currentExecPath); err != nil {
		_ = os.Remove(tempDest)
		_ = os.Rename(backupPath, currentExecPath)
		return fmt.Errorf("error finalizando instalación de la nueva versión: %w", err)
	}

	_ = os.Chmod(currentExecPath, 0755)
	_ = os.Remove(backupPath)

	return nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

func extractBinaryFromZip(zipPath, destDir string) (string, error) {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return "", err
	}
	defer r.Close()

	binaryName := "writer"
	if runtime.GOOS == "windows" {
		binaryName = "writer.exe"
	}

	var foundPath string
	for _, f := range r.File {
		if strings.EqualFold(filepath.Base(f.Name), binaryName) || strings.HasSuffix(f.Name, binaryName) {
			rc, err := f.Open()
			if err != nil {
				return "", err
			}
			defer rc.Close()

			targetPath := filepath.Join(destDir, filepath.Base(f.Name))
			outFile, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
			if err != nil {
				return "", err
			}
			defer outFile.Close()

			_, err = io.Copy(outFile, rc)
			if err != nil {
				return "", err
			}
			foundPath = targetPath
			break
		}
	}

	if foundPath == "" {
		return "", fmt.Errorf("no se encontró el binario %s dentro del zip", binaryName)
	}
	return foundPath, nil
}

func extractBinaryFromTarGz(tarGzPath, destDir string) (string, error) {
	f, err := os.Open(tarGzPath)
	if err != nil {
		return "", err
	}
	defer f.Close()

	gzr, err := gzip.NewReader(f)
	if err != nil {
		return "", err
	}
	defer gzr.Close()

	tr := tar.NewReader(gzr)
	binaryName := "writer"
	var foundPath string

	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", err
		}

		if strings.EqualFold(filepath.Base(hdr.Name), binaryName) {
			targetPath := filepath.Join(destDir, filepath.Base(hdr.Name))
			outFile, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, os.FileMode(hdr.Mode))
			if err != nil {
				return "", err
			}
			defer outFile.Close()

			if _, err := io.Copy(outFile, tr); err != nil {
				return "", err
			}
			foundPath = targetPath
			break
		}
	}

	if foundPath == "" {
		return "", fmt.Errorf("no se encontró el binario %s dentro del tar.gz", binaryName)
	}
	return foundPath, nil
}

// selectAssetForPlatform selecciona el asset óptimo según SO y Arquitectura
func selectAssetForPlatform(assets []ReleaseAsset, goos, goarch string, isAppImage ...bool) *ReleaseAsset {
	appImage := false
	if len(isAppImage) > 0 {
		appImage = isAppImage[0]
	} else if goos == "linux" {
		appImage = IsAppImage()
	}

	if goos == "linux" && appImage {
		// En Linux ejecutando AppImage, debemos descargar el asset .AppImage compatible
		var archPatterns []string
		switch goarch {
		case "amd64":
			archPatterns = []string{"x86_64", "amd64"}
		case "arm64":
			archPatterns = []string{"aarch64", "arm64"}
		default:
			archPatterns = []string{goarch}
		}

		// 1. Buscar AppImage que coincida con la arquitectura
		for _, a := range assets {
			nameLower := strings.ToLower(a.Name)
			if strings.HasSuffix(nameLower, ".appimage") {
				for _, arch := range archPatterns {
					if strings.Contains(nameLower, strings.ToLower(arch)) {
						return &a
					}
				}
			}
		}

		// 2. Si no especifica arquitectura pero termina en .AppImage
		for _, a := range assets {
			nameLower := strings.ToLower(a.Name)
			if strings.HasSuffix(nameLower, ".appimage") {
				return &a
			}
		}

		return nil
	}

	// Priorizar paquetes ligeros (slim)
	var prefix, ext string
	switch goos {
	case "windows":
		prefix = "windows"
		ext = ".zip"
	case "darwin":
		prefix = "macos"
		ext = ".zip"
	case "linux":
		prefix = "linux"
		ext = ".tar.gz"
	default:
		return nil
	}

	// 1. Buscar paquete slim específico
	for _, a := range assets {
		name := strings.ToLower(a.Name)
		if strings.Contains(name, prefix) && strings.Contains(name, "slim") && strings.HasSuffix(name, ext) {
			return &a
		}
	}

	// 2. Si no hay slim, buscar cualquier zip/tar.gz para la plataforma
	for _, a := range assets {
		name := strings.ToLower(a.Name)
		if strings.Contains(name, prefix) && strings.HasSuffix(name, ext) {
			return &a
		}
	}

	return nil
}

// isNewerVersion compara dos tags (ej: v1.1.19 > v1.1.18)
func isNewerVersion(latest, current string) bool {
	cleanLatest := strings.TrimPrefix(latest, "v")
	cleanCurrent := strings.TrimPrefix(current, "v")

	if cleanLatest == cleanCurrent || cleanLatest == "" {
		return false
	}

	lParts := strings.Split(cleanLatest, ".")
	cParts := strings.Split(cleanCurrent, ".")

	maxLen := len(lParts)
	if len(cParts) > maxLen {
		maxLen = len(cParts)
	}

	for i := 0; i < maxLen; i++ {
		var lVal, cVal int
		if i < len(lParts) {
			fmt.Sscanf(lParts[i], "%d", &lVal)
		}
		if i < len(cParts) {
			fmt.Sscanf(cParts[i], "%d", &cVal)
		}
		if lVal > cVal {
			return true
		}
		if lVal < cVal {
			return false
		}
	}
	return false
}

// CleanupOldExecutables elimina los archivos .old residuales en arranque
func CleanupOldExecutables() {
	execPath, err := GetExecutablePath()
	if err != nil {
		return
	}
	oldPath := execPath + ".old"
	if _, err := os.Stat(oldPath); err == nil {
		_ = os.Remove(oldPath)
	}
}

// RestartApp lanza la nueva instancia y finaliza la actual
func RestartApp() error {
	execPath, err := GetExecutablePath()
	if err != nil {
		return err
	}

	cmd := exec.Command(execPath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// Si estamos en Linux bajo AppImage, sanitizar variables de entorno para que
	// el nuevo AppImage cree su propio punto de montaje limpio y no herede el temporal anterior
	if runtime.GOOS == "linux" && IsAppImage() {
		var cleanEnv []string
		for _, env := range os.Environ() {
			if strings.HasPrefix(env, "APPDIR=") || strings.HasPrefix(env, "ARGV0=") {
				continue
			}
			if strings.HasPrefix(env, "LD_LIBRARY_PATH=") {
				appDir := os.Getenv("APPDIR")
				if appDir != "" {
					val := strings.TrimPrefix(env, "LD_LIBRARY_PATH=")
					parts := strings.Split(val, ":")
					var filteredParts []string
					for _, p := range parts {
						if p != "" && !strings.HasPrefix(p, appDir) {
							filteredParts = append(filteredParts, p)
						}
					}
					if len(filteredParts) > 0 {
						cleanEnv = append(cleanEnv, "LD_LIBRARY_PATH="+strings.Join(filteredParts, ":"))
					}
					continue
				}
			}
			cleanEnv = append(cleanEnv, env)
		}
		cmd.Env = cleanEnv
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("error al reiniciar la aplicación (%s): %w", execPath, err)
	}

	os.Exit(0)
	return nil
}
