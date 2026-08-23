package storage

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
)

// -------------------------------------------------------------
// 1. Calculadora de Ritmo de Sesión (Pacing Calculator)
// -------------------------------------------------------------

type SessionPacingReport struct {
	WordCount                int     `json:"word_count"`
	ReadingMinutes           float64 `json:"reading_minutes"`
	ExplanationMinutes       float64 `json:"explanation_minutes"`
	StudentActivitiesCount   int     `json:"student_activities_count"`
	StudentActivitiesMinutes float64 `json:"student_activities_minutes"`
	WorkshopCount            int     `json:"workshop_count"`
	WorkshopMinutes          float64 `json:"workshop_minutes"`
	TotalMinutes             int     `json:"total_minutes"`
	TargetMinutes            int     `json:"target_minutes"` // e.g. 50 min
	PacingStatus             string  `json:"pacing_status"`  // "ideal", "short", "overloaded"
	PacingBadge              string  `json:"pacing_badge"`   // e.g. "Equilibrada (45-60 min)"
	Recommendation           string  `json:"recommendation"`
}

// CalculateSessionPacing analiza el contenido de una sesión y estima la duración real de clase
func CalculateSessionPacing(content string, conceptsCount int, targetMinutes int) *SessionPacingReport {
	if targetMinutes <= 0 {
		targetMinutes = 50 // Estándar de catequesis y clase académica: 50 minutos
	}

	// 1. Limpieza de etiquetas HTML o AsciiDoc para contar palabras reales de lectura
	cleanText := stripTagsAndMarkup(content)
	words := len(strings.Fields(cleanText))

	// Velocidad promedio de lectura y exposición verbal: ~130 palabras por minuto
	readingMins := float64(words) / 130.0
	if readingMins < 1.0 && words > 0 {
		readingMins = 1.0
	}

	// Cada concepto clave nuevo requiere ~2.5 minutos de explicación magistral y ejemplos
	explanationMins := float64(conceptsCount) * 2.5

	// Contar bloques de actividad de estudiante [STUDENT]
	lower := strings.ToLower(content)
	studentCount := len(regexp.MustCompile(`\[student\]|admonition-student`).FindAllString(lower, -1))
	studentMins := float64(studentCount) * 8.0 // ~8 min por ficha/ejercicio

	// Contar talleres y dinámicas prácticas [WORKSHOP]
	workshopCount := len(regexp.MustCompile(`\[workshop\]|admonition-workshop`).FindAllString(lower, -1))
	workshopMins := float64(workshopCount) * 15.0 // ~15 min por dinámica activa

	totalEstMins := int(math.Round(readingMins + explanationMins + studentMins + workshopMins))
	if totalEstMins == 0 && words > 0 {
		totalEstMins = 5
	}

	status := "ideal"
	badge := "🟢 Equilibrada (45-60 min)"
	recommendation := "El ritmo de la sesión es óptimo para una clase estándar de 45 a 60 minutos con buena alternancia entre teoría y práctica."

	if totalEstMins < 30 {
		status = "short"
		badge = "🟡 Sesión Corta (<30 min)"
		recommendation = "La sesión es breve. Considera añadir una dinámica de grupo [WORKSHOP] o una ronda de preguntas [STUDENT] para profundizar."
	} else if totalEstMins > 65 {
		status = "overloaded"
		badge = "🔴 Sobrecargada (>65 min)"
		recommendation = "La sesión excede el tiempo de atención recomendado. Considera dividirla en dos sesiones o mover temas a una idea flotante."
	}

	return &SessionPacingReport{
		WordCount:                words,
		ReadingMinutes:           math.Round(readingMins*10) / 10,
		ExplanationMinutes:       math.Round(explanationMins*10) / 10,
		StudentActivitiesCount:   studentCount,
		StudentActivitiesMinutes: studentMins,
		WorkshopCount:            workshopCount,
		WorkshopMinutes:          workshopMins,
		TotalMinutes:             totalEstMins,
		TargetMinutes:            targetMinutes,
		PacingStatus:             status,
		PacingBadge:              badge,
		Recommendation:           recommendation,
	}
}

// -------------------------------------------------------------
// 2. Glosario de Términos y Vocabulario por Nivel
// -------------------------------------------------------------

