package storage

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestGenerateCompendiumFromWizard(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "wizard-compendium-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	cfg := WizardConfig{
		TargetDir:             tempDir,
		Name:                  "Catequesis Parroquial de Comunión",
		Description:           "Itinerario de iniciación cristiana de 2 años con 6 bloques temáticos.",
		Author:                "Carmen Gómez",
		Email:                 "carmen@catequesis.local",
		HorizonType:           "multi_year",
		Years:                 2,
		DurationMinutes:       60,
		IncludeInstructorNotes: true,
		IncludeStudentNotes:   true,
		Calendar: WizardCalendar{
			StartDate:       "2026-10-04",
			SessionDuration: 60,
		},
		Modules: []WizardModule{
			{
				Slug:         "ano-1-creacion-fe",
				Title:        "Año 1 - Módulo 1: La Creación y el Amor de Dios",
				Description:  "Dios Padre, el mundo creado y el valor de la persona.",
				SessionCount: 3,
				Year:         1,
			},
			{
				Slug:         "ano-1-jesus-evangelio",
				Title:        "Año 1 - Módulo 2: Jesús y el Evangelio",
				Description:  "Vida y enseñanzas de Jesús.",
				SessionCount: 3,
				Year:         1,
			},
			{
				Slug:         "ano-2-sacramentos",
				Title:        "Año 2 - Módulo 3: Los Sacramentos",
				Description:  "Signos sagrados y celebración.",
				SessionCount: 2,
				Year:         2,
			},
		},
	}

	info, err := GenerateCompendiumFromWizard(cfg)
	if err != nil {
		t.Fatalf("GenerateCompendiumFromWizard failed: %v", err)
	}

	if info == nil {
		t.Fatalf("expected non-nil CompendiumInfo")
	}

	if info.Meta.Name != "Catequesis Parroquial de Comunión" {
		t.Errorf("expected name %q, got %q", "Catequesis Parroquial de Comunión", info.Meta.Name)
	}

	// Verify required files created
	requiredFiles := []string{
		filepath.Join(tempDir, WriterDir, "project.json"),
		filepath.Join(tempDir, "hugo.toml"),
		filepath.Join(tempDir, ".github", "workflows", "hugo-pages.yml"),
		filepath.Join(tempDir, ContentDir, "_index.adoc"),
		filepath.Join(tempDir, ContentDir, "journal", "_index.adoc"),
		filepath.Join(tempDir, ContentDir, "ano-1-creacion-fe", "_index.adoc"),
		filepath.Join(tempDir, ContentDir, "ano-1-creacion-fe", "sesion-01.adoc"),
		filepath.Join(tempDir, ContentDir, "ano-1-creacion-fe", "sesion-02.adoc"),
		filepath.Join(tempDir, ContentDir, "ano-1-creacion-fe", "sesion-03.adoc"),
		filepath.Join(tempDir, ContentDir, "ano-1-jesus-evangelio", "sesion-01.adoc"),
		filepath.Join(tempDir, ContentDir, "ano-2-sacramentos", "sesion-01.adoc"),
		filepath.Join(tempDir, ".git"),
	}

	for _, p := range requiredFiles {
		if _, err := os.Stat(p); os.IsNotExist(err) {
			t.Errorf("expected path %s to exist", p)
		}
	}

	// Verify session content structure
	session1Path := filepath.Join(tempDir, ContentDir, "ano-1-creacion-fe", "sesion-01.adoc")
	contentBytes, err := os.ReadFile(session1Path)
	if err != nil {
		t.Fatalf("failed to read session 1: %v", err)
	}
	content := string(contentBytes)

	if !strings.Contains(content, ":date: 2026-10-04") {
		t.Errorf("expected session date 2026-10-04, got:\n%s", content)
	}
	if !strings.Contains(content, ":week: 1") {
		t.Errorf("expected week 1 in metadata, got:\n%s", content)
	}
	if !strings.Contains(content, "[INSTRUCTOR]") {
		t.Errorf("expected [INSTRUCTOR] block in session content")
	}
	if !strings.Contains(content, "Notas Pedagógicas del Formador") {
		t.Errorf("expected instructor notes in session content")
	}
	if !strings.Contains(content, "Cuaderno del Participante") {
		t.Errorf("expected student notes in session content")
	}

	// Verify week 2 date calculation (+7 days -> 2026-10-11)
	session2Path := filepath.Join(tempDir, ContentDir, "ano-1-creacion-fe", "sesion-02.adoc")
	s2Bytes, err := os.ReadFile(session2Path)
	if err != nil {
		t.Fatalf("failed to read session 2: %v", err)
	}
	s2Content := string(s2Bytes)
	if !strings.Contains(s2Content, ":date: 2026-10-11") {
		t.Errorf("expected session 2 date 2026-10-11, got:\n%s", s2Content)
	}
	if !strings.Contains(s2Content, ":week: 2") {
		t.Errorf("expected session 2 week 2, got:\n%s", s2Content)
	}

	// Verify modules list
	modules, err := GetModules(tempDir)
	if err != nil {
		t.Fatalf("GetModules failed: %v", err)
	}
	if len(modules) != 3 {
		t.Errorf("expected 3 modules, got %d", len(modules))
	}
}
