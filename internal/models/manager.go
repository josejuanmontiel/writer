package models

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sync"
)

type ModelCategory string

const (
	CategorySTT     ModelCategory = "stt"
	CategoryNER     ModelCategory = "ner"
	CategoryLLM     ModelCategory = "llm"
	CategoryTTS     ModelCategory = "tts"
)

type ModelInfo struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Category    ModelCategory `json:"category"`
	SizeMB      int           `json:"sizeMb"`
	IsInstalled bool          `json:"isInstalled"`
	DiskPath    string        `json:"diskPath"`
	IsBundle    bool          `json:"isBundle"`
	Files       []string      `json:"files"`
}

type Manager struct {
	baseDir      string
	downloadLock sync.Mutex
	activeDownloads map[string]int // modelId -> progress percentage
}

func NewManager(baseDir string) *Manager {
	if baseDir == "" {
		baseDir = "models"
	}
	_ = os.MkdirAll(baseDir, 0755)
	return &Manager{
		baseDir:         baseDir,
		activeDownloads: make(map[string]int),
	}
}

// Catalog define todos los modelos soportados y sus metadatos
func getCatalog() []ModelInfo {
	return []ModelInfo{
		{
			ID:          "whisper-tiny",
			Name:        "Whisper Tiny",
			Description: "Ultra-rápido y ligero. Ideal para transcripción en tiempo real con recursos mínimos.",
			Category:    CategorySTT,
			SizeMB:      75,
			IsBundle:    false,
			Files:       []string{"ggml-tiny.bin"},
		},
		{
			ID:          "whisper-base",
			Name:        "Whisper Base",
			Description: "Balance perfecto entre velocidad y precisión para dictado general.",
			Category:    CategorySTT,
			SizeMB:      145,
			IsBundle:    false,
			Files:       []string{"ggml-base.bin"},
		},
		{
			ID:          "whisper-small",
			Name:        "Whisper Small",
			Description: "Alta precisión con vocabulario técnico y acentos variados.",
			Category:    CategorySTT,
			SizeMB:      465,
			IsBundle:    false,
			Files:       []string{"ggml-small.bin"},
		},
		{
			ID:          "whisper-medium",
			Name:        "Whisper Medium",
			Description: "Máxima precisión en transcripción multilingüe (requiere más RAM/GPU).",
			Category:    CategorySTT,
			SizeMB:      1500,
			IsBundle:    false,
			Files:       []string{"ggml-medium.bin"},
		},
		{
			ID:          "gliner2-native",
			Name:        "GLiNER v2 (Extractor de Entidades)",
			Description: "Modelo ONNX local para extracción semántica de personajes, lugares y conceptos.",
			Category:    CategoryNER,
			SizeMB:      180,
			IsBundle:    true,
			Files: []string{
				"gliner2_native/count_embed.onnx",
				"gliner2_native/count_embed.onnx.data",
				"gliner2_native/encoder.onnx",
				"gliner2_native/encoder.onnx.data",
				"gliner2_native/gliner_classifiers.safetensors",
				"gliner2_native/prompt_ids.json",
				"gliner2_native/tokenizer.json",
			},
		},
	}
}

// GetCatalogStatus devuelve la lista de modelos con su estado de instalación actual
func (m *Manager) GetCatalogStatus() []ModelInfo {
	catalog := getCatalog()
	for i := range catalog {
		item := &catalog[i]
		allExist := true
		for _, relFile := range item.Files {
			fullPath := filepath.Join(m.baseDir, relFile)
			info, err := os.Stat(fullPath)
			if err != nil || info.Size() < 1024 { // debe existir y no estar vacío
				allExist = false
				break
			}
		}
		item.IsInstalled = allExist
		if item.IsBundle {
			item.DiskPath = filepath.Join(m.baseDir, "gliner2_native")
		} else if len(item.Files) > 0 {
			item.DiskPath = filepath.Join(m.baseDir, item.Files[0])
		}
	}
	return catalog
}

