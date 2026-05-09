package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"


	"github.com/ggerganov/whisper.cpp/bindings/go/pkg/whisper"
	"github.com/go-audio/wav"
)

var modelURLs = map[string]string{
	"tiny":           "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
	"base":           "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
	"small":          "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin",
	"medium":         "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin",
	"large-v3-turbo": "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin",
}

const (
	defaultModelName = "tiny"
)

// ModelManager gestiona la descarga y ubicación de los modelos de Whisper
type ModelManager struct {
	ModelsDir   string
	cachedModel whisper.Model
	cachedName  string
}

func NewModelManager(dir string) *ModelManager {
	if dir == "" {
		dir = "models"
	}
	return &ModelManager{ModelsDir: dir}
}

// EnsureModel verifica si el modelo existe, si no, lo descarga
func (m *ModelManager) EnsureModel(modelName string, onProgress func(percent int)) (string, error) {
	if modelName == "" {
		modelName = defaultModelName
	}

	// Limpiar nombre (ej: "ggml-small.bin" -> "small")
	cleanName := strings.TrimPrefix(modelName, "ggml-")
	cleanName = strings.TrimSuffix(cleanName, ".bin")

	url, ok := modelURLs[cleanName]
	if !ok {
		// Si no está en nuestro mapa, intentamos construir una URL genérica o fallamos
		return "", fmt.Errorf("modelo desconocido: %s", cleanName)
	}

	fullName := "ggml-" + cleanName + ".bin"
	modelPath := filepath.Join(m.ModelsDir, fullName)

	if _, err := os.Stat(modelPath); err == nil {
		return modelPath, nil
	}

	// No existe, descargar
	fmt.Printf("Modelo %s no encontrado localmente. Iniciando descarga desde %s...\n", cleanName, url)

	if _, err := os.Stat(m.ModelsDir); os.IsNotExist(err) {
		err = os.MkdirAll(m.ModelsDir, 0755)
		if err != nil {
			return "", fmt.Errorf("error al crear carpeta de modelos: %w", err)
		}
	}

	err := m.downloadFile(modelPath, url, onProgress)
	if err != nil {
		return "", fmt.Errorf("error al descargar modelo %s: %w", cleanName, err)
	}

	fmt.Printf("Descarga de %s completada con éxito.\n", cleanName)
	return modelPath, nil
}

// downloadFile descarga un archivo con seguimiento de progreso
func (m *ModelManager) downloadFile(filepath string, url string, onProgress func(percent int)) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("error de servidor: %s", resp.Status)
	}

	out, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer out.Close()

	// Seguimiento de progreso
	totalSize := resp.ContentLength
	var downloaded int64
	
	buffer := make([]byte, 32*1024)
	lastPercent := -1

	for {
		n, err := resp.Body.Read(buffer)
		if n > 0 {
			_, writeErr := out.Write(buffer[:n])
			if writeErr != nil {
				return writeErr
			}
			downloaded += int64(n)
			
			if totalSize > 0 {
				percent := int(float64(downloaded) / float64(totalSize) * 100)
				if percent != lastPercent && onProgress != nil {
					onProgress(percent)
					lastPercent = percent
				}
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
	}

	return nil
}

// TranscribeLocal realiza la transcripción usando el modelo local
func (m *ModelManager) TranscribeLocal(audioPath string, modelName string, lang string, threads int) (string, error) {
	modelPath, err := m.EnsureModel(modelName, nil)
	if err != nil {
		return "", err
	}

	// Cargar modelo si no está en caché o es distinto
	if m.cachedModel == nil || m.cachedName != modelName {
		if m.cachedModel != nil {
			m.cachedModel.Close()
		}
		
		fmt.Printf("Cargando modelo Whisper en memoria: %s...\n", modelPath)
		model, err := whisper.New(modelPath)
		if err != nil {
			return "", fmt.Errorf("error al cargar modelo whisper: %w", err)
		}
		m.cachedModel = model
		m.cachedName = modelName
	}

	model := m.cachedModel


	// Preparar audio (Whisper requiere float32 16kHz)
	fmt.Println("Procesando archivo WAV...")
	samples, err := m.readWavToFloat32(audioPath)
	if err != nil {
		return "", fmt.Errorf("error al procesar audio: %w", err)
	}
	fmt.Printf("Audio cargado: %d muestras\n", len(samples))

	// Inferencia
	context, err := model.NewContext()
	if err != nil {
		return "", fmt.Errorf("error al crear contexto whisper: %w", err)
	}
	
	// Configurar idioma y hilos
	if lang != "" && lang != "auto" {
		context.SetLanguage(lang)
	}
	if threads > 0 {
		context.SetThreads(uint(threads))
	} else {
		context.SetThreads(4)
	}



	fmt.Println("Iniciando inferencia Whisper (esto puede tardar unos segundos en CPU)...")
	if err := context.Process(samples, nil, nil, nil); err != nil {
		return "", fmt.Errorf("error en procesamiento whisper: %w", err)
	}

	// Obtener texto
	fmt.Println("Extrayendo texto...")
	var text string
	for {
		segment, err := context.NextSegment()
		if err != nil {
			break
		}
		text += segment.Text + " "
	}

	return text, nil
}

func (m *ModelManager) readWavToFloat32(path string) ([]float32, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	d := wav.NewDecoder(f)
	buf, err := d.FullPCMBuffer()
	if err != nil {
		return nil, fmt.Errorf("error al leer buffer WAV: %w", err)
	}

	floatSamples := make([]float32, len(buf.Data))
	for i, sample := range buf.Data {
		floatSamples[i] = float32(sample) / 32768.0
	}

	return floatSamples, nil
}
