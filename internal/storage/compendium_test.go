package storage

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCreateAndOpenCompendium(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "compendium-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	meta := ProjectMeta{
		ID:          "test-course-01",
		Name:        "Curso de Prueba",
		Description: "Descripción del curso de prueba",
		Author:      "Profesor Test",
		Email:       "profesor@test.local",
	}

	// 1. Test CreateCompendium
	info, err := CreateCompendium(tempDir, meta)
	if err != nil {
		t.Fatalf("CreateCompendium failed: %v", err)
	}
	if info == nil {
		t.Fatalf("expected non-nil CompendiumInfo")
	}
	if info.Meta.Name != "Curso de Prueba" {
		t.Errorf("expected course name %q, got %q", "Curso de Prueba", info.Meta.Name)
	}
	if info.LastCommit == "" {
		t.Errorf("expected initial commit hash, got empty string")
	}

	// Verify directories and files created
	expectedPaths := []string{
		filepath.Join(tempDir, WriterDir, "project.json"),
		filepath.Join(tempDir, WriterDir, "graph-global.json"),
		filepath.Join(tempDir, "hugo.toml"),
		filepath.Join(tempDir, ".github", "workflows", "hugo-pages.yml"),
		filepath.Join(tempDir, ContentDir, "_index.adoc"),
		filepath.Join(tempDir, ContentDir, "modulo-1", "_index.adoc"),
		filepath.Join(tempDir, ContentDir, "modulo-1", "sesion-01.adoc"),
		filepath.Join(tempDir, ContentDir, "journal", "_index.adoc"),
		filepath.Join(tempDir, ".git"),
	}
	for _, p := range expectedPaths {
		if _, err := os.Stat(p); os.IsNotExist(err) {
			t.Errorf("expected path %s to exist", p)
		}
	}

	// 2. Test OpenCompendium
	openedInfo, err := OpenCompendium(tempDir)
	if err != nil {
		t.Fatalf("OpenCompendium failed: %v", err)
	}
	if openedInfo.Meta.ID != "test-course-01" {
		t.Errorf("expected ID 'test-course-01', got %q", openedInfo.Meta.ID)
	}

	// 3. Test GetFileTree
	tree, err := GetFileTree(tempDir)
	if err != nil {
		t.Fatalf("GetFileTree failed: %v", err)
	}
	if len(tree) == 0 {
		t.Fatalf("expected non-empty file tree")
	}

	// 4. Test SaveLessonFile and ReadFile
	lessonPath := "content/modulo-1/sesion-01.adoc"
	newContent := "= Sesión 1: Contenido Modificado con éxito\n\n[TIP]\n.Consejo\nComprobar antes de empezar."
	err = SaveLessonFile(tempDir, lessonPath, newContent, "Actualizar contenido sesión 1", meta.Author, meta.Email)
	if err != nil {
		t.Fatalf("SaveLessonFile failed: %v", err)
	}

	readBack, err := ReadFile(tempDir, lessonPath)
	if err != nil {
		t.Fatalf("ReadFile failed: %v", err)
	}
	if !strings.Contains(readBack, "Contenido Modificado con éxito") {
		t.Fatalf("read content did not match written content: %s", readBack)
	}

	// 5. Test CreateFile
	newLessonPath := "content/modulo-1/sesion-02.adoc"
	err = CreateFile(tempDir, newLessonPath, "", "Crear sesión 2", meta.Author, meta.Email)
	if err != nil {
		t.Fatalf("CreateFile failed: %v", err)
	}
	readBack2, err := ReadFile(tempDir, newLessonPath)
	if err != nil {
		t.Fatalf("ReadFile for new file failed: %v", err)
	}
	if !strings.Contains(readBack2, "sesion-02") {
		t.Fatalf("expected template content in new session: %s", readBack2)
	}

	// 6. Test CreateModule and GetModules
	err = CreateModule(tempDir, "modulo-2-taller", "Módulo 2: Taller y Motores", "Prácticas de taller", meta.Author, meta.Email)
	if err != nil {
		t.Fatalf("CreateModule failed: %v", err)
	}

	modules, err := GetModules(tempDir)
	if err != nil {
		t.Fatalf("GetModules failed: %v", err)
	}
	if len(modules) < 2 {
		t.Fatalf("expected at least 2 modules, got %d", len(modules))
	}

	// 7. Test UpdateModule
	err = UpdateModule(tempDir, "modulo-2-taller", "Módulo 2: Taller Renovado", "Nueva descripción", meta.Author, meta.Email)
	if err != nil {
		t.Fatalf("UpdateModule failed: %v", err)
	}
	updatedModules, err := GetModules(tempDir)
	if err != nil {
		t.Fatalf("GetModules after update failed: %v", err)
	}
	foundUpdated := false
	for _, m := range updatedModules {
		if m.Slug == "modulo-2-taller" && m.Title == "Módulo 2: Taller Renovado" {
			foundUpdated = true
			break
		}
	}
	if !foundUpdated {
		t.Fatalf("expected updated module title 'Módulo 2: Taller Renovado'")
	}

	// 8. Test DeleteModule
	err = DeleteModule(tempDir, "modulo-2-taller", meta.Author, meta.Email)
	if err != nil {
		t.Fatalf("DeleteModule failed: %v", err)
	}
	remainingModules, err := GetModules(tempDir)
	if err != nil {
		t.Fatalf("GetModules after delete failed: %v", err)
	}
	for _, m := range remainingModules {
		if m.Slug == "modulo-2-taller" {
			t.Fatalf("expected modulo-2-taller to be deleted")
		}
	}

	// 9. Test CreateJournalEntry and GetJournalEntries
	journalRelPath, err := CreateJournalEntry(tempDir, "Decisión de Enfoque Metodológico", "decision-metodologica", "modulo-1", meta.Author, meta.Email)
	if err != nil {
		t.Fatalf("CreateJournalEntry failed: %v", err)
	}
	if !strings.Contains(journalRelPath, "content/journal/") {
		t.Fatalf("expected journal entry path in content/journal/, got %s", journalRelPath)
	}

	entries, err := GetJournalEntries(tempDir)
	if err != nil {
		t.Fatalf("GetJournalEntries failed: %v", err)
	}
	if len(entries) < 2 {
		t.Fatalf("expected at least 2 journal entries, got %d", len(entries))
	}
	foundEntry := false
	for _, e := range entries {
		if e.Title == "Decisión de Enfoque Metodológico" {
			foundEntry = true
			if e.RelatedSession != "modulo-1" {
				t.Errorf("expected related session 'modulo-1', got %q", e.RelatedSession)
			}
			break
		}
	}
	if !foundEntry {
		t.Fatalf("expected newly created journal entry in list")
	}

	// 10. Test UpdateFileTitleAndRename
	renamedPath, err := UpdateFileTitleAndRename(tempDir, "content/modulo-1/sesion-01.adoc", "content/modulo-1/sesion-01-fundamentos.adoc", "Sesión 1: Fundamentos Renovados", meta.Author, meta.Email)
	if err != nil {
		t.Fatalf("UpdateFileTitleAndRename failed: %v", err)
	}
	if renamedPath != "content/modulo-1/sesion-01-fundamentos.adoc" {
		t.Fatalf("expected renamed path %q, got %q", "content/modulo-1/sesion-01-fundamentos.adoc", renamedPath)
	}

	updatedData, err := os.ReadFile(filepath.Join(tempDir, renamedPath))
	if err != nil {
		t.Fatalf("failed to read renamed file: %v", err)
	}
	if !strings.Contains(string(updatedData), "= Sesión 1: Fundamentos Renovados") {
		t.Fatalf("expected updated title heading in file, got:\n%s", string(updatedData))
	}

	// 11. Test DeleteCompendiumFile
	err = DeleteCompendiumFile(tempDir, renamedPath, meta.Author, meta.Email)
	if err != nil {
		t.Fatalf("DeleteCompendiumFile failed: %v", err)
	}
	if _, err := os.Stat(filepath.Join(tempDir, renamedPath)); !os.IsNotExist(err) {
		t.Fatalf("expected file to be deleted from disk")
	}
}


