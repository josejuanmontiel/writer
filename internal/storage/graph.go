package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
	"unicode"

	"antigravity-writer/internal/git"
	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

const (
	GraphsDir = ".writer/graphs"
)

// GraphNode representa una entidad conceptual en el grafo curricular
type GraphNode struct {
	ID                string   `json:"id"`
	Label             string   `json:"label"`
	Type              string   `json:"type"` // e.g. "Sacramento", "Doctrina", "Biblia", "Concepto", "Moral", "Liturgia", "Item"
	SourceFiles       []string `json:"source_files"`
	Occurrences       int      `json:"occurrences"`
	FirstIntroducedIn string   `json:"first_introduced_in,omitempty"`
	IsUnassigned      bool     `json:"is_unassigned"`
	X                 float64  `json:"x,omitempty"`
	Y                 float64  `json:"y,omitempty"`
}

// GraphEdge representa una relación pedagógica o conceptual entre dos nodos
type GraphEdge struct {
	ID           string   `json:"id"`
	Source       string   `json:"source"`
	Target       string   `json:"target"`
	Label        string   `json:"label"` // e.g. "prerrequisito_de", "profundiza_en", "contiene", "requiere", "relacionado_con", "fundado_en"
	Score        float32  `json:"score"`
	SourceFiles  []string `json:"source_files"`
	IsUnassigned bool     `json:"is_unassigned"`
}

// GraphData almacena el grafo consolidado (global o de staging)
type GraphData struct {
	Version   string      `json:"version"`
	UpdatedAt time.Time   `json:"updated_at"`
	Nodes     []GraphNode `json:"nodes"`
	Edges     []GraphEdge `json:"edges"`
}

// ChapterGraph almacena el grafo local de un capítulo o tema específico
type ChapterGraph struct {
	RelativePath string      `json:"relative_path"`
	Title        string      `json:"title"`
	Nodes        []GraphNode `json:"nodes"`
	Edges        []GraphEdge `json:"edges"`
	ExtractedAt  time.Time   `json:"extracted_at"`
}

// ContextSuggestions provee conceptos y relaciones previos para autocompletado pedagógico
type ContextSuggestions struct {
	PreviousConcepts        []GraphNode `json:"previous_concepts"`
	GlobalConcepts          []GraphNode `json:"global_concepts"`
	PrerequisiteSuggestions []GraphEdge `json:"prerequisite_suggestions"`
}

// UnassignedTopicInfo describe un tema o lección flotante en la bandeja de staging con su estado de madurez
type UnassignedTopicInfo struct {
	RelativePath         string      `json:"relative_path"`
	Title                string      `json:"title"`
	Summary              string      `json:"summary,omitempty"`
	Nodes                []GraphNode `json:"nodes"`
	Edges                []GraphEdge `json:"edges"`
	Readiness            string      `json:"readiness"` // "ready" (🟢), "blocked" (🟡), "root" (🟣)
	ReadinessReason      string      `json:"readiness_reason"`
	MissingPrerequisites []string    `json:"missing_prerequisites,omitempty"`
	CoveredPrerequisites []string    `json:"covered_prerequisites,omitempty"`
	ModTime              time.Time   `json:"mod_time"`
}

// MatrixCell representa el estado de un concepto en una sesión concreta
type MatrixCell struct {
	Type   string `json:"type"` // "intro", "reinforce", "premature_warning", "empty"
	Detail string `json:"detail,omitempty"`
}

// MatrixSessionHeader representa una columna de sesión en la matriz de coherencia
type MatrixSessionHeader struct {
	RelPath string `json:"rel_path"`
	Title   string `json:"title"`
	Module  string `json:"module"`
	Order   int    `json:"order"`
}

// MatrixConceptRow representa una fila conceptual en la matriz de coherencia
type MatrixConceptRow struct {
	ID            string                `json:"id"`
	Label         string                `json:"label"`
	Type          string                `json:"type"`
	IntroducedIn  string                `json:"introduced_in"`
	Occurrences   int                   `json:"occurrences"`
	Cells         map[string]MatrixCell `json:"cells"` // key = session rel_path
	WarningsCount int                   `json:"warnings_count"`
}

// CurriculumMatrix almacena la matriz completa de coherencia curricular
type CurriculumMatrix struct {
	Sessions      []MatrixSessionHeader `json:"sessions"`
	Concepts      []MatrixConceptRow    `json:"concepts"`
	TotalWarnings int                   `json:"total_warnings"`
}

// PlacementSuggestion representa la recomendación pedagógica para ubicar un tema flotante
type PlacementSuggestion struct {
	TopicPath              string   `json:"topic_path"`
	TopicTitle             string   `json:"topic_title"`
	SuggestedModuleSlug    string   `json:"suggested_module_slug"`
	SuggestedModuleTitle   string   `json:"suggested_module_title"`
	SuggestedPosition      int      `json:"suggested_position"` // Índice de sesión en el módulo (1-indexed)
	SuggestedAfterSession  string   `json:"suggested_after_session,omitempty"`
	SuggestedBeforeSession string   `json:"suggested_before_session,omitempty"`
	PrerequisitesMet       []string `json:"prerequisites_met"`
	DependentSessions      []string `json:"dependent_sessions"`
	Reasoning              string   `json:"reasoning"`
	Confidence             float32  `json:"confidence"`
}

// NormalizeConceptID genera un identificador canónico limpio a partir de un texto (eliminando artículos, tildes y símbolos)
func NormalizeConceptID(text string) string {
	raw := strings.TrimSpace(text)
	if raw == "" {
		return ""
	}

	// Normalizar tildes / diacríticos
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	normalized, _, _ := transform.String(t, raw)
	normalized = strings.ToLower(normalized)

	// Eliminar artículos y determinantes comunes al inicio
	articles := []string{"el ", "la ", "los ", "las ", "un ", "una ", "unos ", "unas ", "del ", "al "}
	for _, art := range articles {
		if strings.HasPrefix(normalized, art) {
			normalized = strings.TrimPrefix(normalized, art)
			break
		}
	}

	// Reemplazar caracteres no alfanuméricos por guiones
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	slug := reg.ReplaceAllString(normalized, "-")
	slug = strings.Trim(slug, "-")

	if slug == "" {
		return "concepto"
	}
	return slug
}

// LoadGlobalGraph carga el grafo global acumulado de .writer/graph-global.json
func LoadGlobalGraph(targetDir string) (*GraphData, error) {
	graphPath := filepath.Join(targetDir, GraphGlobalFile)
	data, err := os.ReadFile(graphPath)
	if err != nil {
		if os.IsNotExist(err) {
			return &GraphData{
				Version:   "1.0",
				UpdatedAt: time.Now(),
				Nodes:     []GraphNode{},
				Edges:     []GraphEdge{},
			}, nil
		}
		return nil, fmt.Errorf("error leyendo grafo global: %w", err)
	}

	var graph GraphData
	if err := json.Unmarshal(data, &graph); err != nil {
		return nil, fmt.Errorf("error parseando grafo global: %w", err)
	}

	if graph.Nodes == nil {
		graph.Nodes = []GraphNode{}
	}
	if graph.Edges == nil {
		graph.Edges = []GraphEdge{}
	}

	return &graph, nil
}

