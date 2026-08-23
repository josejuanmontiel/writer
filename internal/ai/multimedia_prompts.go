package ai

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"antigravity-writer/internal/storage"
)

// BuildVideoScriptPrompt construye el prompt optimizado para escaletas de vídeo/YouTube
func BuildVideoScriptPrompt(sessionTitle, sessionContent string, durationMinutes int, tone string) (systemPrompt string, userPrompt string) {
	if durationMinutes <= 0 {
		durationMinutes = 10
	}
	if tone == "" {
		tone = "didáctico, dinámico y ameno"
	}

	systemPrompt = `Eres un guionista y productor audiovisual pedagógico de primer nivel especializado en YouTube educativo y formación digital.
Tu objetivo es transformar el contenido didáctico proporcionado en una escaleta de vídeo estructurada con marcas de tiempo, ganchos de retención, notas verbales y sugerencias visuales.

IMPORTANTE: Responde SIEMPRE en formato JSON válido con la siguiente estructura exacta:
{
  "title": "Título sugerido atractivo para el vídeo",
  "estimated_total": "ej. 10:00",
  "target_audience": "Público objetivo",
  "hook": "Gancho verbal y visual para los primeros 15-30 segundos",
  "call_to_action": "Llamada a la acción final",
  "sections": [
    {
      "timestamp": "00:00",
      "title": "1. Gancho & Bienvenida",
      "speaker_notes": "Texto o puntos clave que dice el presentador...",
      "visual_cue": "Plano frontal con infografía en pantalla",
      "slide_text": "Texto clave de diapositiva o título en pantalla"
    }
  ]
}`

	userPrompt = fmt.Sprintf(`Crea una escaleta de vídeo para una duración objetivo aproximada de %d minutos con tono %s.

TÍTULO DE LA SESIÓN:
%s

CONTENIDO BASE DE LA LECCIÓN:
%s

Genera la escaleta completa con timestamps correlativos respetando la estructura JSON solicitada.`, durationMinutes, tone, sessionTitle, sessionContent)

	return systemPrompt, userPrompt
}

// BuildCanvaSlidesPrompt construye el prompt para esquemas de diapositivas de Canva
func BuildCanvaSlidesPrompt(sessionTitle, sessionContent string) (systemPrompt string, userPrompt string) {
	systemPrompt = `Eres un diseñador instruccional y experto en presentaciones de alto impacto.
Tu objetivo es resumir la lección en una serie de diapositivas claras, visuales y pedagógicas listas para diseñar en Canva o PowerPoint.

Responde SIEMPRE en formato JSON con esta estructura:
{
  "title": "Título de la Presentación",
  "target_audience": "Audiencia",
  "sections": [
    {
      "timestamp": "Slide 1",
      "title": "Portada / Título de la Lección",
      "speaker_notes": "Notas del orador para introducir la diapositiva",
      "visual_cue": "Sugerencia visual (icono, foto, ilustración recomendada)",
      "slide_text": "Titular + 2-3 viñetas concisas"
    }
  ]
}`

	userPrompt = fmt.Sprintf(`Genera un esquema de diapositivas para Canva/Presentaciones a partir del siguiente contenido:

TÍTULO DE LA SESIÓN:
%s

CONTENIDO DE LA LECCIÓN:
%s`, sessionTitle, sessionContent)

	return systemPrompt, userPrompt
}

