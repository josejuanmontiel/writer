package storage

import (
	"encoding/base64"
	"fmt"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// AssetInfo representa un archivo multimedia o documento adjunto en el compendio
type AssetInfo struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	RelativePath   string   `json:"relative_path"`
	Category       string   `json:"category"` // "images", "attachments", "diagrams"
	SizeBytes      int64    `json:"size_bytes"`
	SizeFormatted  string   `json:"size_formatted"`
	ModTime        string   `json:"mod_time"`
	MimeType       string   `json:"mime_type"`
	UsedInSessions []string `json:"used_in_sessions"` // Rutas de sesiones que contienen referencias
	IsOrphan       bool     `json:"is_orphan"`         // True si no se usa en ningún .adoc
}

// AssetGallery contiene la colección de activos y estadísticas del compendio
type AssetGallery struct {
	Assets       []AssetInfo `json:"assets"`
	TotalAssets  int         `json:"total_assets"`
	TotalBytes   int64       `json:"total_bytes"`
	ImagesCount  int         `json:"images_count"`
	DocsCount    int         `json:"docs_count"`
	OrphansCount int         `json:"orphans_count"`
}

// SaveAsset guarda un archivo binario o imagen en la carpeta assets/ del compendio
func SaveAsset(targetDir, subFolder, filename, base64Data string) (*AssetInfo, error) {
	if subFolder == "" {
		subFolder = "images"
	}
	if filename == "" {
		filename = fmt.Sprintf("asset-%d.png", time.Now().Unix())
	}

	// Normalizar nombre de archivo
	cleanFilename := strings.ToLower(strings.ReplaceAll(filename, " ", "-"))
	ext := filepath.Ext(cleanFilename)
	base := strings.TrimSuffix(cleanFilename, ext)
	if ext == "" {
		ext = ".png"
	}
	finalFilename := fmt.Sprintf("%s-%d%s", base, time.Now().Unix()%100000, ext)

	assetsDir := filepath.Join(targetDir, "assets", subFolder)
	if err := os.MkdirAll(assetsDir, 0755); err != nil {
		return nil, err
	}

	rawBytes, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return nil, fmt.Errorf("error decodificando base64: %w", err)
	}

	relPath := filepath.Join("assets", subFolder, finalFilename)
	fullPath := filepath.Join(targetDir, relPath)

	if err := os.WriteFile(fullPath, rawBytes, 0644); err != nil {
		return nil, err
	}

	mimeType := mime.TypeByExtension(ext)
	if mimeType == "" {
		mimeType = http.DetectContentType(rawBytes)
	}

	asset := AssetInfo{
		ID:             NormalizeConceptID(relPath),
		Name:           finalFilename,
		RelativePath:   relPath,
		Category:       subFolder,
		SizeBytes:      int64(len(rawBytes)),
		SizeFormatted:  formatBytes(int64(len(rawBytes))),
		ModTime:        time.Now().Format("2006-01-02 15:04"),
		MimeType:       mimeType,
		UsedInSessions: []string{},
		IsOrphan:       true,
	}

	return &asset, nil
}

