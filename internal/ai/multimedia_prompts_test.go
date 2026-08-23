package ai

import (
	"testing"
)

func TestBuildVideoScriptPrompt(t *testing.T) {
	sys, user := BuildVideoScriptPrompt("Sesión 1: El Universo", "Contenido detallado sobre el origen del cosmos.", 15, "ameno y claro")
	if sys == "" || user == "" {
		t.Fatalf("Los prompts no deben estar vacíos")
	}
}

func TestParseScriptResponseJSON(t *testing.T) {
	sampleJSON := `
{
  "title": "Aventura en el Espacio",
  "estimated_total": "10:00",
  "hook": "Alguna vez miraste al cielo?",
  "sections": [
    {
      "timestamp": "00:00",
      "title": "Gancho Inicial",
      "speaker_notes": "Bienvenidos a todos...",
      "visual_cue": "Plano frontal",
      "slide_text": "El Cosmos"
    },
    {
      "timestamp": "02:30",
      "title": "Las Galaxias",
      "speaker_notes": "Existen millones...",
      "visual_cue": "Imágenes Hubble",
      "slide_text": "Tipos de galaxias"
    }
  ]
}`

	res, err := ParseScriptResponse(sampleJSON, "Default Title")
	if err != nil {
		t.Fatalf("Error parseando JSON: %v", err)
	}
	if len(res.Sections) != 2 {
		t.Errorf("Se esperaban 2 secciones, obtenido %d", len(res.Sections))
	}
	if res.Sections[0].Timestamp != "00:00" {
		t.Errorf("Timestamp inesperado: %s", res.Sections[0].Timestamp)
	}
}

func TestParseScriptResponseFallback(t *testing.T) {
	sampleText := `
00:00 - Introducción y Gancho
Hoy vamos a explorar los componentes principales del átomo.

03:15 - Protones y Neutrones
En el núcleo encontramos la mayor parte de la masa.

07:45 - Conclusión
No olviden repasar la ficha práctica.
`
	res, err := ParseScriptResponse(sampleText, "Física Básica")
	if err != nil {
		t.Fatalf("Error en fallback: %v", err)
	}
	if len(res.Sections) < 3 {
		t.Errorf("Se esperaban al menos 3 secciones, obtenido %d", len(res.Sections))
	}
}
