package storage

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// StructuredSessionDraft representa el borrador de una lección estructurado automáticamente a partir de un volcado de voz
type StructuredSessionDraft struct {
	Title             string   `json:"title"`
	Objective         string   `json:"objective"`
	TheoryContent     string   `json:"theory_content"`
	KeyConcepts       []string `json:"key_concepts"`
	StudentQuestions  []string `json:"student_questions"`
	WorkshopDynamics  string   `json:"workshop_dynamics"`
	ResourcesList     []string `json:"resources_list"`
	Commitment        string   `json:"commitment"`
	AudioRelPath      string   `json:"audio_rel_path,omitempty"`
	GeneratedAsciidoc string   `json:"generated_asciidoc"`
}

// StructureTranscription clasifica el dictado libre o braindump verbal de un docente en secciones pedagógicas
func StructureTranscription(rawTranscript, sessionTitle, audioRelPath string) *StructuredSessionDraft {
	if sessionTitle == "" {
		sessionTitle = "Nueva Sesión de Catequesis / Clase"
	}

	clean := strings.TrimSpace(rawTranscript)
	paragraphs := strings.Split(clean, "\n")
	var nonBlank []string
	for _, p := range paragraphs {
		t := strings.TrimSpace(p)
		if len(t) > 0 {
			nonBlank = append(nonBlank, t)
		}
	}

	// Si el texto viene en un solo bloque continuo, dividir por frases
	if len(nonBlank) <= 1 && len(clean) > 0 {
		rawSentences := regexp.MustCompile(`[.!?]+\s+`).Split(clean, -1)
		nonBlank = nil
		for _, s := range rawSentences {
			t := strings.TrimSpace(s)
			if len(t) > 5 {
				nonBlank = append(nonBlank, t+".")
			}
		}
	}

	var objectiveParts []string
	var theoryParts []string
	var studentQuestions []string
	var workshopParts []string
	var resources []string
	var commitmentParts []string

	// Patrones de reconocimiento semántico del discurso del formador
	reObjective := regexp.MustCompile(`(?i)(hoy vamos a|el objetivo de|queremos explicar|la meta de|en este tema vamos|vamos a hablar de|aprenderemos)`)
	reWorkshop := regexp.MustCompile(`(?i)(para la actividad|la din[áa]mica consiste|haremos un taller|en grupos vamos|un juego|repartiremos|los ni[ñn]os dibujar[áa]n|experimento)`)
	reQuestion := regexp.MustCompile(`(?i)(\?|preguntaremos|para reflexionar|qu[ée] significa|c[óo]mo podemos|qu[ée] har[íi]as|responder en la ficha)`)
	reMaterial := regexp.MustCompile(`(?i)(necesitamos|materiales|traer|cartulina|vela|agua|biblia|proyector|rotuladores|l[áa]piz|fotocopias|impreso)`)
	reCommitment := regexp.MustCompile(`(?i)(compromiso|esta semana vamos a|para casa|tarea|rezar en familia|prop[óo]sito)`)

	for _, p := range nonBlank {
		lower := strings.ToLower(p)

		if reObjective.MatchString(lower) && len(objectiveParts) == 0 {
			objectiveParts = append(objectiveParts, p)
		} else if reMaterial.MatchString(lower) {
			// Extraer posibles elementos de la frase
			resources = append(resources, p)
		} else if reWorkshop.MatchString(lower) {
			workshopParts = append(workshopParts, p)
		} else if reQuestion.MatchString(lower) || strings.Contains(p, "?") {
			studentQuestions = append(studentQuestions, p)
		} else if reCommitment.MatchString(lower) {
			commitmentParts = append(commitmentParts, p)
		} else {
			theoryParts = append(theoryParts, p)
		}
	}

	// Valores por defecto inteligentes si la transcripción no contenía todos los apartados
	objective := strings.Join(objectiveParts, " ")
	if objective == "" {
		objective = fmt.Sprintf("Comprender los fundamentos y el significado de %s para la vida cristiana.", sessionTitle)
	}

	theory := strings.Join(theoryParts, "\n\n")
	if theory == "" {
		theory = clean
	}

	if len(studentQuestions) == 0 {
		studentQuestions = []string{
			"¿Qué es lo más importante que has aprendido hoy sobre este tema?",
			"¿Cómo puedes explicarle este sacramento o enseñanza a un amigo?",
		}
	}

	workshop := strings.Join(workshopParts, "\n\n")
	if workshop == "" {
		workshop = "Realizar una puesta en común en grupos pequeños y elaborar un mural con los símbolos explicados."
	}

	commitment := strings.Join(commitmentParts, " ")
	if commitment == "" {
		commitment = "Recordar lo aprendido durante la semana y compartir una oración en familia."
	}

	// Extraer conceptos clave detectados en la teoría
	keyConcepts := extractKeyPhrases(theory)

	// Construir documento AsciiDoc profesional completo
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("= %s\n", sessionTitle))
	sb.WriteString(":doctype: book\n:icons: font\n\n")

	if audioRelPath != "" {
		sb.WriteString(fmt.Sprintf("audio::%s[title=\"🎙️ Grabación y Explicación Oral del Formador\", opts=\"controls\"]\n\n", audioRelPath))
	}

	sb.WriteString(fmt.Sprintf("== 🎯 Objetivo de la Sesión\n%s\n\n", objective))

	sb.WriteString("== 📖 Desarrollo Teórico & Doctrinal\n")
	sb.WriteString(theory + "\n\n")

	if len(resources) > 0 {
		sb.WriteString("== 🛒 Materiales y Recursos Necesarios\n")
		for _, r := range resources {
			sb.WriteString(fmt.Sprintf("[ ] %s\n", r))
		}
		sb.WriteString("\n")
	}

	sb.WriteString("[STUDENT]\n.🧑‍🎓 Ficha de Trabajo y Preguntas de Reflexión\n====\n")
	for idx, q := range studentQuestions {
		sb.WriteString(fmt.Sprintf("%d. %s\n", idx+1, q))
	}
	sb.WriteString(fmt.Sprintf("\n*Compromiso Semanal*: %s\n", commitment))
	sb.WriteString("====\n\n")

	sb.WriteString("[WORKSHOP]\n.🛠️ Dinámica y Taller Práctico\n====\n")
	sb.WriteString(workshop + "\n")
	sb.WriteString("====\n")

	return &StructuredSessionDraft{
		Title:             sessionTitle,
		Objective:         objective,
		TheoryContent:     theory,
		KeyConcepts:       keyConcepts,
		StudentQuestions:  studentQuestions,
		WorkshopDynamics:  workshop,
		ResourcesList:     resources,
		Commitment:        commitment,
		AudioRelPath:      audioRelPath,
		GeneratedAsciidoc: sb.String(),
	}
}

