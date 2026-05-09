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

const (
	defaultModelURL  = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin"
	defaultModelName = "ggml-tiny.bin"
)

// ModelManager gestiona la descarga y ubicación de los modelos de Whisper
type ModelManager struct {
	ModelsDir    string
	cachedModel  whisper.Model
	cachedName   string
}

func NewModelManager(dir string) *ModelManager {
	if dir == "" {
		dir = "models"
	}
	return &ModelManager{ModelsDir: dir}
}

// EnsureModel verifica si el modelo existe, si no, lo descarga
func (m *ModelManager) EnsureModel(modelName string) (string, error) {
	if modelName == "" {
		modelName = defaultModelName
	}

	// Normalizar nombre para local (ej: "tiny" -> "ggml-tiny.bin")
	fullName := modelName
	if filepath.Ext(fullName) != ".bin" {
		if !strings.HasPrefix(fullName, "ggml-") {
			fullName = "ggml-" + fullName
		}
		fullName = fullName + ".bin"
	}


	modelPath := filepath.Join(m.ModelsDir, fullName)


	if _, err := os.Stat(modelPath); err == nil {
		return modelPath, nil
	}

	// No existe, descargar
	fmt.Printf("Modelo %s no encontrado. Iniciando descarga...\n", modelName)
	
	if _, err := os.Stat(m.ModelsDir); os.IsNotExist(err) {
		err = os.MkdirAll(m.ModelsDir, 0755)
		if err != nil {
			return "", fmt.Errorf("error al crear carpeta de modelos: %w", err)
		}
	}

	url := defaultModelURL // Por ahora siempre tiny para pruebas
	
	err := m.downloadFile(modelPath, url)
	if err != nil {
		return "", fmt.Errorf("error al descargar modelo: %w", err)
	}

	fmt.Println("Descarga completada.")
	return modelPath, nil
}

func (m *ModelManager) downloadFile(filepath string, url string) error {
	out, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer out.Close()

	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("error en descarga: status %d", resp.StatusCode)
	}

	_, err = io.Copy(out, resp.Body)
	return err
}

// TranscribeLocal realiza la transcripción usando el modelo local
func (m *ModelManager) TranscribeLocal(audioPath string, modelName string, lang string, threads int) (string, error) {
	modelPath, err := m.EnsureModel(modelName)
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
