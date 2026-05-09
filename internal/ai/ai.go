package ai

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/ggerganov/whisper.cpp/bindings/go"
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

// ModelManager gestiona la descarga y carga de modelos Whisper
type ModelManager struct {
	ModelsPath string
}

func NewModelManager(path string) *ModelManager {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		os.MkdirAll(path, 0755)
	}
	return &ModelManager{ModelsPath: path}
}

// readWav manual para convertir de bytes a []float32
func readWav(wavPath string) ([]float32, error) {
	file, err := os.Open(wavPath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	// Saltar cabecera WAV (44 bytes aprox)
	file.Seek(44, 0)
	
	content, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}

	samplesCount := len(content) / 2
	data := make([]float32, samplesCount)
	for i := 0; i < samplesCount; i++ {
		sample := int16(binary.LittleEndian.Uint16(content[i*2 : i*2+2]))
		data[i] = float32(sample) / 32768.0
	}
	return data, nil
}

func (m *ModelManager) TranscribeLocal(wavPath, modelName, language string, threads int) (string, error) {
	fullModelPath := fmt.Sprintf("%s/ggml-%s.bin", m.ModelsPath, modelName)
	if _, err := os.Stat(fullModelPath); os.IsNotExist(err) {
		return "", fmt.Errorf("modelo no encontrado en %s. Por favor descárgalo", fullModelPath)
	}

	ctx := whisper.Whisper_init(fullModelPath)
	if ctx == nil {
		return "", fmt.Errorf("error al inicializar whisper con modelo %s", fullModelPath)
	}
	defer ctx.Whisper_free()

	params := ctx.Whisper_full_default_params(whisper.SAMPLING_GREEDY)
	
	// El idioma debe ser el ID numérico
	langID := ctx.Whisper_lang_id(language)
	params.SetLanguage(langID)
	
	params.SetThreads(threads)
	params.SetPrintProgress(false)
	params.SetPrintRealtime(false)

	data, err := readWav(wavPath)
	if err != nil {
		return "", fmt.Errorf("error al leer WAV: %v", err)
	}

	if err := ctx.Whisper_full(params, data, nil, nil, nil); err != nil {
		return "", fmt.Errorf("error en la transcripción: %v", err)
	}

	var result strings.Builder
	segments := ctx.Whisper_full_n_segments()
	for i := 0; i < segments; i++ {
		result.WriteString(ctx.Whisper_full_get_segment_text(i))
	}

	return result.String(), nil
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
	resp, err := http.Post(llmURL, "application/json", bytes.NewBuffer(jsonData))
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