// SaveSessionAudioResource guarda una grabación de sesión completa en assets/audio/
func SaveSessionAudioResource(targetDir, sessionSlug, filename, audioBase64 string) (*AssetInfo, error) {
	if sessionSlug == "" {
		sessionSlug = "general"
	}
	subFolder := filepath.Join("audio", sessionSlug)
	return SaveAsset(targetDir, subFolder, filename, audioBase64)
}

// SaveVoiceStructuredSession persiste la nueva lección generada y su audio en el compendio
func SaveVoiceStructuredSession(targetDir, moduleSlug, sessionSlug, title, content, audioRelPath string) (string, error) {
	if moduleSlug == "" {
		moduleSlug = "modulo-1"
	}
	if sessionSlug == "" {
		sessionSlug = fmt.Sprintf("sesion-%d", time.Now().Unix()%1000)
	}
	if !strings.HasSuffix(sessionSlug, ".adoc") {
		sessionSlug += ".adoc"
	}

	moduleDir := filepath.Join(targetDir, "content", moduleSlug)
	if err := os.MkdirAll(moduleDir, 0755); err != nil {
		return "", err
	}

	relPath := filepath.Join("content", moduleSlug, sessionSlug)
	fullPath := filepath.Join(targetDir, relPath)

	if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
		return "", err
	}

	return relPath, nil
}

func extractKeyPhrases(text string) []string {
	var concepts []string
	words := strings.Fields(text)
	for i := 0; i < len(words); i++ {
		w := strings.Trim(words[i], ".,;:()[]\"'")
		if len(w) > 4 && strings.ToUpper(w[:1]) == w[:1] && strings.ToLower(w) != "este" && strings.ToLower(w) != "esta" && strings.ToLower(w) != "para" {
			if !containsString(concepts, w) {
				concepts = append(concepts, w)
			}
		}
	}
	if len(concepts) > 6 {
		concepts = concepts[:6]
	}
	return concepts
}

func containsString(slice []string, val string) bool {
	for _, item := range slice {
		if strings.EqualFold(item, val) {
			return true
		}
	}
	return false
}
