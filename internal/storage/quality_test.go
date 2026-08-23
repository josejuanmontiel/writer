package storage

import (
	"encoding/base64"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCalculateSessionPacing(t *testing.T) {
	// Texto con ~260 palabras (2 min), 3 conceptos (7.5 min), 1 ficha alumno (8 min) y 1 taller (15 min)
	content := `= Sesión de Prueba
== Introducción
` + strings.Repeat("Palabra de explicación sobre la sesión de clase. ", 50) + `
[STUDENT]
.Preguntas
====
Responde a las preguntas.
====
[WORKSHOP]
.Dinámica
====
Actividad en grupo.
====
`

	report := CalculateSessionPacing(content, 3, 50)
	if report.WordCount < 200 {
		t.Errorf("WordCount esperado > 200, obtenido %d", report.WordCount)
	}
	if report.StudentActivitiesCount != 1 {
		t.Errorf("StudentActivitiesCount esperado 1, obtenido %d", report.StudentActivitiesCount)
	}
	if report.WorkshopCount != 1 {
		t.Errorf("WorkshopCount esperado 1, obtenido %d", report.WorkshopCount)
	}
	if report.TotalMinutes < 25 || report.TotalMinutes > 40 {
		t.Errorf("TotalMinutes esperado ~32 min, obtenido %d", report.TotalMinutes)
	}
}

func TestExtractCompendiumGlossaryAndResources(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "compendium-quality-test-*")
	if err != nil {
		t.Fatalf("Error creando tmpDir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	s1Dir := filepath.Join(tmpDir, "content", "modulo-1")
	os.MkdirAll(s1Dir, 0755)

	s1Content := `= Sesión 1: Iniciación Cristiana

Bautismo:: Primer sacramento que borra el pecado original y nos hace hijos de Dios.
Eucaristía:: Sacramento del Cuerpo y la Sangre de Cristo.

== Materiales Necesarios
[ ] 1 vela blanca para cada niño
[ ] Pila bautismal con agua bendita
[ ] Cartulinas de colores
`
	os.WriteFile(filepath.Join(s1Dir, "sesion-01.adoc"), []byte(s1Content), 0644)

	// 1. Probar Glosario
	glossary, err := ExtractCompendiumGlossary(tmpDir)
	if err != nil {
		t.Fatalf("Error extrayendo glosario: %v", err)
	}
	if glossary.TotalTerms < 2 {
		t.Errorf("Se esperaban al menos 2 términos de glosario, obtenidos: %d", glossary.TotalTerms)
	}

	glosarioPath, err := GenerateGlossaryAsciidoc(tmpDir)
	if err != nil {
		t.Fatalf("Error generando glosario.adoc: %v", err)
	}
	if !strings.HasSuffix(glosarioPath, "glosario.adoc") {
		t.Errorf("Ruta de glosario incorrecta: %s", glosarioPath)
	}

	// 2. Probar Inventario de Recursos
	resources, err := ExtractCompendiumResources(tmpDir)
	if err != nil {
		t.Fatalf("Error extrayendo recursos: %v", err)
	}
	if resources.TotalItems != 3 {
		t.Errorf("Se esperaban 3 materiales en la lista, obtenidos: %d", resources.TotalItems)
	}
}

func TestVoiceMemos(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "compendium-memos-test-*")
	if err != nil {
		t.Fatalf("Error creando tmpDir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dummyAudio := base64.StdEncoding.EncodeToString([]byte("RIFF1234WAVEfmt 1234data1234"))
	memo, err := SaveVoiceMemo(tmpDir, "content/modulo-1/sesion-01.adoc", dummyAudio, "Consejo sobre la vela")
	if err != nil {
		t.Fatalf("Error guardando memo de voz: %v", err)
	}

	memos, err := GetVoiceMemos(tmpDir, "content/modulo-1/sesion-01.adoc")
	if err != nil {
		t.Fatalf("Error leyendo memos: %v", err)
	}
	if len(memos) != 1 {
		t.Errorf("Se esperaba 1 memo de voz, obtenidos %d", len(memos))
	}

	// Probar eliminación
	err = DeleteVoiceMemo(tmpDir, memo.ID)
	if err != nil {
		t.Fatalf("Error eliminando memo: %v", err)
	}
	memosAfter, _ := GetVoiceMemos(tmpDir, "")
	if len(memosAfter) != 0 {
		t.Errorf("Se esperaba 0 memos tras eliminar, obtenidos %d", len(memosAfter))
	}
}