type GlossaryEntry struct {
	ID                  string `json:"id"`
	Term                string `json:"term"`
	Definition          string `json:"definition"`
	IntroducedInSession string `json:"introduced_in_session"`
	IntroducedInTitle   string `json:"introduced_in_title"`
	Occurrences         int    `json:"occurrences"`
}

type CompendiumGlossary struct {
	Entries    []GlossaryEntry `json:"entries"`
	TotalTerms int             `json:"total_terms"`
}

// ExtractCompendiumGlossary extrae automáticamente los términos y definiciones de todo el curso
func ExtractCompendiumGlossary(targetDir string) (*CompendiumGlossary, error) {
	globalGraph, _ := LoadGlobalGraph(targetDir)
	occurrencesMap := make(map[string]int)
	if globalGraph != nil {
		for _, n := range globalGraph.Nodes {
			occurrencesMap[strings.ToLower(n.Label)] = n.Occurrences
		}
	}

	termMap := make(map[string]GlossaryEntry)
	orderedSessions, _ := GetOrderedCourseSessions(targetDir)

	// Patrones de definición:
	// 1. Término:: Definición (AsciiDoc Definition List)
	// 2. **Término**: Definición o [GLOSSARY]
	defListRegex := regexp.MustCompile(`(?m)^([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{3,40})::\s+(.+)$`)
	boldDefRegex := regexp.MustCompile(`\*\*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{3,40})\*\*:\s*([^.\n]+(?:\.[^.\n]+)?)`)

	for _, sRel := range orderedSessions {
		fullPath := filepath.Join(targetDir, sRel)
		contentBytes, err := os.ReadFile(fullPath)
		if err != nil {
			continue
		}
		content := string(contentBytes)
		sessionTitle := ExtractDocumentTitle(content)
		if sessionTitle == "" {
			sessionTitle = filepath.Base(sRel)
		}

		// Buscar listas de definición AsciiDoc
		matches1 := defListRegex.FindAllStringSubmatch(content, -1)
		for _, m := range matches1 {
			rawTerm := strings.TrimSpace(m[1])
			def := strings.TrimSpace(m[2])
			key := NormalizeConceptID(rawTerm)
			if key != "" && termMap[key].Term == "" {
				termMap[key] = GlossaryEntry{
					ID:                  key,
					Term:                rawTerm,
					Definition:          def,
					IntroducedInSession: sRel,
					IntroducedInTitle:   sessionTitle,
					Occurrences:         occurrencesMap[strings.ToLower(rawTerm)],
				}
			}
		}

		// Buscar definiciones en negrita
		matches2 := boldDefRegex.FindAllStringSubmatch(content, -1)
		for _, m := range matches2 {
			rawTerm := strings.TrimSpace(m[1])
			def := strings.TrimSpace(m[2])
			key := NormalizeConceptID(rawTerm)
			if key != "" && termMap[key].Term == "" && len(def) > 10 {
				termMap[key] = GlossaryEntry{
					ID:                  key,
					Term:                rawTerm,
					Definition:          def,
					IntroducedInSession: sRel,
					IntroducedInTitle:   sessionTitle,
					Occurrences:         occurrencesMap[strings.ToLower(rawTerm)],
				}
			}
		}
	}

	// Si no se encontraron definiciones explícitas, usar nodos del grafo global con descripción
	if globalGraph != nil {
		for _, n := range globalGraph.Nodes {
			key := n.ID
			if termMap[key].Term == "" && len(n.Label) > 2 {
				termMap[key] = GlossaryEntry{
					ID:                  key,
					Term:                n.Label,
					Definition:          fmt.Sprintf("Concepto clave de tipo %s introducido en el compendio.", n.Type),
					IntroducedInSession: n.FirstIntroducedIn,
					IntroducedInTitle:   n.FirstIntroducedIn,
					Occurrences:         n.Occurrences,
				}
			}
		}
	}

	var entries []GlossaryEntry
	for _, entry := range termMap {
		if entry.Occurrences == 0 {
			entry.Occurrences = 1
		}
		entries = append(entries, entry)
	}

	// Ordenar alfabéticamente
	sort.Slice(entries, func(i, j int) bool {
		return strings.ToLower(entries[i].Term) < strings.ToLower(entries[j].Term)
	})

	return &CompendiumGlossary{
		Entries:    entries,
		TotalTerms: len(entries),
	}, nil
}

