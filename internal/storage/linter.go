package storage

import (
	"fmt"
	"path/filepath"
	"sort"
	"strings"
)

type DiagnosticSeverity string

const (
	SeverityError   DiagnosticSeverity = "error"
	SeverityWarning DiagnosticSeverity = "warning"
	SeverityInfo    DiagnosticSeverity = "info"
)

type DiagnosticCode string

const (
	CodeCircularDependency DiagnosticCode = "circular_dependency"
	CodeMissingPrereq      DiagnosticCode = "missing_prerequisite"
	CodePrematureUsage     DiagnosticCode = "premature_usage"
	CodeOrphanConcept      DiagnosticCode = "orphan_concept"
	CodeUnassignedReady    DiagnosticCode = "unassigned_ready"
	CodeUnassignedBlocked  DiagnosticCode = "unassigned_blocked"
)

// LintDiagnostic representa una observación o inconsistencia detectada por el linter curricular
type LintDiagnostic struct {
	ID           string             `json:"id"`
	Severity     DiagnosticSeverity `json:"severity"`
	Code         DiagnosticCode     `json:"code"`
	Title        string             `json:"title"`
	Description  string             `json:"description"`
	ConceptID    string             `json:"concept_id,omitempty"`
	ConceptLabel string             `json:"concept_label,omitempty"`
	SessionPath  string             `json:"session_path,omitempty"`
	SessionTitle string             `json:"session_title,omitempty"`
	SuggestedFix string             `json:"suggested_fix,omitempty"`
}

// CurriculumLintReport es el informe completo del validador de dependencias y coherencia curricular
type CurriculumLintReport struct {
	TotalConcepts  int              `json:"total_concepts"`
	TotalEdges     int              `json:"total_edges"`
	TotalSessions  int              `json:"total_sessions"`
	HealthScore    int              `json:"health_score"` // 0 a 100
	ErrorCount     int              `json:"error_count"`
	WarningCount   int              `json:"warning_count"`
	InfoCount      int              `json:"info_count"`
	Diagnostics    []LintDiagnostic `json:"diagnostics"`
	CyclesDetected [][]string       `json:"cycles_detected,omitempty"`
}