// SaveGlobalGraph persiste el grafo global acumulado en .writer/graph-global.json
func SaveGlobalGraph(targetDir string, graph *GraphData) error {
	if graph == nil {
		return fmt.Errorf("grafo global no puede ser nulo")
	}

	graph.UpdatedAt = time.Now()
	if graph.Version == "" {
		graph.Version = "1.0"
	}

	graphPath := filepath.Join(targetDir, GraphGlobalFile)
	if err := os.MkdirAll(filepath.Dir(graphPath), 0755); err != nil {
		return fmt.Errorf("error creando directorio de grafo: %w", err)
	}

	data, err := json.MarshalIndent(graph, "", "  ")
	if err != nil {
		return fmt.Errorf("error serializando grafo global: %w", err)
	}

	return os.WriteFile(graphPath, data, 0644)
}

// getChapterGraphPath calcula la ruta del archivo JSON local del capítulo
func getChapterGraphPath(targetDir string, relativePath string) string {
	cleanRel := filepath.ToSlash(filepath.Clean(relativePath))
	safeName := strings.ReplaceAll(cleanRel, "/", "__")
	safeName = strings.TrimSuffix(safeName, filepath.Ext(safeName)) + ".json"
	return filepath.Join(targetDir, GraphsDir, safeName)
}

// LoadChapterGraph carga el grafo local de un archivo/capítulo específico
func LoadChapterGraph(targetDir string, relativePath string) (*ChapterGraph, error) {
	graphPath := getChapterGraphPath(targetDir, relativePath)
	data, err := os.ReadFile(graphPath)
	if err != nil {
		if os.IsNotExist(err) {
			return &ChapterGraph{
				RelativePath: filepath.ToSlash(relativePath),
				Nodes:        []GraphNode{},
				Edges:        []GraphEdge{},
				ExtractedAt:  time.Now(),
			}, nil
		}
		return nil, fmt.Errorf("error leyendo grafo de capítulo: %w", err)
	}

	var chGraph ChapterGraph
	if err := json.Unmarshal(data, &chGraph); err != nil {
		return nil, fmt.Errorf("error parseando grafo de capítulo: %w", err)
	}
	return &chGraph, nil
}

// SaveChapterGraph persiste el grafo local de un capítulo en .writer/graphs/
func SaveChapterGraph(targetDir string, chapterGraph *ChapterGraph) error {
	if chapterGraph == nil {
		return fmt.Errorf("grafo de capítulo no puede ser nulo")
	}

	chapterGraph.ExtractedAt = time.Now()
	graphPath := getChapterGraphPath(targetDir, chapterGraph.RelativePath)
	if err := os.MkdirAll(filepath.Dir(graphPath), 0755); err != nil {
		return fmt.Errorf("error creando directorio .writer/graphs: %w", err)
	}

	data, err := json.MarshalIndent(chapterGraph, "", "  ")
	if err != nil {
		return fmt.Errorf("error serializando grafo de capítulo: %w", err)
	}

	return os.WriteFile(graphPath, data, 0644)
}

// MergeChapterGraph fusiona el grafo local del capítulo en el grafo global acumulado,
// actualizando referencias, ocurrencias y conservando identificadores canónicos compartidos.
func MergeChapterGraph(global *GraphData, chapter *ChapterGraph) *GraphData {
	if global == nil {
		global = &GraphData{
			Version:   "1.0",
			UpdatedAt: time.Now(),
			Nodes:     []GraphNode{},
			Edges:     []GraphEdge{},
		}
	}

	cleanRelPath := filepath.ToSlash(filepath.Clean(chapter.RelativePath))
	isUnassignedFile := strings.HasPrefix(cleanRelPath, "content/unassigned/")

	// 1. Mapeo de nodos existentes en global
	nodeMap := make(map[string]GraphNode)
	for _, n := range global.Nodes {
		nodeMap[n.ID] = n
	}

	// 2. Limpiar la presencia previa de este archivo de todos los nodos globales
	for id, n := range nodeMap {
		var filteredSources []string
		for _, s := range n.SourceFiles {
			if s != cleanRelPath {
				filteredSources = append(filteredSources, s)
			}
		}
		n.SourceFiles = filteredSources
		n.Occurrences = len(filteredSources)
		if len(filteredSources) == 0 {
			delete(nodeMap, id)
		} else {
			// Si tiene otras fuentes, verificar si alguna es asignada
			hasAssigned := false
			for _, s := range n.SourceFiles {
				if !strings.HasPrefix(s, "content/unassigned/") {
					hasAssigned = true
					break
				}
			}
			n.IsUnassigned = !hasAssigned
			nodeMap[id] = n
		}
	}

	// 3. Incorporar / actualizar nodos del capítulo actual
	for _, chNode := range chapter.Nodes {
		id := chNode.ID
		if id == "" {
			id = NormalizeConceptID(chNode.Label)
		}
		if id == "" {
			continue
		}

		if existing, ok := nodeMap[id]; ok {
			// Ya existe: añadir archivo si no está
			found := false
			for _, s := range existing.SourceFiles {
				if s == cleanRelPath {
					found = true
					break
				}
			}
			if !found {
				existing.SourceFiles = append(existing.SourceFiles, cleanRelPath)
				existing.Occurrences = len(existing.SourceFiles)
			}
			if !isUnassignedFile {
				existing.IsUnassigned = false
				if existing.FirstIntroducedIn == "" || strings.HasPrefix(existing.FirstIntroducedIn, "content/unassigned/") {
					existing.FirstIntroducedIn = cleanRelPath
				}
			}
			if chNode.Type != "" && chNode.Type != "Item" && chNode.Type != "Concept" {
				existing.Type = chNode.Type
			}
			if existing.Label == "" || len(chNode.Label) > len(existing.Label) {
				existing.Label = chNode.Label
			}
			nodeMap[id] = existing
		} else {
			// Nuevo nodo
			newNode := GraphNode{
				ID:                id,
				Label:             chNode.Label,
				Type:              chNode.Type,
				SourceFiles:       []string{cleanRelPath},
				Occurrences:       1,
				FirstIntroducedIn: cleanRelPath,
				IsUnassigned:      isUnassignedFile,
				X:                 chNode.X,
				Y:                 chNode.Y,
			}
			if newNode.Label == "" {
				newNode.Label = id
			}
			if newNode.Type == "" {
				newNode.Type = "Concepto"
			}
			nodeMap[id] = newNode
		}
	}

	// 4. Mapeo y fusión de aristas
	edgeMap := make(map[string]GraphEdge)
	for _, e := range global.Edges {
		edgeMap[e.ID] = e
	}

	// Limpiar referencias previas de este archivo en aristas
	for id, e := range edgeMap {
		var filteredSources []string
		for _, s := range e.SourceFiles {
			if s != cleanRelPath {
				filteredSources = append(filteredSources, s)
			}
		}
		e.SourceFiles = filteredSources
		if len(filteredSources) == 0 {
			delete(edgeMap, id)
		} else {
			hasAssigned := false
			for _, s := range e.SourceFiles {
				if !strings.HasPrefix(s, "content/unassigned/") {
					hasAssigned = true
					break
				}
			}
			e.IsUnassigned = !hasAssigned
			edgeMap[id] = e
		}
	}

	// Incorporar aristas del capítulo
	for _, chEdge := range chapter.Edges {
		srcID := NormalizeConceptID(chEdge.Source)
		tgtID := NormalizeConceptID(chEdge.Target)
		if srcID == "" || tgtID == "" || srcID == tgtID {
			continue
		}

		edgeID := fmt.Sprintf("%s--%s-->%s", srcID, chEdge.Label, tgtID)
		if existing, ok := edgeMap[edgeID]; ok {
			found := false
			for _, s := range existing.SourceFiles {
				if s == cleanRelPath {
					found = true
					break
				}
			}
			if !found {
				existing.SourceFiles = append(existing.SourceFiles, cleanRelPath)
			}
			if !isUnassignedFile {
				existing.IsUnassigned = false
			}
			if chEdge.Score > existing.Score {
				existing.Score = chEdge.Score
			}
			edgeMap[edgeID] = existing
		} else {
			newEdge := GraphEdge{
				ID:           edgeID,
				Source:       srcID,
				Target:       tgtID,
				Label:        chEdge.Label,
				Score:        chEdge.Score,
				SourceFiles:  []string{cleanRelPath},
				IsUnassigned: isUnassignedFile,
			}
			if newEdge.Label == "" {
				newEdge.Label = "relacionado_con"
			}
			edgeMap[edgeID] = newEdge
		}
	}

	// Convertir mapas a listas ordenadas
	var finalNodes []GraphNode
	for _, n := range nodeMap {
		finalNodes = append(finalNodes, n)
	}
	sort.Slice(finalNodes, func(i, j int) bool {
		return finalNodes[i].ID < finalNodes[j].ID
	})

	var finalEdges []GraphEdge
	for _, e := range edgeMap {
		finalEdges = append(finalEdges, e)
	}
	sort.Slice(finalEdges, func(i, j int) bool {
		return finalEdges[i].ID < finalEdges[j].ID
	})

	global.Nodes = finalNodes
	global.Edges = finalEdges
	global.UpdatedAt = time.Now()

	return global
}

