package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// RecentCompendium almacena información de compendios abiertos recientemente
type RecentCompendium struct {
	Path         string    `json:"path"`
	Name         string    `json:"name"`
	LastOpenedAt time.Time `json:"last_opened_at"`
}

// LLMConfig define la configuración para modelos de lenguaje
type LLMConfig struct {
	Provider    string  `json:"provider"`    // "clipboard", "gemini", "ollama", "groq", "openai", "custom"
	URL         string  `json:"url"`         // Endpoint URL (OpenAI-compatible)
	APIKey      string  `json:"api_key"`     // Clave API opcional (Gemini, Groq, OpenAI)
	Model       string  `json:"model"`       // Nombre del modelo (ej: "gemini-2.0-flash", "qwen2.5:7b")
	Temperature float64 `json:"temperature"` // Temperatura de muestreo (0.0 - 1.0)
}

// GitRemoteConfig define la configuración del repositorio Git remoto
type GitRemoteConfig struct {
	RemoteURL string `json:"remote_url"` // ej. "https://github.com/usuario/compendio.git"
	Branch    string `json:"branch"`     // Rama principal (ej. "main" o "master")
	Username  string `json:"username"`   // Usuario Git / GitHub / GitLab
	Token     string `json:"token"`      // Personal Access Token (PAT)
}

// Config define la estructura del archivo de configuración
type Config struct {
	LastCompendiumPath string             `json:"last_compendium_path,omitempty"`
	LastOpenedFile     string             `json:"last_opened_file,omitempty"`
	RecentCompendiums  []RecentCompendium `json:"recent_compendiums,omitempty"`
	AutoSaveDebounceMs int                `json:"auto_save_debounce_ms,omitempty"`
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
	LLMURL          string          `json:"llm_url"`
	LLM             LLMConfig       `json:"llm"`
	GitRemote       GitRemoteConfig `json:"git_remote"`
	KokoroURL       string          `json:"kokoro_url"`
	RecordingDevice string          `json:"recording_device"`
	AudioTempPath   string          `json:"audio_temp_path"`
	OnlyTTT         bool            `json:"only_ttt"`
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
		
		c.LLM.Provider = "gemini"
		c.LLM.Model = "gemini-2.0-flash"
		c.LLM.URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
		c.LLM.Temperature = 0.3
		c.GitRemote.Branch = "main"

		return c, nil
	}

	var c Config
	err = json.Unmarshal(file, &c)
	if err != nil {
		return nil, err
	}

	// Migración/Compatibilidad hacia atrás para LLM
	if c.LLM.Provider == "" {
		if c.LLMURL != "" {
			c.LLM.Provider = "custom"
			c.LLM.URL = c.LLMURL
			c.LLM.Model = "default"
		} else {
			c.LLM.Provider = "gemini"
			c.LLM.Model = "gemini-2.0-flash"
			c.LLM.URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
			c.LLM.Temperature = 0.3
		}
	}
	if c.GitRemote.Branch == "" {
		c.GitRemote.Branch = "main"
	}

	// Si las rutas de modelo en la configuración son relativas, resolverlas respecto al ejecutable
	if !filepath.IsAbs(c.GLiNER.ModelPath) && err == nil {
		exeDir := filepath.Dir(exePath)
		absModel := filepath.Join(exeDir, c.GLiNER.ModelPath)
		c.GLiNER.ModelPath = absModel
		if _, statErr := os.Stat(absModel); statErr != nil {
			fmt.Printf("Aviso: El modelo GLiNER no se encuentra en la ruta resuelta: %s\n", absModel)
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

// AddRecentCompendium añade o actualiza un compendio a la lista de recientes (máx 10)
func (c *Config) AddRecentCompendium(path, name string) {
	cleanPath := filepath.Clean(path)
	var updated []RecentCompendium

	// Insertar el nuevo en la primera posición
	updated = append(updated, RecentCompendium{
		Path:         cleanPath,
		Name:         name,
		LastOpenedAt: time.Now(),
	})

	// Añadir el resto sin duplicar
	for _, item := range c.RecentCompendiums {
		if filepath.Clean(item.Path) != cleanPath && len(updated) < 10 {
			updated = append(updated, item)
		}
	}

	c.RecentCompendiums = updated
	c.LastCompendiumPath = cleanPath
}

// RemoveRecentCompendium elimina un compendio de la lista de recientes
func (c *Config) RemoveRecentCompendium(path string) {
	cleanPath := filepath.Clean(path)
	var updated []RecentCompendium

	for _, item := range c.RecentCompendiums {
		if filepath.Clean(item.Path) != cleanPath {
			updated = append(updated, item)
		}
	}

	c.RecentCompendiums = updated
	if filepath.Clean(c.LastCompendiumPath) == cleanPath {
		c.LastCompendiumPath = ""
	}
}