// GenerateGlossaryAsciidoc genera el archivo content/glosario.adoc
func GenerateGlossaryAsciidoc(targetDir string) (string, error) {
	glossary, err := ExtractCompendiumGlossary(targetDir)
	if err != nil {
		return "", err
	}

	var sb strings.Builder
	sb.WriteString("= 📖 Glosario de Términos y Conceptos del Compendio\n")
	sb.WriteString(":type: glossary\n\n")
	sb.WriteString("Este glosario recopila los conceptos teológicos y técnicos esenciales introducidos a lo largo del curso.\n\n")

	currentLetter := ""
	for _, e := range glossary.Entries {
		firstLetter := strings.ToUpper(string([]rune(e.Term)[0]))
		if firstLetter != currentLetter {
			currentLetter = firstLetter
			sb.WriteString(fmt.Sprintf("== %s\n\n", currentLetter))
		}

		sb.WriteString(fmt.Sprintf("%s:: %s\n", e.Term, e.Definition))
		if e.IntroducedInSession != "" {
			sb.WriteString(fmt.Sprintf("*(Primera aparición: %s)*\n\n", e.IntroducedInTitle))
		} else {
			sb.WriteString("\n")
		}
	}

	outRelPath := "content/glosario.adoc"
	outFullPath := filepath.Join(targetDir, outRelPath)
	if err := os.WriteFile(outFullPath, []byte(sb.String()), 0644); err != nil {
		return "", err
	}

	return outRelPath, nil
}

// -------------------------------------------------------------
// 3. Matriz de Recursos y Materiales (Shopping / Prep Checklist)
// -------------------------------------------------------------

type ResourceItem struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	SessionPath  string `json:"session_path"`
	SessionTitle string `json:"session_title"`
	Module       string `json:"module"`
	IsChecked    bool   `json:"is_checked"`
}

type ResourceMatrix struct {
	Items      []ResourceItem `json:"items"`
	TotalItems int            `json:"total_items"`
}

// ExtractCompendiumResources escanea todas las sesiones y compila el inventario de materiales necesarios
func ExtractCompendiumResources(targetDir string) (*ResourceMatrix, error) {
	orderedSessions, _ := GetOrderedCourseSessions(targetDir)
	var items []ResourceItem

	checklistRegex := regexp.MustCompile(`(?m)^\s*\[\s*\]\s+(.+)$`)

	for _, sRel := range orderedSessions {
		fullPath := filepath.Join(targetDir, sRel)
		contentBytes, err := os.ReadFile(fullPath)
		if err != nil {
			continue
		}
		content := string(contentBytes)
		sessionTitle := ExtractDocumentTitle(content)
		if sessionTitle == "" {
			sessionTitle = filepath.Base(sRel)
		}

		modSlug := ""
		parts := strings.Split(sRel, "/")
		if len(parts) >= 2 {
			modSlug = parts[1]
		}

		matches := checklistRegex.FindAllStringSubmatch(content, -1)
		for _, m := range matches {
			rawName := strings.TrimSpace(m[1])
			if len(rawName) > 2 {
				items = append(items, ResourceItem{
					ID:           fmt.Sprintf("%s-%s", NormalizeConceptID(sRel), NormalizeConceptID(rawName)),
					Name:         rawName,
					SessionPath:  sRel,
					SessionTitle: sessionTitle,
					Module:       modSlug,
					IsChecked:    false,
				})
			}
		}
	}

	return &ResourceMatrix{
		Items:      items,
		TotalItems: len(items),
	}, nil
}

// -------------------------------------------------------------
// 4. Notas de Voz al Margen (Voice Memos por Sección)
// -------------------------------------------------------------

type VoiceMemo struct {
	ID              string  `json:"id"`
	SessionPath     string  `json:"session_path"`
	Title           string  `json:"title"`
	CreatedAt       string  `json:"created_at"`
	AudioRelPath    string  `json:"audio_rel_path"`
	DurationSeconds float64 `json:"duration_seconds"`
}