// RemoveFileFromGlobalGraph elimina las contribuciones de un archivo eliminado del grafo global
func RemoveFileFromGlobalGraph(global *GraphData, relativePath string) *GraphData {
	if global == nil {
		return nil
	}

	cleanRel := filepath.ToSlash(filepath.Clean(relativePath))

	var newNodes []GraphNode
	for _, n := range global.Nodes {
		var filtered []string
		for _, s := range n.SourceFiles {
			if s != cleanRel {
				filtered = append(filtered, s)
			}
		}
		if len(filtered) > 0 {
			n.SourceFiles = filtered
			n.Occurrences = len(filtered)
			hasAssigned := false
			for _, s := range filtered {
				if !strings.HasPrefix(s, "content/unassigned/") {
					hasAssigned = true
					break
				}
			}
			n.IsUnassigned = !hasAssigned
			newNodes = append(newNodes, n)
		}
	}

	var newEdges []GraphEdge
	for _, e := range global.Edges {
		var filtered []string
		for _, s := range e.SourceFiles {
			if s != cleanRel {
				filtered = append(filtered, s)
			}
		}
		if len(filtered) > 0 {
			e.SourceFiles = filtered
			hasAssigned := false
			for _, s := range filtered {
				if !strings.HasPrefix(s, "content/unassigned/") {
					hasAssigned = true
					break
				}
			}
			e.IsUnassigned = !hasAssigned
			newEdges = append(newEdges, e)
		}
	}

	global.Nodes = newNodes
	global.Edges = newEdges
	global.UpdatedAt = time.Now()
	return global
}

// GetOrderedCourseSessions devuelve la lista de sesiones estructuradas del curso ordenadas cronológicamente
func GetOrderedCourseSessions(targetDir string) ([]string, error) {
	contentDir := filepath.Join(targetDir, ContentDir)
	if _, err := os.Stat(contentDir); os.IsNotExist(err) {
		return []string{}, nil
	}

	entries, err := os.ReadDir(contentDir)
	if err != nil {
		return nil, fmt.Errorf("error leyendo carpeta content: %w", err)
	}

	var moduleDirs []string
	for _, e := range entries {
		if e.IsDir() && e.Name() != "journal" && e.Name() != "unassigned" && !strings.HasPrefix(e.Name(), ".") {
			moduleDirs = append(moduleDirs, e.Name())
		}
	}
	sort.Strings(moduleDirs)

	var orderedSessions []string
	for _, mod := range moduleDirs {
		modPath := filepath.Join(contentDir, mod)
		subEntries, err := os.ReadDir(modPath)
		if err != nil {
			continue
		}

		var sessionFiles []string
		for _, se := range subEntries {
			if !se.IsDir() && !strings.HasPrefix(se.Name(), "_index") && (strings.HasSuffix(se.Name(), ".adoc") || strings.HasSuffix(se.Name(), ".md")) {
				sessionFiles = append(sessionFiles, se.Name())
			}
		}
		sort.Strings(sessionFiles)

		for _, sf := range sessionFiles {
			orderedSessions = append(orderedSessions, filepath.ToSlash(filepath.Join(ContentDir, mod, sf)))
		}
	}

	return orderedSessions, nil
}

// GetContextSuggestions genera sugerencias contextuales al abrir un capítulo/tema:
// Devuelve conceptos previos aprendidos en sesiones anteriores, facilitando el autocompletado y evitando redundancias.
func GetContextSuggestions(targetDir string, currentFile string) (*ContextSuggestions, error) {
	globalGraph, err := LoadGlobalGraph(targetDir)
	if err != nil {
		return nil, err
	}

	cleanCurrent := filepath.ToSlash(filepath.Clean(currentFile))
	orderedSessions, err := GetOrderedCourseSessions(targetDir)
	if err != nil {
		return nil, err
	}

	// Encontrar índice del archivo actual en la secuencia del curso
	currentIndex := -1
	for idx, s := range orderedSessions {
		if s == cleanCurrent {
			currentIndex = idx
			break
		}
	}

	// Recolectar archivos previos
	var previousFiles map[string]bool = make(map[string]bool)
	if currentIndex > 0 {
		for i := 0; i < currentIndex; i++ {
			previousFiles[orderedSessions[i]] = true
		}
	} else if currentIndex == -1 && !strings.HasPrefix(cleanCurrent, "content/unassigned/") {
		// Si no se encuentra en orden específico, incluir todos los asignados excepto el actual
		for _, s := range orderedSessions {
			if s != cleanCurrent {
				previousFiles[s] = true
			}
		}
	}

	var previousConcepts []GraphNode
	var globalConcepts []GraphNode

	for _, node := range globalGraph.Nodes {
		globalConcepts = append(globalConcepts, node)

		isPrevious := false
		for _, src := range node.SourceFiles {
			if previousFiles[src] {
				isPrevious = true
				break
			}
		}
		if isPrevious {
			previousConcepts = append(previousConcepts, node)
		}
	}

	// Aristas de prerrequisitos o relaciones relevantes
	var prereqSuggestions []GraphEdge
	for _, edge := range globalGraph.Edges {
		if edge.Label == "prerrequisito_de" || edge.Label == "requiere" || edge.Label == "profundiza_en" {
			prereqSuggestions = append(prereqSuggestions, edge)
		}
	}

	return &ContextSuggestions{
		PreviousConcepts:        previousConcepts,
		GlobalConcepts:          globalConcepts,
		PrerequisiteSuggestions: prereqSuggestions,
	}, nil
}

