package storage

import (
	"fmt"
	"strings"
)

type AudienceRole string

const (
	AudienceMaster     AudienceRole = "master"     // Todo el contenido sin filtrar
	AudienceInstructor AudienceRole = "instructor" // Modo Profesor/Catequista (todas las notas didácticas y soluciones)
	AudienceStudent    AudienceRole = "student"    // Modo Alumno (oculta notas de profesor, muestra fichas y ejercicios)
	AudienceSimplified AudienceRole = "simplified" // Modo Niños / Fácil Lectura (lenguaje adaptado)
	AudienceWorkshop   AudienceRole = "workshop"   // Modo Taller / Práctica (destaca dinámicas)
)

// FilterContentForAudience filtra un documento AsciiDoc o HTML según el rol de audiencia especificado
func FilterContentForAudience(content string, audience string) string {
	role := AudienceRole(strings.ToLower(strings.TrimSpace(audience)))
	if role == AudienceMaster || role == "" || role == "all" {
		return content
	}

	// 1. Filtrado para formato HTML (TipTap)
	if strings.Contains(content, "<div") || strings.Contains(content, "<p>") {
		return filterHtmlForAudience(content, role)
	}

	// 2. Filtrado para formato AsciiDoc / Markdown
	return filterAsciidocForAudience(content, role)
}

// filterAsciidocForAudience filtra bloques condicionales en AsciiDoc
func filterAsciidocForAudience(content string, role AudienceRole) string {
	lines := strings.Split(content, "\n")
	var result []string

	inBlock := false
	blockType := ""
	delimCount := 0
	var currentBlockLines []string

	isAdmonitionHeader := func(line string) (bool, string) {
		trimmed := strings.TrimSpace(line)
		trimmedLower := strings.ToLower(trimmed)

		if strings.HasPrefix(trimmedLower, "[instructor]") || strings.HasPrefix(trimmedLower, "[note.instructor]") {
			return true, "instructor"
		}
		if strings.HasPrefix(trimmedLower, "[student]") || strings.HasPrefix(trimmedLower, "[note.student]") || strings.HasPrefix(trimmedLower, "[alumno]") {
			return true, "student"
		}
		if strings.HasPrefix(trimmedLower, "[workshop]") || strings.HasPrefix(trimmedLower, "[note.workshop]") || strings.HasPrefix(trimmedLower, "[taller]") {
			return true, "workshop"
		}
		if strings.HasPrefix(trimmedLower, "[simplified]") || strings.HasPrefix(trimmedLower, "[note.simplified]") || strings.HasPrefix(trimmedLower, "[infantil]") {
			return true, "simplified"
		}
		return false, ""
	}

	shouldIncludeBlock := func(bType string, targetRole AudienceRole) bool {
		switch targetRole {
		case AudienceInstructor:
			return true // El profesor ve todos los bloques
		case AudienceStudent:
			return bType != "instructor"
		case AudienceSimplified:
			return bType == "simplified" || bType == "student"
		case AudienceWorkshop:
			return bType == "workshop" || bType == "student"
		default:
			return true
		}
	}

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		if !inBlock {
			isAdm, bType := isAdmonitionHeader(line)
			if isAdm {
				inBlock = true
				blockType = bType
				delimCount = 0
				currentBlockLines = []string{line}
				continue
			} else {
				result = append(result, line)
			}
		} else {
			currentBlockLines = append(currentBlockLines, line)
			if trimmed == "====" {
				delimCount++
				if delimCount == 2 {
					// Fin del bloque condicional
					inBlock = false
					if shouldIncludeBlock(blockType, role) {
						result = append(result, currentBlockLines...)
					}
					currentBlockLines = nil
					delimCount = 0
				}
			}
		}
	}

	if inBlock && shouldIncludeBlock(blockType, role) {
		result = append(result, currentBlockLines...)
	}

	return strings.Join(result, "\n")
}

