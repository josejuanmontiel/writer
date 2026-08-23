package storage

import (
	"os"
	"testing"
)

func TestCurriculumLinter_CleanPass(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "writer_linter_clean_*")
	if err != nil {
		t.Fatalf("Error creando tmpDir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	meta := ProjectMeta{
		Name:   "Compendio Coherente",
		Author: "Profesor",
		Email:  "profesor@example.com",
	}
	_, _ = CreateCompendium(tmpDir, meta)

	// Sesión 1: Bautismo
	s1Rel := "content/modulo-1/sesion-01.adoc"
	_ = SaveLessonFile(tmpDir, s1Rel, "= Sesión 1: El Bautismo\n", "Sesión 1", meta.Author, meta.Email)
	ch1 := &ChapterGraph{
		RelativePath: s1Rel,
		Title:        "Sesión 1: El Bautismo",
		Nodes: []GraphNode{
			{ID: "bautismo", Label: "Bautismo", Type: "Sacramento", SourceFiles: []string{s1Rel}},
		},
	}
	SaveChapterGraph(tmpDir, ch1)

	// Sesión 2: Eucaristía (requiere Bautismo impartido en Sesión 1 -> correcto!)
	s2Rel := "content/modulo-1/sesion-02.adoc"
	_ = SaveLessonFile(tmpDir, s2Rel, "= Sesión 2: La Eucaristía\n", "Sesión 2", meta.Author, meta.Email)
	ch2 := &ChapterGraph{
		RelativePath: s2Rel,
		Title:        "Sesión 2: La Eucaristía",
		Nodes: []GraphNode{
			{ID: "bautismo", Label: "Bautismo", Type: "Sacramento", SourceFiles: []string{s2Rel}},
			{ID: "eucaristia", Label: "Eucaristía", Type: "Sacramento", SourceFiles: []string{s2Rel}},
		},
		Edges: []GraphEdge{
			{Source: "bautismo", Target: "eucaristia", Label: "prerrequisito_de", Score: 0.95},
		},
	}
	SaveChapterGraph(tmpDir, ch2)

	gGlobal, _ := LoadGlobalGraph(tmpDir)
	gGlobal = MergeChapterGraph(gGlobal, ch1)
	gGlobal = MergeChapterGraph(gGlobal, ch2)
	SaveGlobalGraph(tmpDir, gGlobal)

	report, err := GetCurriculumLintReport(tmpDir)
	if err != nil {
		t.Fatalf("Error ejecutando linter: %v", err)
	}

	if report.ErrorCount != 0 {
		t.Errorf("Esperado 0 errores en compendio coherente, obtenido %d", report.ErrorCount)
	}
	if report.HealthScore != 100 {
		t.Errorf("Esperado HealthScore de 100, obtenido %d", report.HealthScore)
	}
}

func TestCurriculumLinter_DetectsCyclesAndPrematureUsage(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "writer_linter_issues_*")
	if err != nil {
		t.Fatalf("Error creando tmpDir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	meta := ProjectMeta{
		Name:   "Compendio con Inconsistencias",
		Author: "Profesor",
		Email:  "profesor@example.com",
	}
	_, _ = CreateCompendium(tmpDir, meta)

	// Sesión 1 introduce 'concepto-b' que requiere 'concepto-a' (pero concepto-a se enseña en Sesión 2!) -> Uso prematuro
	s1Rel := "content/modulo-1/sesion-01.adoc"
	_ = SaveLessonFile(tmpDir, s1Rel, "= Sesión 1\n", "Sesión 1", meta.Author, meta.Email)
	ch1 := &ChapterGraph{
		RelativePath: s1Rel,
		Title:        "Sesión 1",
		Nodes: []GraphNode{
			{ID: "concepto-b", Label: "Concepto B", Type: "Doctrina", SourceFiles: []string{s1Rel}},
		},
	}
	SaveChapterGraph(tmpDir, ch1)

	// Sesión 2 introduce 'concepto-a'
	s2Rel := "content/modulo-1/sesion-02.adoc"
	_ = SaveLessonFile(tmpDir, s2Rel, "= Sesión 2\n", "Sesión 2", meta.Author, meta.Email)
	ch2 := &ChapterGraph{
		RelativePath: s2Rel,
		Title:        "Sesión 2",
		Nodes: []GraphNode{
			{ID: "concepto-a", Label: "Concepto A", Type: "Doctrina", SourceFiles: []string{s2Rel}},
			{ID: "concepto-c", Label: "Concepto C", Type: "Doctrina", SourceFiles: []string{s2Rel}},
		},
	}
	SaveChapterGraph(tmpDir, ch2)

	// Grafo global con ciclo circular: A requiere B y B requiere A
	gGlobal := &GraphData{
		Nodes: []GraphNode{
			{ID: "concepto-a", Label: "Concepto A", Type: "Doctrina", SourceFiles: []string{s2Rel}},
			{ID: "concepto-b", Label: "Concepto B", Type: "Doctrina", SourceFiles: []string{s1Rel}},
			{ID: "concepto-c", Label: "Concepto C", Type: "Doctrina", SourceFiles: []string{s2Rel}},
		},
		Edges: []GraphEdge{
			{Source: "concepto-a", Target: "concepto-b", Label: "prerrequisito_de", Score: 0.9},
			{Source: "concepto-b", Target: "concepto-a", Label: "prerrequisito_de", Score: 0.9}, // Ciclo circular!
			{Source: "concepto-inexistente", Target: "concepto-c", Label: "prerrequisito_de", Score: 0.9}, // Prerrequisito ausente!
		},
	}
	SaveGlobalGraph(tmpDir, gGlobal)

	report, err := GetCurriculumLintReport(tmpDir)
	if err != nil {
		t.Fatalf("Error ejecutando linter: %v", err)
	}

	if report.ErrorCount < 2 {
		t.Errorf("Esperados al menos 2 errores (ciclo circular y prerrequisito ausente), obtenido %d", report.ErrorCount)
	}
	if len(report.CyclesDetected) == 0 {
		t.Errorf("Esperado al menos 1 ciclo circular detectado, obtenido 0")
	}
	if report.WarningCount == 0 {
		t.Errorf("Esperado al menos 1 warning de uso prematuro, obtenido 0")
	}
	if report.HealthScore >= 100 {
		t.Errorf("Esperado HealthScore reducido debido a errores, obtenido %d", report.HealthScore)
	}

	t.Logf("✅ Diagnósticos del Linter correctamente capturados: %d errores, %d warnings. Score: %d%%",
		report.ErrorCount, report.WarningCount, report.HealthScore)
}
