package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"antigravity-writer/internal/git"
)

// ScriptSection representa un bloque temporal de una escaleta de vídeo o audio
type ScriptSection struct {
	Timestamp    string `json:"timestamp"`     // "00:00", "01:30"
	Title        string `json:"title"`         // Título del bloque
	SpeakerNotes string `json:"speaker_notes"` // Guion verbal / notas para el formador
	VisualCue    string `json:"visual_cue"`    // Indicación visual (ej: "Plano medio", "Mostrar gráfico en pizarra")
	SlideText    string `json:"slide_text"`    // Texto o viñetas de la diapositiva asociada
}

// VideoScriptData representa la estructura completa de un guion multimedia generado
type VideoScriptData struct {
	Title          string          `json:"title"`
	EstimatedTotal string          `json:"estimated_total"`
	TargetAudience string          `json:"target_audience"`
	Hook           string          `json:"hook"`
	CallToAction   string          `json:"call_to_action"`
	Sections       []ScriptSection `json:"sections"`
	RawContent     string          `json:"raw_content,omitempty"`
}

// GetScriptPath devuelve la ruta en disco del archivo de guion para una sesión
func GetScriptPath(compendiumPath, sessionRelPath string) string {
	cleanRel := filepath.ToSlash(filepath.Clean(sessionRelPath))
	cleanRel = strings.TrimPrefix(cleanRel, "content/")
	cleanRel = strings.TrimSuffix(cleanRel, filepath.Ext(cleanRel))
	cleanRel = strings.ReplaceAll(cleanRel, "/", "_")

	return filepath.Join(compendiumPath, ".writer", "scripts", cleanRel+".json")
}

// SaveSessionScript persiste la escaleta multimedia en .writer/scripts/ y genera un commit automático
func SaveSessionScript(compendiumPath, sessionRelPath string, script VideoScriptData) error {
	if compendiumPath == "" {
		return fmt.Errorf("compendiumPath no puede estar vacío")
	}

	scriptPath := GetScriptPath(compendiumPath, sessionRelPath)
	dir := filepath.Dir(scriptPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("error creando directorio de scripts: %w", err)
	}

	data, err := json.MarshalIndent(script, "", "  ")
	if err != nil {
		return fmt.Errorf("error serializando guion: %w", err)
	}

	if err := os.WriteFile(scriptPath, data, 0644); err != nil {
		return fmt.Errorf("error guardando archivo de guion: %w", err)
	}

	// Commit automático en Git
	relToRepo, _ := filepath.Rel(compendiumPath, scriptPath)
	commitMsg := fmt.Sprintf("Guardar escaleta multimedia para %s", filepath.Base(sessionRelPath))
	_, _ = git.CommitFiles(compendiumPath, []string{relToRepo}, commitMsg, "Antigravity Script Studio", "studio@antigravity.local")

	return nil
}

// GetSessionScript recupera el guion multimedia guardado de una sesión si existe
func GetSessionScript(compendiumPath, sessionRelPath string) (*VideoScriptData, error) {
	if compendiumPath == "" {
		return nil, fmt.Errorf("compendiumPath no puede estar vacío")
	}

	scriptPath := GetScriptPath(compendiumPath, sessionRelPath)
	if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
		return nil, nil // No existe aún
	}

	data, err := os.ReadFile(scriptPath)
	if err != nil {
		return nil, fmt.Errorf("error leyendo archivo de guion: %w", err)
	}

	var script VideoScriptData
	if err := json.Unmarshal(data, &script); err != nil {
		return nil, fmt.Errorf("error deserializando guion: %w", err)
	}

	return &script, nil
}

// ExportScriptToMarkdown genera una versión Markdown limpia lista para copiar al teleprompter o descripción
func ExportScriptToMarkdown(script VideoScriptData) string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("# 🎬 %s\n\n", script.Title))
	if script.EstimatedTotal != "" {
		sb.WriteString(fmt.Sprintf("**⏱️ Duración Estimada:** %s\n", script.EstimatedTotal))
	}
	if script.TargetAudience != "" {
		sb.WriteString(fmt.Sprintf("**🎯 Público Objetivo:** %s\n", script.TargetAudience))
	}
	if script.Hook != "" {
		sb.WriteString(fmt.Sprintf("\n> **🪝 Gancho Inicial (Primeros 15-30s):**\n> %s\n\n", script.Hook))
	}

	sb.WriteString("## 📋 Escaleta Temporal\n\n")

	for _, sec := range script.Sections {
		sb.WriteString(fmt.Sprintf("### [%s] %s\n\n", sec.Timestamp, sec.Title))
		if sec.VisualCue != "" {
			sb.WriteString(fmt.Sprintf("*👁️ **Visual / Cámara:** %s*\n\n", sec.VisualCue))
		}
		if sec.SlideText != "" {
			sb.WriteString(fmt.Sprintf("*📊 **Diapositiva:** %s*\n\n", sec.SlideText))
		}
		if sec.SpeakerNotes != "" {
			sb.WriteString(fmt.Sprintf("%s\n\n", sec.SpeakerNotes))
		}
		sb.WriteString("---\n\n")
	}

	if script.CallToAction != "" {
		sb.WriteString(fmt.Sprintf("## 🚀 Llamada a la Acción (CTA)\n%s\n", script.CallToAction))
	}

	return sb.String()
}