// GetUnassignedTopics obtiene la lista de lecciones y reflexiones flotantes en content/unassigned/ calculando su semáforo de madurez
func GetUnassignedTopics(targetDir string) ([]UnassignedTopicInfo, error) {
	unassignedPath := filepath.Join(targetDir, UnassignedDir)
	if _, err := os.Stat(unassignedPath); os.IsNotExist(err) {
		return []UnassignedTopicInfo{}, nil
	}

	entries, err := os.ReadDir(unassignedPath)
	if err != nil {
		return nil, fmt.Errorf("error leyendo bandeja de temas flotantes: %w", err)
	}

	// Cargar todos los conceptos ya impartidos en las sesiones del curso
	globalGraph, _ := LoadGlobalGraph(targetDir)
	orderedSessions, _ := GetOrderedCourseSessions(targetDir)
	courseSessionsMap := make(map[string]bool)
	for _, s := range orderedSessions {
		courseSessionsMap[s] = true
	}

	courseConcepts := make(map[string]bool)
	for _, n := range globalGraph.Nodes {
		for _, sf := range n.SourceFiles {
			if courseSessionsMap[sf] {
				courseConcepts[n.ID] = true
				break
			}
		}
	}

	var topics []UnassignedTopicInfo
	for _, entry := range entries {
		if entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
			continue
		}
		if !strings.HasSuffix(entry.Name(), ".adoc") && !strings.HasSuffix(entry.Name(), ".md") {
			continue
		}

		relPath := filepath.ToSlash(filepath.Join(UnassignedDir, entry.Name()))
		content, err := ReadFile(targetDir, relPath)
		if err != nil {
			continue
		}

		info, _ := entry.Info()
		modTime := time.Now()
		if info != nil {
			modTime = info.ModTime()
		}

		title := ExtractDocumentTitle(content)
		if title == "" {
			title = strings.TrimSuffix(entry.Name(), filepath.Ext(entry.Name()))
		}

		chGraph, _ := LoadChapterGraph(targetDir, relPath)

		// Evaluar semáforo de madurez conceptual
		topicNodeIDs := make(map[string]bool)
		for _, n := range chGraph.Nodes {
			topicNodeIDs[n.ID] = true
		}

		var missingPrereqs []string
		var coveredPrereqs []string
		hasIncomingPrereqs := false

		for _, edge := range globalGraph.Edges {
			// Si la arista apunta a un nodo de este tema flotante
			if topicNodeIDs[edge.Target] && !topicNodeIDs[edge.Source] {
				hasIncomingPrereqs = true
				if courseConcepts[edge.Source] {
					coveredPrereqs = append(coveredPrereqs, edge.Source)
				} else {
					missingPrereqs = append(missingPrereqs, edge.Source)
				}
			}
		}

		readiness := "root"
		readinessReason := "Concepto introductorio / independiente (sin prerrequisitos previos)"
		if hasIncomingPrereqs {
			if len(missingPrereqs) == 0 {
				readiness = "ready"
				readinessReason = fmt.Sprintf("Listo para ubicar (%d prerrequisitos ya cubiertos en el curso)", len(coveredPrereqs))
			} else {
				readiness = "blocked"
				readinessReason = fmt.Sprintf("Requiere conceptos previos no impartidos: %s", strings.Join(missingPrereqs, ", "))
			}
		}

		topic := UnassignedTopicInfo{
			RelativePath:         relPath,
			Title:                title,
			Summary:              extractBriefSummary(content),
			Nodes:                chGraph.Nodes,
			Edges:                chGraph.Edges,
			Readiness:            readiness,
			ReadinessReason:      readinessReason,
			MissingPrerequisites: missingPrereqs,
			CoveredPrerequisites: coveredPrereqs,
			ModTime:              modTime,
		}
		topics = append(topics, topic)
	}

	sort.Slice(topics, func(i, j int) bool {
		return topics[i].ModTime.After(topics[j].ModTime)
	})

	return topics, nil
}

// CreateUnassignedTopic crea un nuevo borrador o tema flotante en content/unassigned/
func CreateUnassignedTopic(targetDir string, title string, initialContent string, authorName string, authorEmail string) (string, error) {
	if title == "" {
		title = "Tema Flotante Sin Título"
	}

	slug := NormalizeConceptID(title)
	if slug == "" {
		slug = fmt.Sprintf("tema-%d", time.Now().Unix())
	}

	relPath := filepath.ToSlash(filepath.Join(UnassignedDir, slug+".adoc"))
	fullPath := filepath.Join(targetDir, filepath.Clean(relPath))

	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return "", fmt.Errorf("error creando directorio unassigned: %w", err)
	}

	if initialContent == "" {
		initialContent = fmt.Sprintf("= %s\n:author: %s\n:date: %s\n:type: unassigned\n\n== 💡 Conceptos y Desarrollo\n\n",
			title, authorName, time.Now().Format("2006-01-02"))
	}

	if err := os.WriteFile(fullPath, []byte(initialContent), 0644); err != nil {
		return "", fmt.Errorf("error escribiendo tema flotante: %w", err)
	}

	git.CommitFiles(targetDir, []string{relPath}, fmt.Sprintf("Crear tema flotante: %s", title), authorName, authorEmail)

	return relPath, nil
}

// extractBriefSummary extrae las primeras líneas de desarrollo como resumen corto
func extractBriefSummary(content string) string {
	lines := strings.Split(content, "\n")
	var summaryParts []string
	for _, l := range lines {
		trimmed := strings.TrimSpace(l)
		if trimmed == "" || strings.HasPrefix(trimmed, "=") || strings.HasPrefix(trimmed, ":") || strings.HasPrefix(trimmed, "[") {
			continue
		}
		summaryParts = append(summaryParts, trimmed)
		if len(summaryParts) >= 2 {
			break
		}
	}
	return strings.Join(summaryParts, " ")
}