// GetCurriculumLintReport analiza todo el compendio y genera el informe de salud pedagógica y coherencia
func GetCurriculumLintReport(targetDir string) (*CurriculumLintReport, error) {
	globalGraph, err := LoadGlobalGraph(targetDir)
	if err != nil {
		return nil, fmt.Errorf("error cargando grafo global: %w", err)
	}

	orderedSessions, err := GetOrderedCourseSessions(targetDir)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo sesiones ordenadas: %w", err)
	}

	var diagnostics []LintDiagnostic
	diagIndex := 1

	addDiag := func(sev DiagnosticSeverity, code DiagnosticCode, title, desc, conceptID, conceptLabel, sessionPath, sessionTitle, fix string) {
		diagnostics = append(diagnostics, LintDiagnostic{
			ID:           fmt.Sprintf("diag-%03d", diagIndex),
			Severity:     sev,
			Code:         code,
			Title:        title,
			Description:  desc,
			ConceptID:    conceptID,
			ConceptLabel: conceptLabel,
			SessionPath:  sessionPath,
			SessionTitle: sessionTitle,
			SuggestedFix: fix,
		})
		diagIndex++
	}

	// 1. Mapeo de conceptos en sesiones del curso
	sessionGraphs := make(map[string]*ChapterGraph)
	sessionTitles := make(map[string]string)
	conceptIntroducedIn := make(map[string]string) // conceptID -> first session path
	conceptFirstSessionIdx := make(map[string]int) // conceptID -> session index
	courseConcepts := make(map[string]bool)

	for idx, sRel := range orderedSessions {
		chGraph, _ := LoadChapterGraph(targetDir, sRel)
		sessionGraphs[sRel] = chGraph

		sTitle := chGraph.Title
		if sTitle == "" {
			c, _ := ReadFile(targetDir, sRel)
			sTitle = ExtractDocumentTitle(c)
			if sTitle == "" {
				sTitle = filepath.Base(sRel)
			}
		}
		sessionTitles[sRel] = sTitle

		if chGraph != nil {
			for _, n := range chGraph.Nodes {
				courseConcepts[n.ID] = true
				if _, seen := conceptIntroducedIn[n.ID]; !seen {
					conceptIntroducedIn[n.ID] = sRel
					conceptFirstSessionIdx[n.ID] = idx
				}
			}
		}
	}

	// 2. Detección de Ciclos de Prerrequisitos (A -> B -> A)
	// Grafo dirigido de dependencias de prerrequisitos: Required -> Dependent
	prereqAdj := make(map[string][]string)
	isPrereqEdge := func(e GraphEdge) bool {
		lbl := strings.ToLower(e.Label)
		return strings.Contains(lbl, "prerrequisito") || strings.Contains(lbl, "requiere") || strings.Contains(lbl, "depende")
	}

	for _, edge := range globalGraph.Edges {
		if isPrereqEdge(edge) {
			prereqAdj[edge.Source] = append(prereqAdj[edge.Source], edge.Target)
		}
	}

	var cyclesDetected [][]string
	visited := make(map[string]int) // 0: unvisited, 1: visiting (in stack), 2: fully visited
	var pathStack []string

	var dfsCycle func(node string)
	dfsCycle = func(node string) {
		visited[node] = 1
		pathStack = append(pathStack, node)

		for _, neighbor := range prereqAdj[node] {
			if visited[neighbor] == 1 {
				// Ciclo encontrado!
				var cycle []string
				startIdx := -1
				for i, n := range pathStack {
					if n == neighbor {
						startIdx = i
						break
					}
				}
				if startIdx != -1 {
					cycle = append(cycle, pathStack[startIdx:]...)
					cycle = append(cycle, neighbor)
					cyclesDetected = append(cyclesDetected, cycle)

					cycleStr := strings.Join(cycle, " ➔ ")
					addDiag(
						SeverityError,
						CodeCircularDependency,
						"Dependencia Circular en Prerrequisitos",
						fmt.Sprintf("Se ha detectado un bucle cerrado de prerrequisitos: %s. Un concepto no puede ser causa y consecuencia de sí mismo.", cycleStr),
						node,
						node,
						conceptIntroducedIn[node],
						sessionTitles[conceptIntroducedIn[node]],
						"Revisa y elimina una de las relaciones 'prerrequisito_de' para romper el ciclo.",
					)
				}
			} else if visited[neighbor] == 0 {
				dfsCycle(neighbor)
			}
		}

		pathStack = pathStack[:len(pathStack)-1]
		visited[node] = 2
	}

	for _, n := range globalGraph.Nodes {
		if visited[n.ID] == 0 {
			dfsCycle(n.ID)
		}
	}

	// 3. Detección de Prerrequisitos Ausentes (Requeridos que nunca se imparten)
	nodeLabelMap := make(map[string]string)
	for _, n := range globalGraph.Nodes {
		nodeLabelMap[n.ID] = n.Label
	}

	for _, edge := range globalGraph.Edges {
		if isPrereqEdge(edge) {
			targetIsCourse := courseConcepts[edge.Target]
			sourceIsCourse := courseConcepts[edge.Source]

			if targetIsCourse && !sourceIsCourse {
				targetLabel := nodeLabelMap[edge.Target]
				sourceLabel := nodeLabelMap[edge.Source]
				if sourceLabel == "" {
					sourceLabel = edge.Source
				}
				sRel := conceptIntroducedIn[edge.Target]

				addDiag(
					SeverityError,
					CodeMissingPrereq,
					fmt.Sprintf("Prerrequisito Ausente: '%s'", sourceLabel),
					fmt.Sprintf("El concepto '%s' requiere '%s', pero este último no se explica en ninguna sesión del curso.", targetLabel, sourceLabel),
					edge.Target,
					targetLabel,
					sRel,
					sessionTitles[sRel],
					fmt.Sprintf("Añade una sesión previa donde se explique '%s' o crea una idea flotante para abordarlo.", sourceLabel),
				)
			}
		}
	}

	// 4. Detección de Uso Prematuro (Concepto introducido antes de su prerrequisito)
	for _, edge := range globalGraph.Edges {
		if isPrereqEdge(edge) {
			if courseConcepts[edge.Target] && courseConcepts[edge.Source] {
				srcIdx := conceptFirstSessionIdx[edge.Source]
				tgtIdx := conceptFirstSessionIdx[edge.Target]

				if tgtIdx < srcIdx {
					// Target se enseñó antes que Source (el requisito!)
					tgtLabel := nodeLabelMap[edge.Target]
					srcLabel := nodeLabelMap[edge.Source]
					tgtRel := orderedSessions[tgtIdx]
					srcRel := orderedSessions[srcIdx]

					addDiag(
						SeverityWarning,
						CodePrematureUsage,
						fmt.Sprintf("Uso Prematuro de '%s'", tgtLabel),
						fmt.Sprintf("'%s' se introduce en la Sesión #%d (%s), pero su prerrequisito '%s' se explica más tarde en la Sesión #%d (%s).",
							tgtLabel, tgtIdx+1, sessionTitles[tgtRel], srcLabel, srcIdx+1, sessionTitles[srcRel]),
						edge.Target,
						tgtLabel,
						tgtRel,
						sessionTitles[tgtRel],
						fmt.Sprintf("Mueve la sesión de '%s' antes de la sesión de '%s' o adelanta la explicación del concepto requerido.", srcLabel, tgtLabel),
					)
				}
			}
		}
	}

	// 5. Detección de Conceptos Huérfanos / Aislados
	edgeDegree := make(map[string]int)
	for _, edge := range globalGraph.Edges {
		edgeDegree[edge.Source]++
		edgeDegree[edge.Target]++
	}

	for _, n := range globalGraph.Nodes {
		if courseConcepts[n.ID] && edgeDegree[n.ID] == 0 {
			sRel := conceptIntroducedIn[n.ID]
			addDiag(
				SeverityInfo,
				CodeOrphanConcept,
				fmt.Sprintf("Concepto Aislado: '%s'", n.Label),
				fmt.Sprintf("El concepto '%s' (mencionado en %s) no tiene ninguna relación o dependencia registrada con otros conceptos del curso.", n.Label, sessionTitles[sRel]),
				n.ID,
				n.Label,
				sRel,
				sessionTitles[sRel],
				"Relaciona este concepto con otros temas mediante GLiNER2 o conecta manualmente aristas en el Grafo 2.0.",
			)
		}
	}

	// 6. Evaluación de Temas Flotantes (Staging)
	unassignedTopics, _ := GetUnassignedTopics(targetDir)
	for _, u := range unassignedTopics {
		if u.Readiness == "blocked" {
			addDiag(
				SeverityWarning,
				CodeUnassignedBlocked,
				fmt.Sprintf("Idea Flotante Bloqueada: '%s'", u.Title),
				fmt.Sprintf("La idea flotante '%s' no puede asignarse aún porque requiere prerrequisitos no cubiertos: %s.",
					u.Title, strings.Join(u.MissingPrerequisites, ", ")),
				"",
				u.Title,
				u.RelativePath,
				u.Title,
				"Escribe o asigna primero los conceptos prerrequisitos antes de programar esta lección.",
			)
		} else if u.Readiness == "ready" {
			addDiag(
				SeverityInfo,
				CodeUnassignedReady,
				fmt.Sprintf("Idea Flotante Lista para Asignar: '%s'", u.Title),
				fmt.Sprintf("La idea flotante '%s' tiene todos sus prerrequisitos impartidos (%s). Puedes ubicarla con el Asistente.",
					u.Title, strings.Join(u.CoveredPrerequisites, ", ")),
				"",
				u.Title,
				u.RelativePath,
				u.Title,
				"Abre el Asistente de Reubicación (icono brújula) para ubicar esta lección en el calendario.",
			)
		}
	}

	// 7. Conteo y Cálculo de Health Score
	errCount := 0
	warnCount := 0
	infoCount := 0

	for _, d := range diagnostics {
		switch d.Severity {
		case SeverityError:
			errCount++
		case SeverityWarning:
			warnCount++
		case SeverityInfo:
			infoCount++
		}
	}

	// Health score base 100
	healthScore := 100 - (errCount * 20) - (warnCount * 5)
	if healthScore < 0 {
		healthScore = 0
	}
	if len(globalGraph.Nodes) == 0 && len(orderedSessions) == 0 {
		healthScore = 100
	}

	// Ordenar diagnósticos por severidad (error -> warning -> info)
	sort.Slice(diagnostics, func(i, j int) bool {
		sevOrder := map[DiagnosticSeverity]int{
			SeverityError:   1,
			SeverityWarning: 2,
			SeverityInfo:    3,
		}
		if sevOrder[diagnostics[i].Severity] != sevOrder[diagnostics[j].Severity] {
			return sevOrder[diagnostics[i].Severity] < sevOrder[diagnostics[j].Severity]
		}
		return diagnostics[i].ID < diagnostics[j].ID
	})

	return &CurriculumLintReport{
		TotalConcepts:  len(globalGraph.Nodes),
		TotalEdges:     len(globalGraph.Edges),
		TotalSessions:  len(orderedSessions),
		HealthScore:    healthScore,
		ErrorCount:     errCount,
		WarningCount:   warnCount,
		InfoCount:      infoCount,
		Diagnostics:    diagnostics,
		CyclesDetected: cyclesDetected,
	}, nil
}
