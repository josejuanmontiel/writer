package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/ggerganov/whisper.cpp/bindings/go/pkg/whisper"
	"github.com/go-audio/wav"
	"path/filepath"
)

type AIProcessor struct {
	ModelManager    *ModelManager
	GLiNERProcessor *GLiNER2Processor
}

func NewAIProcessor(whisperModelPath string, glinerModelPath string) *AIProcessor {
	gliner, err := NewGLiNER2Processor(glinerModelPath)
	if err != nil {
		fmt.Printf("⚠️ GLiNER2 no disponible en %s: %v\n", glinerModelPath, err)
	} else {
		fmt.Println("✅ Motor GLiNER2 local inicializado con éxito")
	}

	return &AIProcessor{
		ModelManager:    NewModelManager(whisperModelPath),
		GLiNERProcessor: gliner,
	}
}

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

// ModelManager gestiona la descarga y carga de modelos Whisper
type ModelManager struct {
	ModelsPath  string
	cachedModel whisper.Model
	cachedName  string
}

func NewModelManager(path string) *ModelManager {
	if path == "" {
		path = "models"
	}
	if _, err := os.Stat(path); os.IsNotExist(err) {
		os.MkdirAll(path, 0755)
	}
	return &ModelManager{ModelsPath: path}
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
		return "", fmt.Errorf("modelo desconocido: %s", cleanName)
	}

	fullName := "ggml-" + cleanName + ".bin"
	modelPath := filepath.Join(m.ModelsPath, fullName)

	if _, err := os.Stat(modelPath); err == nil {
		return modelPath, nil
	}

	// No existe, descargar
	fmt.Printf("Modelo %s no encontrado localmente. Iniciando descarga desde %s...\n", cleanName, url)

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

func (m *ModelManager) TranscribeLocal(wavPath, modelName, language string, threads int) (string, error) {
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
	samples, err := m.readWavToFloat32(wavPath)
	if err != nil {
		return "", fmt.Errorf("error al procesar audio: %w", err)
	}

	// Inferencia
	context, err := model.NewContext()
	if err != nil {
		return "", fmt.Errorf("error al crear contexto whisper: %w", err)
	}
	
	if language != "" && language != "auto" {
		context.SetLanguage(language)
	}
	if threads > 0 {
		context.SetThreads(uint(threads))
	} else {
		context.SetThreads(4)
	}

	if err := context.Process(samples, nil, nil, nil); err != nil {
		return "", fmt.Errorf("error en procesamiento whisper: %w", err)
	}

	var result strings.Builder
	for {
		segment, err := context.NextSegment()
		if err != nil {
			break
		}
		result.WriteString(segment.Text + " ")
	}

	return result.String(), nil
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

func ProcessAudioRemote(url string, model string, language string, wavPath string) (string, error) {
	file, err := os.Open(wavPath)
	if err != nil {
		return "", fmt.Errorf("error al abrir WAV para envío remoto: %v", err)
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("file", "audio.wav")
	if err != nil {
		return "", err
	}
	io.Copy(part, file)

	_ = writer.WriteField("model", model)
	_ = writer.WriteField("language", language)
	_ = writer.WriteField("temperature", "0.0")
	_ = writer.WriteField("no_speech_threshold", "0.6")

	err = writer.Close()
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API error (%d): %s", resp.StatusCode, string(bodyBytes))
	}

	var result struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	return result.Text, nil
}

func ProcessWithLLM(llmURL string, text string, onInsertText func(string)) {
	if llmURL == "" {
		fmt.Println("Error: LLM_URL no configurada")
		return
	}

	payload := map[string]interface{}{
		"model": "qwen",
		"messages": []map[string]string{
			{"role": "system", "content": "Eres un asistente de escritura avanzado. Puedes escribir en el editor local. SIEMPRE usa herramientas para interactuar."},
			{"role": "user", "content": text},
		},
		"tools": []map[string]interface{}{
			{
				"type": "function",
				"function": map[string]interface{}{
					"name":        "insert_text",
					"description": "Inserta texto en el documento local",
					"parameters": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"text": map[string]interface{}{"type": "string", "description": "El texto a insertar"},
						},
						"required": []string{"text"},
					},
				},
			},
		},
		"tool_choice": "auto",
	}

	jsonData, _ := json.Marshal(payload)
	resp, err := http.Post(llmURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("Error al llamar al LLM: %v\n", err)
		return
	}
	defer resp.Body.Close()

	var chatResp struct {
		Choices []struct {
			Message struct {
				Content   string `json:"content"`
				ToolCalls []struct {
					Function struct {
						Name      string `json:"name"`
						Arguments string `json:"arguments"`
					} `json:"function"`
				} `json:"tool_calls"`
			} `json:"message"`
		} `json:"choices"`
	}
	json.NewDecoder(resp.Body).Decode(&chatResp)

	if len(chatResp.Choices) > 0 {
		msg := chatResp.Choices[0].Message
		
		// 1. Intentar con ToolCalls oficiales (API nativa)
		if len(msg.ToolCalls) > 0 {
			for _, tc := range msg.ToolCalls {
				if tc.Function.Name == "insert_text" {
					var args struct{ Text string }
					json.Unmarshal([]byte(tc.Function.Arguments), &args)
					onInsertText(args.Text)
				}
			}
			return
		}

		// 2. Fallback: Parsear etiquetas <tool_call> en el contenido (Formatos como Qwen)
		if strings.Contains(msg.Content, "<tool_call>") {
			start := strings.Index(msg.Content, "<tool_call>") + len("<tool_call>")
			end := strings.Index(msg.Content, "</tool_call>")
			if end > start {
				toolJSON := msg.Content[start:end]
				var tc struct {
					Name      string                 `json:"name"`
					Arguments map[string]interface{} `json:"arguments"`
				}
				if err := json.Unmarshal([]byte(toolJSON), &tc); err == nil {
					if tc.Name == "insert_text" {
						if text, ok := tc.Arguments["text"].(string); ok {
							onInsertText(text)
						}
					}
				}
			}
		} else {
			fmt.Printf("Respuesta LLM (sin herramientas): %s\n", msg.Content)
		}
	}
}

func SimpleLLMCall(llmURL string, prompt string) (string, error) {
	payload := map[string]interface{}{
		"model": "qwen",
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"temperature": 0.0,
		"response_format": map[string]string{
			"type": "json_object",
		},
	}

	jsonData, _ := json.Marshal(payload)
	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Post(llmURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var chatResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	json.NewDecoder(resp.Body).Decode(&chatResp)

	if len(chatResp.Choices) > 0 {
		return chatResp.Choices[0].Message.Content, nil
	}
	return "", fmt.Errorf("no response from LLM")
}