// GetModelURLs devuelve los URLs de descarga para un modelo
func getModelURLs(modelID string) (map[string]string, error) {
	urls := make(map[string]string)
	hfBaseWriter := "https://huggingface.co/josejuanmontiel/writer-models/resolve/main"
	hfBaseWhisper := "https://huggingface.co/ggerganov/whisper.cpp/resolve/main"

	switch modelID {
	case "whisper-tiny":
		urls["ggml-tiny.bin"] = hfBaseWriter + "/models/ggml-tiny.bin"
	case "whisper-base":
		urls["ggml-base.bin"] = hfBaseWhisper + "/ggml-base.bin"
	case "whisper-small":
		urls["ggml-small.bin"] = hfBaseWhisper + "/ggml-small.bin"
	case "whisper-medium":
		urls["ggml-medium.bin"] = hfBaseWhisper + "/ggml-medium.bin"
	case "gliner2-native":
		glinerFiles := []string{
			"count_embed.onnx",
			"count_embed.onnx.data",
			"encoder.onnx",
			"encoder.onnx.data",
			"gliner_classifiers.safetensors",
			"prompt_ids.json",
			"tokenizer.json",
		}
		for _, f := range glinerFiles {
			urls["gliner2_native/"+f] = hfBaseWriter + "/models/gliner2_native/" + f
		}
	default:
		return nil, fmt.Errorf("modelo no soportado: %s", modelID)
	}
	return urls, nil
}

// DownloadModel descarga todos los archivos de un modelo con seguimiento de progreso
func (m *Manager) DownloadModel(modelID string, onProgress func(percent int)) error {
	m.downloadLock.Lock()
	defer m.downloadLock.Unlock()

	urls, err := getModelURLs(modelID)
	if err != nil {
		return err
	}

	totalFiles := len(urls)
	fileIndex := 0

	for relPath, downloadURL := range urls {
		fullDest := filepath.Join(m.baseDir, relPath)
		if err := os.MkdirAll(filepath.Dir(fullDest), 0755); err != nil {
			return fmt.Errorf("error creando directorio para %s: %w", relPath, err)
		}

		err := m.downloadSingleFile(downloadURL, fullDest, func(filePercent int) {
			if onProgress != nil {
				// Progreso total ponderado por número de archivos
				overallPercent := int((float64(fileIndex)/float64(totalFiles))*100 + (float64(filePercent)/float64(totalFiles)))
				if overallPercent > 100 {
					overallPercent = 100
				}
				onProgress(overallPercent)
			}
		})
		if err != nil {
			return fmt.Errorf("falló descarga de %s: %w", relPath, err)
		}
		fileIndex++
	}

	if onProgress != nil {
		onProgress(100)
	}
	return nil
}

func (m *Manager) downloadSingleFile(url, destPath string, onProgress func(percent int)) error {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "AntigravityWriter-ModelHub")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("error HTTP %s", resp.Status)
	}

	tmpFile := destPath + ".tmp"
	out, err := os.Create(tmpFile)
	if err != nil {
		return err
	}

	totalSize := resp.ContentLength
	var downloaded int64
	buf := make([]byte, 64*1024)
	var lastPercent int

	for {
		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			_, writeErr := out.Write(buf[:n])
			if writeErr != nil {
				out.Close()
				_ = os.Remove(tmpFile)
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
			out.Close()
			_ = os.Remove(tmpFile)
			return readErr
		}
	}
	out.Close()

	// Mover archivo completado
	_ = os.Remove(destPath)
	return os.Rename(tmpFile, destPath)
}

// DeleteModel elimina los archivos de un modelo del disco
func (m *Manager) DeleteModel(modelID string) error {
	m.downloadLock.Lock()
	defer m.downloadLock.Unlock()

	catalog := getCatalog()
	for _, item := range catalog {
		if item.ID == modelID {
			if item.IsBundle {
				bundleDir := filepath.Join(m.baseDir, "gliner2_native")
				return os.RemoveAll(bundleDir)
			}
			for _, f := range item.Files {
				fullPath := filepath.Join(m.baseDir, f)
				_ = os.Remove(fullPath)
			}
			return nil
		}
	}
	return fmt.Errorf("modelo no encontrado: %s", modelID)
}