// filterHtmlForAudience filtra bloques HTML con data-admonition en TipTap considerando etiquetas anidadas
func filterHtmlForAudience(htmlContent string, role AudienceRole) string {
	if role == AudienceInstructor || role == AudienceMaster {
		return htmlContent
	}

	// Buscar bloques de instructor y eliminarlos con un escaneo balanceado de <div>
	lowerHtml := strings.ToLower(htmlContent)
	targetMarker := "admonition-instructor"

	var sb strings.Builder
	idx := 0

	for {
		foundPos := strings.Index(lowerHtml[idx:], targetMarker)
		if foundPos == -1 {
			sb.WriteString(htmlContent[idx:])
			break
		}

		actualFound := idx + foundPos
		// Buscar hacia atrás el inicio de <div class="...admonition-block
		blockStart := strings.LastIndex(htmlContent[:actualFound], "<div")
		if blockStart == -1 || blockStart < idx {
			blockStart = actualFound
		}

		sb.WriteString(htmlContent[idx:blockStart])

		// Buscar el cierre balanceado de este <div>
		divDepth := 0
		blockEnd := -1
		cur := blockStart

		for cur < len(htmlContent) {
			if strings.HasPrefix(htmlContent[cur:], "<div") {
				divDepth++
				cur += 4
			} else if strings.HasPrefix(htmlContent[cur:], "</div>") {
				divDepth--
				cur += 6
				if divDepth == 0 {
					blockEnd = cur
					break
				}
			} else {
				cur++
			}
		}

		if blockEnd != -1 {
			idx = blockEnd
		} else {
			idx = actualFound + len(targetMarker)
		}
	}

	return sb.String()
}

// extractKeyIdeasForStudent limpia encabezados y bloques de profesor para la ficha del alumno
func extractKeyIdeasForStudent(content string) string {
	// Primero filtramos los bloques de profesor
	cleaned := filterAsciidocForAudience(content, AudienceStudent)

	lines := strings.Split(cleaned, "\n")
	var body []string
	isHeader := true

	for _, l := range lines {
		trimmed := strings.TrimSpace(l)
		if isHeader && (strings.HasPrefix(trimmed, "=") || strings.HasPrefix(trimmed, ":")) {
			continue
		}
		isHeader = false
		body = append(body, l)
	}

	res := strings.TrimSpace(strings.Join(body, "\n"))
	if res == "" {
		res = "Desarrollo de la lección adaptada para la lectura y trabajo en clase."
	}
	return res
}

// DeriveStudentWorksheet genera automáticamente una ficha didáctica del alumno a partir de una lección maestra
func DeriveStudentWorksheet(masterContent string, lessonTitle string) string {
	title := lessonTitle
	if title == "" {
		title = ExtractDocumentTitle(masterContent)
		if title == "" {
			title = "Ficha Didáctica de Trabajo"
		}
	}

	return fmt.Sprintf(`= 📝 Ficha del Alumno: %s
:type: student_worksheet
:date: auto

[STUDENT]
.🎯 Objetivos de la Clase
====
* Comprender las ideas principales explicadas en la sesión.
* Descubrir la aplicación práctica en mi vida diaria.
====

== 📖 Lectura y Reflexión

%s

[STUDENT]
.✍️ Preguntas de Comprensión y Actividad
====
1. ¿Qué es lo más importante que has aprendido en el tema de hoy?
2. ¿Cómo explicarías esta lección con tus propias palabras a un compañero?
3. Escribe un compromiso concreto para poner en práctica esta semana.
====

[STUDENT]
.🌟 Mi Compromiso Semanal
====
[ ] Esta semana voy a...
====
`, title, extractKeyIdeasForStudent(masterContent))
}

// DeriveSimplifiedVersion genera una versión en lectura fácil / catequesis infantil
func DeriveSimplifiedVersion(masterContent string, lessonTitle string) string {
	title := lessonTitle
	if title == "" {
		title = ExtractDocumentTitle(masterContent)
		if title == "" {
			title = "Versión en Lenguaje Sencillo"
		}
	}

	return fmt.Sprintf(`= 🧒 %s (Lectura Fácil)
:type: simplified_lesson

[SIMPLIFIED]
.💡 Para entender en un minuto
====
* Dios nos quiere y nos acompaña siempre.
* Esta lección nos enseña a ser mejores con los demás.
====

== 🌟 La Historia de Hoy

%s

[SIMPLIFIED]
.🎨 Dinámica y Dibujo
====
Haz un dibujo que represente lo que más te ha gustado de la historia de hoy.
====
`, title, extractSimplifiedBody(masterContent))
}

func extractSimplifiedBody(content string) string {
	// Limpieza básica de metadatos
	lines := strings.Split(content, "\n")
	var body []string
	isHeader := true

	for _, l := range lines {
		trimmed := strings.TrimSpace(l)
		if isHeader && (strings.HasPrefix(trimmed, "=") || strings.HasPrefix(trimmed, ":")) {
			continue
		}
		isHeader = false
		if strings.HasPrefix(trimmed, "[") || strings.HasPrefix(trimmed, "=") {
			continue
		}
		if trimmed != "" {
			body = append(body, trimmed)
		}
		if len(body) >= 4 {
			break
		}
	}

	if len(body) == 0 {
		return "Hoy aprendemos una historia especial sobre el amor y la amistad con Dios."
	}
	return strings.Join(body, "\n\n")
}