// ListCompendiumAssets escanea la carpeta assets/ y calcula el uso cruzado e imágenes huérfanas
func ListCompendiumAssets(targetDir string) (*AssetGallery, error) {
	assetsRoot := filepath.Join(targetDir, "assets")
	orderedSessions, _ := GetOrderedCourseSessions(targetDir)

	// 1. Leer todo el contenido de todas las sesiones para mapear referencias
	sessionContents := make(map[string]string)
	for _, sRel := range orderedSessions {
		bytes, err := os.ReadFile(filepath.Join(targetDir, sRel))
		if err == nil {
			sessionContents[sRel] = string(bytes)
		}
	}

	// Añadir también archivos raíz como index.adoc o glosario.adoc si existen
	rootFiles, _ := os.ReadDir(targetDir)
	for _, rf := range rootFiles {
		if !rf.IsDir() && strings.HasSuffix(rf.Name(), ".adoc") {
			bytes, err := os.ReadFile(filepath.Join(targetDir, rf.Name()))
			if err == nil {
				sessionContents[rf.Name()] = string(bytes)
			}
		}
	}

	var assets []AssetInfo
	var totalBytes int64
	imagesCount := 0
	docsCount := 0
	orphansCount := 0

	// 2. Recorrer la carpeta assets/
	filepath.Walk(assetsRoot, func(path string, info os.FileInfo, err error) error {
		if err != nil || info == nil || info.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(targetDir, path)
		if err != nil {
			return nil
		}

		filename := filepath.Base(path)
		category := "attachments"
		if strings.Contains(relPath, "assets/images") {
			category = "images"
			imagesCount++
		} else if strings.Contains(relPath, "assets/diagrams") {
			category = "diagrams"
			imagesCount++
		} else {
			docsCount++
		}

		totalBytes += info.Size()

		// 3. Buscar en qué sesiones se menciona este archivo
		var usedIn []string
		for sRel, content := range sessionContents {
			if strings.Contains(content, filename) || strings.Contains(content, relPath) {
				usedIn = append(usedIn, sRel)
			}
		}

		isOrphan := len(usedIn) == 0
		if isOrphan {
			orphansCount++
		}

		mimeType := mime.TypeByExtension(filepath.Ext(filename))
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}

		assets = append(assets, AssetInfo{
			ID:             NormalizeConceptID(relPath),
			Name:           filename,
			RelativePath:   relPath,
			Category:       category,
			SizeBytes:      info.Size(),
			SizeFormatted:  formatBytes(info.Size()),
			ModTime:        info.ModTime().Format("2006-01-02 15:04"),
			MimeType:       mimeType,
			UsedInSessions: usedIn,
			IsOrphan:       isOrphan,
		})

		return nil
	})

	// Ordenar por fecha de modificación descendente
	sort.Slice(assets, func(i, j int) bool {
		return assets[i].ModTime > assets[j].ModTime
	})

	return &AssetGallery{
		Assets:       assets,
		TotalAssets:  len(assets),
		TotalBytes:   totalBytes,
		ImagesCount:  imagesCount,
		DocsCount:    docsCount,
		OrphansCount: orphansCount,
	}, nil
}

// DeleteAsset elimina un archivo de assets/
func DeleteAsset(targetDir, relativePath string) error {
	cleanRel := filepath.Clean(relativePath)
	if !strings.HasPrefix(cleanRel, "assets/") && !strings.HasPrefix(cleanRel, "assets\\") {
		return fmt.Errorf("ruta no autorizada fuera de assets: %s", relativePath)
	}

	fullPath := filepath.Join(targetDir, cleanRel)
	return os.Remove(fullPath)
}

// GetAssetBase64 lee un archivo y lo devuelve en base64 para previsualización web
func GetAssetBase64(targetDir, relativePath string) (string, string, error) {
	fullPath := filepath.Join(targetDir, filepath.Clean(relativePath))
	bytes, err := os.ReadFile(fullPath)
	if err != nil {
		return "", "", err
	}

	mimeType := mime.TypeByExtension(filepath.Ext(relativePath))
	if mimeType == "" {
		mimeType = http.DetectContentType(bytes)
	}

	b64 := base64.StdEncoding.EncodeToString(bytes)
	return b64, mimeType, nil
}

// FormatAsciidocImage genera el fragmento AsciiDoc con los presets de maquetación editorial
func FormatAsciidocImage(imageRelPath, caption, layout string, width int) string {
	if width <= 0 {
		width = 350
	}
	if caption == "" {
		caption = "Ilustración"
	}

	cleanRel := strings.TrimPrefix(imageRelPath, "assets/images/")
	cleanRel = strings.TrimPrefix(cleanRel, "assets/")

	switch layout {
	case "left":
		// Flotación izquierda con texto envolvente (estilo libro / catecismo)
		return fmt.Sprintf("image::%s[%s, width=%d, role=\"left thumb\", title=\"%s\"]\n", imageRelPath, caption, width, caption)

	case "right":
		// Flotación derecha con texto envolvente
		return fmt.Sprintf("image::%s[%s, width=%d, role=\"right thumb\", title=\"%s\"]\n", imageRelPath, caption, width, caption)

	case "center":
		// Figura centrada con pie de foto formal y numeración editorial
		return fmt.Sprintf(".%s\nimage::%s[%s, width=%d, align=center, pdfwidth=75%%]\n", caption, imageRelPath, caption, width)

	case "banner":
		// Banner o lámina a ancho completo
		return fmt.Sprintf("image::%s[%s, width=100%%, role=\"banner-full\", title=\"%s\"]\n", imageRelPath, caption, caption)

	case "inline":
		// Icono o símbolo litúrgico en línea con la frase
		return fmt.Sprintf("image:%s[%s, width=%d, role=\"inline\"]", imageRelPath, caption, width)

	default:
		return fmt.Sprintf("image::%s[%s, width=%d, align=center]\n", imageRelPath, caption, width)
	}
}

func formatBytes(b int64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}
