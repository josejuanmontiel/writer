package storage

import (
	"os"
	"testing"

	"antigravity-writer/internal/git"
)

func TestSaveAndGetSessionScript(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "writer_script_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	_, err = git.InitRepo(tempDir)
	if err != nil {
		t.Fatalf("Failed to init git: %v", err)
	}

	testScript := VideoScriptData{
		Title:          "El Ciclo del Agua",
		EstimatedTotal: "08:30",
		Hook:           "¿Sabías que el agua que bebes hoy pudo haber estado en un glaciar prehistórico?",
		Sections: []ScriptSection{
			{
				Timestamp:    "00:00",
				Title:        "1. Gancho & Bienvenida",
				SpeakerNotes: "Hola a todos, hoy veremos la evaporación y condensación.",
				VisualCue:    "Primer plano con termo de agua caliente",
				SlideText:    "El Ciclo Hidrológico",
			},
		},
	}

	sessionRelPath := "content/modulo-1/sesion-01.adoc"
	err = SaveSessionScript(tempDir, sessionRelPath, testScript)
	if err != nil {
		t.Fatalf("Error guardando script: %v", err)
	}

	// Verificar que existe el archivo
	expectedPath := GetScriptPath(tempDir, sessionRelPath)
	if _, err := os.Stat(expectedPath); os.IsNotExist(err) {
		t.Fatalf("El archivo %s no se creó", expectedPath)
	}

	loaded, err := GetSessionScript(tempDir, sessionRelPath)
	if err != nil {
		t.Fatalf("Error cargando script: %v", err)
	}
	if loaded == nil || loaded.Title != testScript.Title {
		t.Fatalf("Script cargado no coincide con el guardado")
	}

	md := ExportScriptToMarkdown(*loaded)
	if len(md) == 0 {
		t.Fatalf("Exportación Markdown vacía")
	}
}