// AnalyzeUnassignedPlacement analiza las dependencias de un tema flotante frente a las sesiones estructuradas
// y sugiere su ubicación temporal ideal en el calendario del curso.
func AnalyzeUnassignedPlacement(targetDir string, topicRelPath string) (*PlacementSuggestion, error) {
	cleanRel := filepath.ToSlash(filepath.Clean(topicRelPath))
	topicGraph, err := LoadChapterGraph(targetDir, cleanRel)
	if err != nil {
		return nil, fmt.Errorf("no se pudo cargar el grafo del tema: %w", err)
	}

	globalGraph, err := LoadGlobalGraph(targetDir)
	if err != nil {
		return nil, fmt.Errorf("no se pudo cargar el grafo global: %w", err)
	}

	orderedSessions, err := GetOrderedCourseSessions(targetDir)
	if err != nil {
		return nil, fmt.Errorf("no se pudieron obtener sesiones ordenadas: %w", err)
	}

	modules, err := GetModules(targetDir)
	if err != nil {
		return nil, fmt.Errorf("no se pudieron obtener módulos: %w", err)
	}

	content, _ := ReadFile(targetDir, cleanRel)
	topicTitle := ExtractDocumentTitle(content)
	if topicTitle == "" {
		topicTitle = filepath.Base(cleanRel)
	}

	if len(orderedSessions) == 0 {
		return &PlacementSuggestion{
			TopicPath:            cleanRel,
			TopicTitle:           topicTitle,
			SuggestedModuleSlug:  "modulo-1",
			SuggestedModuleTitle: "Módulo 1: Fundamentos",
			SuggestedPosition:    1,
			Reasoning:            "No hay sesiones previas creadas. Se sugiere ubicar como primera sesión del curso.",
			Confidence:           0.8,
		}, nil
	}

	// Mapeo de conceptos a la sesión más temprana donde son introducidos
	conceptFirstSessionIdx := make(map[string]int)
	sessionIndexMap := make(map[string]int)
	for idx, s := range orderedSessions {
		sessionIndexMap[s] = idx
	}

	for _, node := range globalGraph.Nodes {
		if node.IsUnassigned {
			continue
		}
		earliestIdx := 999999
		for _, src := range node.SourceFiles {
			if idx, ok := sessionIndexMap[src]; ok {
				if idx < earliestIdx {
					earliestIdx = idx
				}
			}
		}
		if earliestIdx != 999999 {
			conceptFirstSessionIdx[node.ID] = earliestIdx
		}
	}

	// Analizar requisitos previos del tema (conceptos requeridos)
	topicNodeIDs := make(map[string]bool)
	for _, n := range topicGraph.Nodes {
		topicNodeIDs[n.ID] = true
	}

	minRequiredSessionIdx := -1
	var prerequisitesMet []string

	// Revisar aristas dentro del tema y aristas globales que conectan con este tema
	for _, e := range topicGraph.Edges {
		if e.Label == "prerrequisito_de" || e.Label == "requiere" {
			// Si Target es un concepto del tema y Source es un prerrequisito
			if topicNodeIDs[e.Target] {
				if idx, ok := conceptFirstSessionIdx[e.Source]; ok {
					if idx > minRequiredSessionIdx {
						minRequiredSessionIdx = idx
					}
					prerequisitesMet = append(prerequisitesMet, fmt.Sprintf("%s (explicado en %s)", e.Source, filepath.Base(orderedSessions[idx])))
				}
			}
		}
	}

	// Revisar también el grafo global por si otros temas requieren conceptos de este tema flotante
	maxAllowedSessionIdx := len(orderedSessions) - 1
	var dependentSessions []string

	for _, e := range globalGraph.Edges {
		if e.Label == "prerrequisito_de" || e.Label == "requiere" {
			// Si un concepto de este tema es prerrequisito de otro nodo ya asignado
			if topicNodeIDs[e.Source] {
				if idx, ok := conceptFirstSessionIdx[e.Target]; ok {
					if idx < maxAllowedSessionIdx {
						maxAllowedSessionIdx = idx
					}
					dependentSessions = append(dependentSessions, fmt.Sprintf("%s (necesitado en %s)", e.Target, filepath.Base(orderedSessions[idx])))
				}
			}
		}
	}

	// Determinar el índice ideal de inserción
	suggestedIndex := 0
	if minRequiredSessionIdx != -1 {
		suggestedIndex = minRequiredSessionIdx + 1
	} else if len(dependentSessions) > 0 {
		suggestedIndex = maxAllowedSessionIdx
		if suggestedIndex < 0 {
			suggestedIndex = 0
		}
	} else {
		// Ubicar al final de las sesiones existentes
		suggestedIndex = len(orderedSessions)
	}

	if suggestedIndex > len(orderedSessions) {
		suggestedIndex = len(orderedSessions)
	}

	// Identificar el módulo correspondiente a esa posición
	var suggestedModuleSlug = "modulo-1"
	var suggestedModuleTitle = "Módulo 1"
	var suggestedPositionInModule = 1

	if len(modules) > 0 {
		// Asignar según la sesión más cercana
		if suggestedIndex < len(orderedSessions) {
			refSession := orderedSessions[suggestedIndex]
			parts := strings.Split(refSession, "/")
			if len(parts) >= 2 {
				suggestedModuleSlug = parts[1]
			}
		} else {
			suggestedModuleSlug = modules[len(modules)-1].Slug
		}

		for _, m := range modules {
			if m.Slug == suggestedModuleSlug {
				suggestedModuleTitle = m.Title
				break
			}
		}
	}

	var afterSession string
	if suggestedIndex > 0 && suggestedIndex-1 < len(orderedSessions) {
		afterSession = orderedSessions[suggestedIndex-1]
	}

	var beforeSession string
	if suggestedIndex < len(orderedSessions) {
		beforeSession = orderedSessions[suggestedIndex]
	}

	var reasoningParts []string
	if len(prerequisitesMet) > 0 {
		reasoningParts = append(reasoningParts, fmt.Sprintf("Requiere conceptos previos: %s", strings.Join(prerequisitesMet, ", ")))
	}
	if len(dependentSessions) > 0 {
		reasoningParts = append(reasoningParts, fmt.Sprintf("Es prerrequisito de: %s", strings.Join(dependentSessions, ", ")))
	}
	if len(reasoningParts) == 0 {
		reasoningParts = append(reasoningParts, "No tiene restricciones rígidas de prerrequisitos detectadas. Se sugiere ubicar como lección de consolidación.")
	}

	confidence := float32(0.85)
	if len(prerequisitesMet) > 0 && len(dependentSessions) > 0 {
		confidence = 0.95
	}

	return &PlacementSuggestion{
		TopicPath:              cleanRel,
		TopicTitle:             topicTitle,
		SuggestedModuleSlug:    suggestedModuleSlug,
		SuggestedModuleTitle:   suggestedModuleTitle,
		SuggestedPosition:      suggestedPositionInModule,
		SuggestedAfterSession:  afterSession,
		SuggestedBeforeSession: beforeSession,
		PrerequisitesMet:       prerequisitesMet,
		DependentSessions:      dependentSessions,
		Reasoning:              strings.Join(reasoningParts, " | "),
		Confidence:             confidence,
	}, nil
}

// PromoteUnassignedTopic mueve y reubica un tema flotante a un módulo estructurado del compendio
func PromoteUnassignedTopic(targetDir string, topicRelPath string, targetModuleSlug string, sessionTitle string, authorName string, authorEmail string) (string, error) {
	cleanSource := filepath.ToSlash(filepath.Clean(topicRelPath))
	sourceFullPath := filepath.Join(targetDir, filepath.Clean(cleanSource))

	content, err := os.ReadFile(sourceFullPath)
	if err != nil {
		return "", fmt.Errorf("error leyendo archivo origen: %w", err)
	}

	if sessionTitle == "" {
		sessionTitle = ExtractDocumentTitle(string(content))
		if sessionTitle == "" {
			sessionTitle = "Nueva Sesión Promocionada"
		}
	}

	targetModDir := filepath.Join(targetDir, ContentDir, targetModuleSlug)
	if err := os.MkdirAll(targetModDir, 0755); err != nil {
		return "", fmt.Errorf("error creando directorio de módulo destino: %w", err)
	}

	// Calcular siguiente nombre correlativo de sesión en el módulo (ej. sesion-03.adoc)
	entries, _ := os.ReadDir(targetModDir)
	sessionNum := 1
	for _, e := range entries {
		if strings.HasPrefix(e.Name(), "sesion-") {
			sessionNum++
		}
	}

	destFileName := fmt.Sprintf("sesion-%02d.adoc", sessionNum)
	destRelPath := filepath.ToSlash(filepath.Join(ContentDir, targetModuleSlug, destFileName))
	destFullPath := filepath.Join(targetDir, filepath.Clean(destRelPath))

	// Guardar en destino
	if err := os.WriteFile(destFullPath, content, 0644); err != nil {
		return "", fmt.Errorf("error escribiendo sesión destino: %w", err)
	}

	// Eliminar origen
	os.Remove(sourceFullPath)

	// Migrar grafo de capítulo si existía
	chGraph, chErr := LoadChapterGraph(targetDir, cleanSource)
	if chErr == nil {
		chGraph.RelativePath = destRelPath
		SaveChapterGraph(targetDir, chGraph)
		// Eliminar archivo json anterior de grafo
		oldGraphPath := getChapterGraphPath(targetDir, cleanSource)
		os.Remove(oldGraphPath)
	}

	// Actualizar grafo global
	globalGraph, err := LoadGlobalGraph(targetDir)
	if err == nil {
		globalGraph = RemoveFileFromGlobalGraph(globalGraph, cleanSource)
		if chErr == nil {
			globalGraph = MergeChapterGraph(globalGraph, chGraph)
		}
		SaveGlobalGraph(targetDir, globalGraph)
	}

	// Git commit
	git.CommitFiles(targetDir, []string{cleanSource, destRelPath, GraphGlobalFile},
		fmt.Sprintf("Promocionar tema flotante '%s' a %s", sessionTitle, destRelPath), authorName, authorEmail)

	return destRelPath, nil
}