// BuildAudioCapsulePrompt construye el prompt para cápsulas de audio / podcast con Kokoro TTS
func BuildAudioCapsulePrompt(sessionTitle, sessionContent string, voiceStyle string) (systemPrompt string, userPrompt string) {
	if voiceStyle == "" {
		voiceStyle = "cercano, claro y motivador"
	}

	systemPrompt = `Eres un locutor profesional y redactor de podcasts educativos.
Transforma la lección en un guion de audio conversacional fluido (ideal para ser locutado por el profesor o sintetizado con un motor TTS como Kokoro).
El texto debe sonar natural al ser leído en voz alta, sin signos tipográficos extraños, con pausas marcadas y explicaciones directas.

Responde en formato JSON con la siguiente estructura:
{
  "title": "Cápsula de Audio: Título",
  "estimated_total": "ej. 05:00",
  "target_audience": "Oyentes",
  "hook": "Frase de apertura sonora",
  "call_to_action": "Pregunta de reflexión o compromiso final",
  "sections": [
    {
      "timestamp": "00:00",
      "title": "Apertura & Pregunta Clave",
      "speaker_notes": "Texto continuo para locución directa...",
      "visual_cue": "Tono de voz / música de fondo sugerida",
      "slide_text": "Concepto principal"
    }
  ]
}`

	userPrompt = fmt.Sprintf(`Genera el guion de locución para la cápsula de audio con estilo de voz %s:

TÍTULO DE LA SESIÓN:
%s

CONTENIDO DE LA LECCIÓN:
%s`, voiceStyle, sessionTitle, sessionContent)

	return systemPrompt, userPrompt
}

// ParseScriptResponse extrae y deserializa la respuesta JSON devuelta por el LLM o pegada desde el navegador
func ParseScriptResponse(raw string, defaultTitle string) (*storage.VideoScriptData, error) {
	clean := strings.TrimSpace(raw)

	// Extraer bloque ```json ... ``` si existe
	jsonRegex := regexp.MustCompile("(?s)```(?:json)?\\s*(\\{.*?\\})\\s*```")
	if matches := jsonRegex.FindStringSubmatch(clean); len(matches) > 1 {
		clean = matches[1]
	} else if start := strings.Index(clean, "{"); start != -1 {
		if end := strings.LastIndex(clean, "}"); end > start {
			clean = clean[start : end+1]
		}
	}

	var data storage.VideoScriptData
	if err := json.Unmarshal([]byte(clean), &data); err == nil && len(data.Sections) > 0 {
		if data.Title == "" {
			data.Title = defaultTitle
		}
		data.RawContent = raw
		return &data, nil
	}

	// Fallback inteligente: si no es JSON válido pero tiene texto estructurado con timestamps
	lines := strings.Split(raw, "\n")
	var sections []storage.ScriptSection
	currentSection := storage.ScriptSection{Timestamp: "00:00", Title: "Introducción"}
	notesAccumulator := []string{}

	timeRegex := regexp.MustCompile(`(?:\[?(\d{1,2}:\d{2})\]?|Slide\s*\d+)`)

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}

		if timeMatch := timeRegex.FindString(trimmed); timeMatch != "" {
			if len(notesAccumulator) > 0 {
				currentSection.SpeakerNotes = strings.Join(notesAccumulator, "\n")
				sections = append(sections, currentSection)
				notesAccumulator = nil
			}
			cleanTitle := strings.TrimPrefix(trimmed, timeMatch)
			cleanTitle = strings.TrimLeft(cleanTitle, " -:[]")
			if cleanTitle == "" {
				cleanTitle = "Bloque de contenido"
			}
			currentSection = storage.ScriptSection{
				Timestamp: timeMatch,
				Title:     cleanTitle,
			}
		} else {
			notesAccumulator = append(notesAccumulator, trimmed)
		}
	}

	if len(notesAccumulator) > 0 || currentSection.Title != "" {
		currentSection.SpeakerNotes = strings.Join(notesAccumulator, "\n")
		sections = append(sections, currentSection)
	}

	if len(sections) == 0 {
		sections = append(sections, storage.ScriptSection{
			Timestamp:    "00:00",
			Title:        "Contenido de la Sesión",
			SpeakerNotes: raw,
			VisualCue:    "Presentación general",
		})
	}

	return &storage.VideoScriptData{
		Title:          defaultTitle,
		EstimatedTotal: "10:00",
		Sections:       sections,
		RawContent:     raw,
	}, nil
}