// SaveVoiceMemo guarda un archivo de audio (.wav) y registra el memo en .writer/memos/
func SaveVoiceMemo(targetDir, sessionRelPath, audioBase64, title string) (*VoiceMemo, error) {
	if title == "" {
		title = fmt.Sprintf("Consejo de clase %s", time.Now().Format("02/01 15:04"))
	}

	audioData, err := base64.StdEncoding.DecodeString(audioBase64)
	if err != nil {
		return nil, fmt.Errorf("error decodificando audio base64: %w", err)
	}

	memosDir := filepath.Join(targetDir, ".writer", "memos")
	if err := os.MkdirAll(memosDir, 0755); err != nil {
		return nil, err
	}

	memoID := fmt.Sprintf("memo-%d", time.Now().UnixNano())
	wavFileName := fmt.Sprintf("%s.wav", memoID)
	wavFullPath := filepath.Join(memosDir, wavFileName)

	if err := os.WriteFile(wavFullPath, audioData, 0644); err != nil {
		return nil, err
	}

	memo := VoiceMemo{
		ID:              memoID,
		SessionPath:     sessionRelPath,
		Title:           title,
		CreatedAt:       time.Now().Format("2006-01-02 15:04:05"),
		AudioRelPath:    filepath.Join(".writer", "memos", wavFileName),
		DurationSeconds: float64(len(audioData)) / 32000.0, // Estimación aproximada para 16kHz 16bit mono
	}

	// Guardar índice de memos
	memosList, _ := GetVoiceMemos(targetDir, "")
	memosList = append(memosList, memo)

	idxBytes, _ := json.MarshalIndent(memosList, "", "  ")
	os.WriteFile(filepath.Join(memosDir, "index.json"), idxBytes, 0644)

	return &memo, nil
}

// GetVoiceMemos obtiene la lista de notas de voz registradas para una sesión o para todo el compendio
func GetVoiceMemos(targetDir, sessionRelPath string) ([]VoiceMemo, error) {
	indexPath := filepath.Join(targetDir, ".writer", "memos", "index.json")
	bytes, err := os.ReadFile(indexPath)
	if err != nil {
		return []VoiceMemo{}, nil
	}

	var allMemos []VoiceMemo
	if err := json.Unmarshal(bytes, &allMemos); err != nil {
		return []VoiceMemo{}, nil
	}

	if sessionRelPath == "" {
		return allMemos, nil
	}

	var filtered []VoiceMemo
	for _, m := range allMemos {
		if m.SessionPath == sessionRelPath {
			filtered = append(filtered, m)
		}
	}
	return filtered, nil
}

// DeleteVoiceMemo elimina una nota de voz del compendio
func DeleteVoiceMemo(targetDir, memoID string) error {
	memosDir := filepath.Join(targetDir, ".writer", "memos")
	indexPath := filepath.Join(memosDir, "index.json")

	allMemos, err := GetVoiceMemos(targetDir, "")
	if err != nil {
		return err
	}

	var remaining []VoiceMemo
	for _, m := range allMemos {
		if m.ID == memoID {
			os.Remove(filepath.Join(targetDir, m.AudioRelPath))
		} else {
			remaining = append(remaining, m)
		}
	}

	idxBytes, _ := json.MarshalIndent(remaining, "", "  ")
	return os.WriteFile(indexPath, idxBytes, 0644)
}

// GetVoiceMemoAudio lee el archivo .wav y devuelve el contenido en base64 para reproducir en el navegador
func GetVoiceMemoAudio(targetDir, audioRelPath string) (string, error) {
	fullPath := filepath.Join(targetDir, filepath.Clean(audioRelPath))
	data, err := os.ReadFile(fullPath)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(data), nil
}


func stripTagsAndMarkup(input string) string {
	// Eliminar etiquetas HTML
	tagRegex := regexp.MustCompile(`<[^>]*>`)
	clean := tagRegex.ReplaceAllString(input, " ")

	// Eliminar directivas AsciiDoc
	adRegex := regexp.MustCompile(`(?m)^\[.*?\]$|^==+.*$|^:.*$`)
	clean = adRegex.ReplaceAllString(clean, " ")

	return clean
}
