package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// Config define la estructura del archivo de configuración
type Config struct {
	Whisper struct {
		UseLocal bool   `json:"use_local"`
		Language string `json:"language"` // "es", "en", "auto"
		Local    struct {
			Model   string `json:"model"`
			Threads int    `json:"threads"`
		} `json:"local"`
		Remote struct {
			URL   string `json:"url"`
			Model string `json:"model"`
		} `json:"remote"`
	} `json:"whisper"`
	LLMURL          string `json:"llm_url"`
	KokoroURL       string `json:"kokoro_url"`
	RecordingDevice string `json:"recording_device"`
	AudioTempPath   string `json:"audio_temp_path"`
	OnlyTTT         bool   `json:"only_ttt"`
	Canva           struct {
		ClientID     string `json:"client_id"`
		ClientSecret string `json:"client_secret"`
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
	} `json:"canva"`
	GLiNER struct {
		UseLocal  bool   `json:"use_local"`
		ModelPath string `json:"model_path"`
		Threshold float32 `json:"threshold"`
	} `json:"gliner"`
}

// Load lee el archivo config.json desde la raíz
func Load() (*Config, error) {
	// Intentar cargar config.json desde el directorio del ejecutable o fallback local
	exePath, err := os.Executable()
	configPath := "config.json"
	modelPath := "models/gliner2_native"

	if err == nil {
		exeDir := filepath.Dir(exePath)
		exeConfig := filepath.Join(exeDir, "config.json")
		if _, err := os.Stat(exeConfig); err == nil {
			configPath = exeConfig
		}
		
		// Set default model path relative to executable
		modelPath = filepath.Join(exeDir, "models", "gliner2_native")
	}

	file, err := os.ReadFile(configPath)
	if err != nil {
		fmt.Printf("Aviso: No se pudo leer %s, usando valores por defecto: %v\n", configPath, err)
		c := &Config{
			LLMURL:          "http://localhost:8000/v3/chat/completions",
			KokoroURL:       "http://localhost:8880/v1/audio/speech",
			RecordingDevice: "virtmic",
			AudioTempPath:   "/tmp/antigravity_dictation.wav",
		}
		c.Whisper.UseLocal = true
		c.Whisper.Language = "es"
		c.Whisper.Local.Model = "tiny"
		c.Whisper.Local.Threads = 4
		c.Whisper.Remote.URL = "http://localhost:10300/v1/audio/transcriptions"
		c.Whisper.Remote.Model = "tiny"
		
		c.GLiNER.UseLocal = true
		c.GLiNER.ModelPath = modelPath
		c.GLiNER.Threshold = 0.3
		
		return c, nil
	}

	var c Config
	err = json.Unmarshal(file, &c)
	if err != nil {
		return nil, err
	}

	// Si las rutas de modelo en la configuración son relativas, tratar de resolverlas respecto al ejecutable
	if !filepath.IsAbs(c.GLiNER.ModelPath) && err == nil {
		exeDir := filepath.Dir(exePath)
		absModel := filepath.Join(exeDir, c.GLiNER.ModelPath)
		if _, statErr := os.Stat(absModel); statErr == nil {
			c.GLiNER.ModelPath = absModel
		}
	}

	return &c, nil
}

// Save persiste la configuración en config.json
func Save(c *Config) error {
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile("config.json", data, 0644)
}