// ExtractSelectionToUnassigned extrae un fragmento de texto de una sesión activa y lo convierte en una idea flotante independiente,
// dejando en el documento original un bloque de referencia vinculado.
func ExtractSelectionToUnassigned(targetDir string, sourceRelPath string, selectionText string, title string, authorName string, authorEmail string) (string, string, error) {
	trimmedSelection := strings.TrimSpace(selectionText)
	if trimmedSelection == "" {
		return "", "", fmt.Errorf("la selección de texto no puede estar vacía")
	}

	if title == "" {
		lines := strings.Split(trimmedSelection, "\n")
		firstLine := strings.TrimSpace(lines[0])
		firstLine = strings.TrimPrefix(firstLine, "=")
		firstLine = strings.TrimSpace(firstLine)
		if len(firstLine) > 40 {
			firstLine = firstLine[:40] + "..."
		}
		title = firstLine
		if title == "" {
			title = fmt.Sprintf("Idea Extraída (%s)", time.Now().Format("15:04:05"))
		}
	}

	slug := NormalizeConceptID(title)
	if slug == "" {
		slug = fmt.Sprintf("idea-extraida-%d", time.Now().Unix())
	}

	unassignedRelPath := filepath.ToSlash(filepath.Join(UnassignedDir, slug+".adoc"))
	unassignedFullPath := filepath.Join(targetDir, filepath.Clean(unassignedRelPath))

	if err := os.MkdirAll(filepath.Dir(unassignedFullPath), 0755); err != nil {
		return "", "", fmt.Errorf("error creando carpeta unassigned: %w", err)
	}

	// Contenido del nuevo archivo flotante
	unassignedContent := fmt.Sprintf("= %s\n:author: %s\n:date: %s\n:type: unassigned\n:extracted_from: %s\n\n%s\n",
		title, authorName, time.Now().Format("2006-01-02"), sourceRelPath, trimmedSelection)

	if err := os.WriteFile(unassignedFullPath, []byte(unassignedContent), 0644); err != nil {
		return "", "", fmt.Errorf("error escribiendo idea flotante: %w", err)
	}

	// Leer y actualizar el archivo de origen
	sourceFullPath := filepath.Join(targetDir, filepath.Clean(sourceRelPath))
	sourceContentBytes, err := os.ReadFile(sourceFullPath)
	if err != nil {
		return "", "", fmt.Errorf("error leyendo archivo origen: %w", err)
	}
	sourceContent := string(sourceContentBytes)

	// Bloque de referencia AsciiDoc a sustituir
	referenceBlock := fmt.Sprintf("\n\n[NOTE]\n.📌 Idea pedagógica complementaria: %s\n====\nConsulte el desarrollo en: xref:../unassigned/%s.adoc[%s]\n====\n\n",
		title, slug, title)

	var modifiedSource string
	if strings.Contains(sourceContent, selectionText) {
		modifiedSource = strings.Replace(sourceContent, selectionText, referenceBlock, 1)
	} else if strings.Contains(sourceContent, trimmedSelection) {
		modifiedSource = strings.Replace(sourceContent, trimmedSelection, referenceBlock, 1)
	} else {
		// Si no se encuentra coincidencia exacta de whitespace, se añade como nota al final
		modifiedSource = sourceContent + referenceBlock
	}

	if err := os.WriteFile(sourceFullPath, []byte(modifiedSource), 0644); err != nil {
		return "", "", fmt.Errorf("error actualizando archivo origen: %w", err)
	}

	git.CommitFiles(targetDir, []string{sourceRelPath, unassignedRelPath},
		fmt.Sprintf("Extraer fragmento '%s' a tema flotante", title), authorName, authorEmail)

	return unassignedRelPath, modifiedSource, nil
}

// EmbedUnassignedTopicIntoSession incrusta una nota o lección flotante dentro de una sesión ya existente
// (como subsección o bloque de aviso), fusionando sus conceptos y eliminando el archivo flotante.
func EmbedUnassignedTopicIntoSession(targetDir string, unassignedRelPath string, targetSessionRelPath string, embedMode string, authorName string, authorEmail string) error {
	cleanUnassigned := filepath.ToSlash(filepath.Clean(unassignedRelPath))
	cleanTarget := filepath.ToSlash(filepath.Clean(targetSessionRelPath))

	unassignedFullPath := filepath.Join(targetDir, filepath.Clean(cleanUnassigned))
	targetFullPath := filepath.Join(targetDir, filepath.Clean(cleanTarget))

	unassignedBytes, err := os.ReadFile(unassignedFullPath)
	if err != nil {
		return fmt.Errorf("error leyendo tema flotante: %w", err)
	}
	unassignedContent := string(unassignedBytes)

	targetBytes, err := os.ReadFile(targetFullPath)
	if err != nil {
		return fmt.Errorf("error leyendo sesión destino: %w", err)
	}
	targetContent := string(targetBytes)

	title := ExtractDocumentTitle(unassignedContent)
	if title == "" {
		title = "Apunte Pedagógico Complementario"
	}

	// Limpiar encabezados de metadatos del contenido flotante
	lines := strings.Split(unassignedContent, "\n")
	var bodyLines []string
	isHeader := true
	for _, l := range lines {
		trimmed := strings.TrimSpace(l)
		if isHeader && (strings.HasPrefix(trimmed, "=") || strings.HasPrefix(trimmed, ":")) {
			continue
		}
		isHeader = false
		bodyLines = append(bodyLines, l)
	}
	cleanBody := strings.TrimSpace(strings.Join(bodyLines, "\n"))

	var embedBlock string
	if embedMode == "section" {
		embedBlock = fmt.Sprintf("\n\n=== %s\n\n%s\n", title, cleanBody)
	} else {
		embedBlock = fmt.Sprintf("\n\n[NOTE]\n.📌 %s\n====\n%s\n====\n", title, cleanBody)
	}

	updatedTargetContent := targetContent + embedBlock
	if err := os.WriteFile(targetFullPath, []byte(updatedTargetContent), 0644); err != nil {
		return fmt.Errorf("error escribiendo sesión destino: %w", err)
	}

	// Fusionar grafo si existe
	uGraph, uErr := LoadChapterGraph(targetDir, cleanUnassigned)
	tGraph, _ := LoadChapterGraph(targetDir, cleanTarget)
	if uErr == nil {
		for _, n := range uGraph.Nodes {
			n.SourceFiles = []string{cleanTarget}
			tGraph.Nodes = append(tGraph.Nodes, n)
		}
		for _, e := range uGraph.Edges {
			e.SourceFiles = []string{cleanTarget}
			tGraph.Edges = append(tGraph.Edges, e)
		}
		SaveChapterGraph(targetDir, tGraph)
	}

	// Eliminar archivo flotante y su subgrafo
	os.Remove(unassignedFullPath)
	os.Remove(getChapterGraphPath(targetDir, cleanUnassigned))

	// Actualizar grafo global
	globalGraph, err := LoadGlobalGraph(targetDir)
	if err == nil {
		globalGraph = RemoveFileFromGlobalGraph(globalGraph, cleanUnassigned)
		if uErr == nil {
			globalGraph = MergeChapterGraph(globalGraph, tGraph)
		}
		SaveGlobalGraph(targetDir, globalGraph)
	}

	git.CommitFiles(targetDir, []string{cleanTarget, cleanUnassigned, GraphGlobalFile},
		fmt.Sprintf("Incrustar tema flotante '%s' en %s", title, cleanTarget), authorName, authorEmail)

	return nil
}

