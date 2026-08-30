package ai

import (
	"os"
	"testing"

	"antigravity-writer/internal/config"
)

func TestLLMConnection_Gemini(t *testing.T) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		t.Skip("Saltando test de Gemini: GEMINI_API_KEY no definida en el entorno")
	}

	modelsToTest := []string{"gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.6-flash", "gemini-2.5-pro"}
	for _, m := range modelsToTest {
		cfg := config.LLMConfig{
			Provider:    "gemini",
			URL:         "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
			APIKey:      apiKey,
			Model:       m,
			Temperature: 0.3,
		}

		res, err := TestLLMConnection(cfg)
		if err != nil {
			t.Logf("Modelo %s -> Error: %v", m, err)
		} else {
			t.Logf("Modelo %s -> ÉXITO: %s", m, res)
		}
	}
}
