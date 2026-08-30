package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"antigravity-writer/internal/config"
)

// LLMResponseChoice representa la respuesta estándar del chat completions
type LLMResponseChoice struct {
	Index   int `json:"index"`
	Message struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"message"`
	FinishReason string `json:"finish_reason"`
}

// LLMResponse define la respuesta JSON de un endpoint OpenAI compatible
type LLMResponse struct {
	ID      string              `json:"id"`
	Choices []LLMResponseChoice `json:"choices"`
	Error   *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    interface{} `json:"code"`
	} `json:"error,omitempty"`
}

// ResolveLLMEndpoint normaliza la URL y modelo según el proveedor
func ResolveLLMEndpoint(cfg config.LLMConfig) (url string, model string, authHeader string) {
	provider := strings.ToLower(strings.TrimSpace(cfg.Provider))
	model = strings.TrimSpace(cfg.Model)
	url = strings.TrimSpace(cfg.URL)
	apiKey := strings.TrimSpace(cfg.APIKey)

	switch provider {
	case "gemini":
		if url == "" {
			url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
		}
		if model == "" {
			model = "gemini-3.6-flash"
		}
		if apiKey != "" {
			authHeader = "Bearer " + apiKey
		}
	case "ollama":
		if url == "" {
			url = "http://localhost:11434/v1/chat/completions"
		}
		if model == "" {
			model = "qwen2.5:latest"
		}
		if apiKey != "" {
			authHeader = "Bearer " + apiKey
		}
	case "groq":
		if url == "" {
			url = "https://api.groq.com/openai/v1/chat/completions"
		}
		if model == "" {
			model = "llama-3.3-70b-versatile"
		}
		if apiKey != "" {
			authHeader = "Bearer " + apiKey
		}
	case "openai":
		if url == "" {
			url = "https://api.openai.com/v1/chat/completions"
		}
		if model == "" {
			model = "gpt-4o-mini"
		}
		if apiKey != "" {
			authHeader = "Bearer " + apiKey
		}
	default: // custom o fallback
		if url == "" {
			url = "http://localhost:8000/v3/chat/completions"
		}
		if model == "" {
			model = "default"
		}
		if apiKey != "" {
			authHeader = "Bearer " + apiKey
		}
	}

	return url, model, authHeader
}

// ExecuteLLM realiza una llamada HTTP al proveedor LLM configurado
func ExecuteLLM(cfg config.LLMConfig, systemPrompt, userPrompt string) (string, error) {
	if cfg.Provider == "clipboard" {
		return "", fmt.Errorf("el modo Clipboard requiere copiar y pegar manualmente en el navegador")
	}

	endpointURL, model, authHeader := ResolveLLMEndpoint(cfg)

	messages := []map[string]string{}
	if strings.TrimSpace(systemPrompt) != "" {
		messages = append(messages, map[string]string{
			"role":    "system",
			"content": systemPrompt,
		})
	}
	messages = append(messages, map[string]string{
		"role":    "user",
		"content": userPrompt,
	})

	temp := cfg.Temperature
	if temp <= 0 {
		temp = 0.3
	}

	payload := map[string]interface{}{
		"model":       model,
		"messages":    messages,
		"temperature": temp,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("error serializando payload LLM: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "POST", endpointURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("error creando request HTTP: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("error de conexión con LLM (%s): %w", endpointURL, err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error leyendo respuesta de LLM: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("error de API LLM (Status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	var chatResp LLMResponse
	if err := json.Unmarshal(bodyBytes, &chatResp); err != nil {
		// Si no es JSON estándar OpenAI, devolver el cuerpo de texto si no está vacío
		rawText := strings.TrimSpace(string(bodyBytes))
		if len(rawText) > 0 {
			return rawText, nil
		}
		return "", fmt.Errorf("error decodificando respuesta JSON del LLM: %w", err)
	}

	if chatResp.Error != nil && chatResp.Error.Message != "" {
		return "", fmt.Errorf("error del proveedor LLM: %s", chatResp.Error.Message)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("el LLM no devolvió ninguna opción de respuesta")
	}

	return chatResp.Choices[0].Message.Content, nil
}

// TestLLMConnection verifica la conectividad con el proveedor LLM
func TestLLMConnection(cfg config.LLMConfig) (string, error) {
	if cfg.Provider == "clipboard" {
		return "Modo Clipboard (Gemini Web / ChatGPT) listo: no requiere conexión de red directa.", nil
	}

	systemPrompt := "Responde únicamente 'OK' si recibes este mensaje de prueba."
	userPrompt := "Ping de conexión."

	res, err := ExecuteLLM(cfg, systemPrompt, userPrompt)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("Conexión exitosa con %s (%s). Respuesta: %s", cfg.Provider, cfg.Model, strings.TrimSpace(res)), nil
}