// GetCurriculumCoherenceMatrix genera la matriz de cobertura y mapa de calor de conceptos vs sesiones ordenadas
func GetCurriculumCoherenceMatrix(targetDir string) (*CurriculumMatrix, error) {
	globalGraph, err := LoadGlobalGraph(targetDir)
	if err != nil {
		return nil, err
	}

	orderedSessions, err := GetOrderedCourseSessions(targetDir)
	if err != nil {
		return nil, err
	}

	var sessionHeaders []MatrixSessionHeader
	sessionGraphs := make(map[string]*ChapterGraph)

	for idx, sRel := range orderedSessions {
		chGraph, _ := LoadChapterGraph(targetDir, sRel)
		sessionGraphs[sRel] = chGraph

		// Extraer título de sesión
		title := chGraph.Title
		if title == "" {
			content, _ := ReadFile(targetDir, sRel)
			title = ExtractDocumentTitle(content)
			if title == "" {
				title = filepath.Base(sRel)
			}
		}

		parts := strings.Split(sRel, "/")
		mod := "general"
		if len(parts) >= 2 {
			mod = parts[1]
		}

		sessionHeaders = append(sessionHeaders, MatrixSessionHeader{
			RelPath: sRel,
			Title:   title,
			Module:  mod,
			Order:   idx + 1,
		})
	}

	// Mapear prerrequisitos ontológicos entre conceptos
	prereqMap := make(map[string][]string) // targetConceptID -> list of required sourceConceptIDs
	for _, edge := range globalGraph.Edges {
		if strings.Contains(strings.ToLower(edge.Label), "prerrequisito") || strings.Contains(strings.ToLower(edge.Label), "requiere") {
			prereqMap[edge.Target] = append(prereqMap[edge.Target], edge.Source)
		}
	}

	// Construir filas conceptuales
	var conceptRows []MatrixConceptRow
	totalWarnings := 0

	for _, node := range globalGraph.Nodes {
		if node.IsUnassigned && len(node.SourceFiles) == 1 && strings.HasPrefix(node.SourceFiles[0], "content/unassigned/") {
			continue // No incluir conceptos aislados de flotantes si no aparecen en el temario
		}

		cells := make(map[string]MatrixCell)
		introducedIn := ""
		warningsInRow := 0
		seenSoFar := make(map[string]bool)

		for _, sHeader := range sessionHeaders {
			sRel := sHeader.RelPath
			chGraph := sessionGraphs[sRel]

			hasConcept := false
			if chGraph != nil {
				for _, cn := range chGraph.Nodes {
					if cn.ID == node.ID {
						hasConcept = true
						break
					}
				}
			}

			if hasConcept {
				if introducedIn == "" {
					// Primera vez que aparece -> Introducción
					introducedIn = sRel

					// Verificar si se introdujo sin cumplir prerrequisitos previos
					var missingPrereqs []string
					for _, req := range prereqMap[node.ID] {
						if !seenSoFar[req] {
							missingPrereqs = append(missingPrereqs, req)
						}
					}

					if len(missingPrereqs) > 0 {
						warningsInRow++
						totalWarnings++
						cells[sRel] = MatrixCell{
							Type:   "premature_warning",
							Detail: fmt.Sprintf("Introducido antes de sus prerrequisitos: %s", strings.Join(missingPrereqs, ", ")),
						}
					} else {
						cells[sRel] = MatrixCell{
							Type:   "intro",
							Detail: "Concepto introducido por primera vez en el curso",
						}
					}
				} else {
					// Ya fue introducido previamente -> Refuerzo
					cells[sRel] = MatrixCell{
						Type:   "reinforce",
						Detail: "Refuerzo / profundización del concepto",
					}
				}
			} else {
				cells[sRel] = MatrixCell{
					Type: "empty",
				}
			}

			// Actualizar conceptos vistos hasta esta sesión
			if chGraph != nil {
				for _, cn := range chGraph.Nodes {
					seenSoFar[cn.ID] = true
				}
			}
		}

		conceptRows = append(conceptRows, MatrixConceptRow{
			ID:            node.ID,
			Label:         node.Label,
			Type:          node.Type,
			IntroducedIn:  introducedIn,
			Occurrences:   node.Occurrences,
			Cells:         cells,
			WarningsCount: warningsInRow,
		})
	}

	// Ordenar conceptos: primero los que tienen avisos, luego por ocurrencias descendente
	sort.Slice(conceptRows, func(i, j int) bool {
		if conceptRows[i].WarningsCount != conceptRows[j].WarningsCount {
			return conceptRows[i].WarningsCount > conceptRows[j].WarningsCount
		}
		return conceptRows[i].Occurrences > conceptRows[j].Occurrences
	})

	return &CurriculumMatrix{
		Sessions:      sessionHeaders,
		Concepts:      conceptRows,
		TotalWarnings: totalWarnings,
	}, nil
}

// NodePosition representa la coordenada x, y de un nodo en el visor ReactFlow
type NodePosition struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// SaveGlobalGraphPositions guarda las posiciones X/Y de los nodos para persistir el layout visual
func SaveGlobalGraphPositions(targetDir string, positions map[string]NodePosition) error {
	globalGraph, err := LoadGlobalGraph(targetDir)
	if err != nil {
		return err
	}

	for i := range globalGraph.Nodes {
		nodeID := globalGraph.Nodes[i].ID
		if pos, ok := positions[nodeID]; ok {
			globalGraph.Nodes[i].X = pos.X
			globalGraph.Nodes[i].Y = pos.Y
		}
	}

	return SaveGlobalGraph(targetDir, globalGraph)
}

// SaveGlobalGraphManualEdge añade o actualiza una conexión manual entre dos nodos en el grafo global
func SaveGlobalGraphManualEdge(targetDir string, source, target, label string) error {
	globalGraph, err := LoadGlobalGraph(targetDir)
	if err != nil {
		return err
	}

	if label == "" {
		label = "relacionado_con"
	}

	found := false
	for i := range globalGraph.Edges {
		if globalGraph.Edges[i].Source == source && globalGraph.Edges[i].Target == target {
			globalGraph.Edges[i].Label = label
			found = true
			break
		}
	}

	if !found {
		globalGraph.Edges = append(globalGraph.Edges, GraphEdge{
			ID:    fmt.Sprintf("e-%s-%s", source, target),
			Source: source,
			Target: target,
			Label: label,
			Score: 1.0,
		})
	}

	return SaveGlobalGraph(targetDir, globalGraph)
}

// DeleteGlobalGraphEdge elimina una arista entre dos nodos en el grafo global
func DeleteGlobalGraphEdge(targetDir string, source, target string) error {
	globalGraph, err := LoadGlobalGraph(targetDir)
	if err != nil {
		return err
	}

	var remainingEdges []GraphEdge
	for _, e := range globalGraph.Edges {
		if !(e.Source == source && e.Target == target) && !(e.Source == target && e.Target == source) {
			remainingEdges = append(remainingEdges, e)
		}
	}
	globalGraph.Edges = remainingEdges

	return SaveGlobalGraph(targetDir, globalGraph)
}

// ExtractHeuristicConcepts extrae conceptos y relaciones analizando encabezados, negritas, admonitions y bloques de diagrama Mermaid
func ExtractHeuristicConcepts(relativePath string, content string) ([]GraphNode, []GraphEdge) {
	var nodes []GraphNode
	var edges []GraphEdge
	nodeMap := make(map[string]GraphNode)

	cleanRel := filepath.ToSlash(filepath.Clean(relativePath))
	isUnassigned := strings.HasPrefix(cleanRel, "content/unassigned/")

	lines := strings.Split(content, "\n")
	var prevConceptID string

	boldReg := regexp.MustCompile(`\*([a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]{3,40})\*`)
	mermaidArrowReg := regexp.MustCompile(`([a-zA-Z0-9_-]+)\s*(?:-->|-.->|==>)\s*([a-zA-Z0-9_-]+)`)

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}

		// 1. Encabezados AsciiDoc (==, ===, ====)
		if strings.HasPrefix(trimmed, "== ") || strings.HasPrefix(trimmed, "=== ") || strings.HasPrefix(trimmed, "==== ") {
			parts := strings.SplitN(trimmed, " ", 2)
			if len(parts) == 2 {
				headingText := strings.TrimSpace(parts[1])
				// Si contiene subtítulo con dos puntos (e.g. "Bautismo: Puerta de la vida...")
				titleParts := strings.Split(headingText, ":")
				mainConcept := strings.TrimSpace(titleParts[0])

				cID := NormalizeConceptID(mainConcept)
				if cID != "" && len(mainConcept) >= 3 {
					cType := "Doctrina"
					lower := strings.ToLower(mainConcept)
					if strings.Contains(lower, "bautismo") || strings.Contains(lower, "confirmacion") || strings.Contains(lower, "eucaristia") || strings.Contains(lower, "sacramento") || strings.Contains(lower, "uncion") || strings.Contains(lower, "penitencia") || strings.Contains(lower, "reconciliacion") || strings.Contains(lower, "orden") || strings.Contains(lower, "matrimonio") {
						cType = "Sacramento"
					} else if strings.Contains(lower, "gracia") || strings.Contains(lower, "fe") || strings.Contains(lower, "credo") || strings.Contains(lower, "dios") || strings.Contains(lower, "trinidad") || strings.Contains(lower, "iglesia") {
						cType = "Doctrina"
					} else if strings.Contains(lower, "rito") || strings.Contains(lower, "liturgia") || strings.Contains(lower, "signo") || strings.Contains(lower, "simbolo") || strings.Contains(lower, "materia") || strings.Contains(lower, "forma") || strings.Contains(lower, "crisma") || strings.Contains(lower, "oleo") {
						cType = "Liturgia"
					} else if strings.Contains(lower, "mandamiento") || strings.Contains(lower, "moral") || strings.Contains(lower, "pecado") || strings.Contains(lower, "virtud") {
						cType = "Moral"
					} else if strings.Contains(lower, "evangelio") || strings.Contains(lower, "biblia") || strings.Contains(lower, "testamento") || strings.Contains(lower, "jesus") || strings.Contains(lower, "cristo") {
						cType = "Biblia"
					}

					nodeMap[cID] = GraphNode{
						ID:           cID,
						Label:        mainConcept,
						Type:         cType,
						SourceFiles:  []string{cleanRel},
						Occurrences:  1,
						IsUnassigned: isUnassigned,
					}

					if prevConceptID != "" && prevConceptID != cID {
						edges = append(edges, GraphEdge{
							ID:           fmt.Sprintf("e-%s-%s", prevConceptID, cID),
							Source:       prevConceptID,
							Target:       cID,
							Label:        "prerrequisito_de",
							Score:        0.9,
							SourceFiles:  []string{cleanRel},
							IsUnassigned: isUnassigned,
						})
					}
					prevConceptID = cID
				}
			}
		}

		// 2. Términos clave resaltados en negrita
		matches := boldReg.FindAllStringSubmatch(trimmed, -1)
		for _, m := range matches {
			if len(m) > 1 {
				term := strings.TrimSpace(m[1])
				// Filtrar palabras auxiliares comunes
				termLower := strings.ToLower(term)
				if termLower == "nota" || termLower == "resumen" || termLower == "objetivo" || termLower == "actividad" || termLower == "tiempo" || termLower == "materiales" {
					continue
				}
				cID := NormalizeConceptID(term)
				if cID != "" && len(term) >= 4 {
					if _, exists := nodeMap[cID]; !exists {
						nodeMap[cID] = GraphNode{
							ID:           cID,
							Label:        term,
							Type:         "Concepto",
							SourceFiles:  []string{cleanRel},
							Occurrences:  1,
							IsUnassigned: isUnassigned,
						}
						if prevConceptID != "" && prevConceptID != cID {
							edges = append(edges, GraphEdge{
								ID:           fmt.Sprintf("e-%s-%s", prevConceptID, cID),
								Source:       prevConceptID,
								Target:       cID,
								Label:        "profundiza_en",
								Score:        0.75,
								SourceFiles:  []string{cleanRel},
								IsUnassigned: isUnassigned,
							})
						}
					}
				}
			}
		}

		// 3. Flechas en bloques Mermaid
		mMatches := mermaidArrowReg.FindAllStringSubmatch(trimmed, -1)
		for _, mm := range mMatches {
			if len(mm) >= 3 {
				src := NormalizeConceptID(mm[1])
				tgt := NormalizeConceptID(mm[2])
				if src != "" && tgt != "" && src != tgt {
					if _, ok := nodeMap[src]; !ok {
						nodeMap[src] = GraphNode{ID: src, Label: mm[1], Type: "Concepto", SourceFiles: []string{cleanRel}, Occurrences: 1, IsUnassigned: isUnassigned}
					}
					if _, ok := nodeMap[tgt]; !ok {
						nodeMap[tgt] = GraphNode{ID: tgt, Label: mm[2], Type: "Concepto", SourceFiles: []string{cleanRel}, Occurrences: 1, IsUnassigned: isUnassigned}
					}
					edges = append(edges, GraphEdge{
						ID:           fmt.Sprintf("e-%s-%s", src, tgt),
						Source:       src,
						Target:       tgt,
						Label:        "asociado_con",
						Score:        1.0,
						SourceFiles:  []string{cleanRel},
						IsUnassigned: isUnassigned,
					})
				}
			}
		}
	}

	for _, n := range nodeMap {
		nodes = append(nodes, n)
	}

	return nodes, edges
}

// ScanAndRebuildCompendiumGraph recorre todos los archivos .adoc y .md del compendio y reconstruye el grafo global consolidado
func ScanAndRebuildCompendiumGraph(targetDir string) (*GraphData, error) {
	globalGraph := &GraphData{
		Version:   "1.0",
		UpdatedAt: time.Now(),
		Nodes:     []GraphNode{},
		Edges:     []GraphEdge{},
	}

	contentDir := filepath.Join(targetDir, "content")
	if _, err := os.Stat(contentDir); err != nil {
		return globalGraph, nil
	}

	err := filepath.Walk(contentDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}

		ext := strings.ToLower(filepath.Ext(path))
		if ext != ".adoc" && ext != ".md" {
			return nil
		}

		rel, err := filepath.Rel(targetDir, path)
		if err != nil {
			return nil
		}
		cleanRel := filepath.ToSlash(rel)

		data, err := os.ReadFile(path)
		if err != nil {
			return nil
		}

		nodes, edges := ExtractHeuristicConcepts(cleanRel, string(data))
		if len(nodes) > 0 {
			chGraph := &ChapterGraph{
				RelativePath: cleanRel,
				Title:        ExtractDocumentTitle(string(data)),
				Nodes:        nodes,
				Edges:        edges,
				ExtractedAt:  time.Now(),
			}
			if chGraph.Title == "" {
				chGraph.Title = filepath.Base(cleanRel)
			}
			_ = SaveChapterGraph(targetDir, chGraph)
			globalGraph = MergeChapterGraph(globalGraph, chGraph)
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("error escaneando compendio: %w", err)
	}

	if err := SaveGlobalGraph(targetDir, globalGraph); err != nil {
		return nil, err
	}

	return globalGraph, nil
}

