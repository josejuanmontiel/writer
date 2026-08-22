package storage

import (
	"os"
	"testing"
)

func TestProgressiveGraphAndStaging(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "writer_graph_test_*")
	if err != nil {
		t.Fatalf("Error creando tmpDir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	meta := ProjectMeta{
		Name:        "Catequesis Parroquial de Iniciación Cristiana",
		Description: "Compendio formativo de 2 años para catequistas y niños",
		Author:      "P. Francisco",
		Email:       "francisco@example.org",
	}

	info, err := CreateCompendium(tmpDir, meta)
	if err != nil {
		t.Fatalf("Error creando compendio: %v", err)
	}
	if info == nil {
		t.Fatal("CompendiumInfo es nil")
	}

	// 1. Validar inicialización de grafo global vacío
	globalGraph, err := LoadGlobalGraph(tmpDir)
	if err != nil {
		t.Fatalf("Error cargando grafo global: %v", err)
	}
	if len(globalGraph.Nodes) != 0 {
		t.Errorf("Esperado 0 nodos iniciales, obtenido %d", len(globalGraph.Nodes))
	}

	// 2. Simular extracción de Tema 1 (Módulo 1 / Sesión 1: La Creación y el Pecado Original)
	session1Rel := "content/modulo-1/sesion-01.adoc"
	session1Content := "= La Creación y el Pecado Original\n:author: P. Francisco\n\n== Desarrollo\nDios Creador hizo al hombre libre, pero el Pecado Original rompió la armonía.\n"
	_ = SaveLessonFile(tmpDir, session1Rel, session1Content, "Sesión 1", meta.Author, meta.Email)

	ch1Graph := &ChapterGraph{
		RelativePath: session1Rel,
		Title:        "La Creación y el Pecado Original",
		Nodes: []GraphNode{
			{ID: "dios-creador", Label: "Dios Creador", Type: "Doctrina"},
			{ID: "pecado-original", Label: "Pecado Original", Type: "Doctrina"},
		},
		Edges: []GraphEdge{
			{Source: "dios-creador", Target: "pecado-original", Label: "crea_al_hombre_en_gracia", Score: 0.95},
		},
	}

	err = SaveChapterGraph(tmpDir, ch1Graph)
	if err != nil {
		t.Fatalf("Error guardando grafo de capítulo 1: %v", err)
	}

	globalGraph = MergeChapterGraph(globalGraph, ch1Graph)
	err = SaveGlobalGraph(tmpDir, globalGraph)
	if err != nil {
		t.Fatalf("Error guardando grafo global fusionado: %v", err)
	}

	if len(globalGraph.Nodes) != 2 {
		t.Fatalf("Esperados 2 nodos globales tras sesión 1, obtenido %d", len(globalGraph.Nodes))
	}

	// 3. Simular extracción de Tema 2 (Módulo 1 / Sesión 2: El Sacramento del Bautismo)
	session2Rel := "content/modulo-1/sesion-02.adoc"
	session2Content := "= El Sacramento del Bautismo\n:author: P. Francisco\n\n== Desarrollo\nEl Bautismo limpia el Pecado Original e infunde la Gracia Santificante.\n"
	_ = SaveLessonFile(tmpDir, session2Rel, session2Content, "Sesión 2", meta.Author, meta.Email)

	ch2Graph := &ChapterGraph{
		RelativePath: session2Rel,
		Title:        "El Sacramento del Bautismo",
		Nodes: []GraphNode{
			{ID: "bautismo", Label: "El Bautismo", Type: "Sacramento"},
			{ID: "pecado-original", Label: "Pecado Original", Type: "Doctrina"}, // Concepto compartido!
			{ID: "gracia-santificante", Label: "Gracia Santificante", Type: "Doctrina"},
		},
		Edges: []GraphEdge{
			{Source: "pecado-original", Target: "bautismo", Label: "prerrequisito_de", Score: 0.92},
			{Source: "bautismo", Target: "gracia-santificante", Label: "infunde", Score: 0.98},
		},
	}

	SaveChapterGraph(tmpDir, ch2Graph)
	globalGraph = MergeChapterGraph(globalGraph, ch2Graph)
	SaveGlobalGraph(tmpDir, globalGraph)

	// Validar fusión continua y preservación de IDs compartidos
	if len(globalGraph.Nodes) != 4 { // dios-creador, pecado-original, bautismo, gracia-santificante
		t.Fatalf("Esperados 4 nodos únicos en grafo global fusionado, obtenido %d", len(globalGraph.Nodes))
	}

	// Verificar ocurrencias de 'pecado-original'
	var pecadoNode *GraphNode
	for _, n := range globalGraph.Nodes {
		if n.ID == "pecado-original" {
			pecadoNode = &n
			break
		}
	}
	if pecadoNode == nil {
		t.Fatal("Nodo 'pecado-original' no encontrado en el grafo global")
	}
	if pecadoNode.Occurrences != 2 {
		t.Errorf("Esperadas 2 ocurrencias para 'pecado-original', obtenido %d", pecadoNode.Occurrences)
	}
	if len(pecadoNode.SourceFiles) != 2 {
		t.Errorf("Esperados 2 source_files para 'pecado-original', obtenido %d", len(pecadoNode.SourceFiles))
	}

	// 4. Probar Activación de Contexto al Iniciar Capítulo (GetContextSuggestions)
	suggestions, err := GetContextSuggestions(tmpDir, session2Rel)
	if err != nil {
		t.Fatalf("Error obteniendo sugerencias de contexto: %v", err)
	}
	if len(suggestions.PreviousConcepts) != 2 { // dios-creador y pecado-original explicados en sesión 1
		t.Errorf("Esperados 2 conceptos previos para sesión 2, obtenido %d", len(suggestions.PreviousConcepts))
	}

	// 5. Probar Bandeja de Temas Flotantes (Unassigned / Staging Buffer)
	unassignedRel, err := CreateUnassignedTopic(
		tmpDir,
		"La Confesión y el Perdón de los Pecados",
		"= La Confesión y el Perdón de los Pecados\n:author: P. Francisco\n\n== Desarrollo\nLa Confesión o Sacramento de la Penitencia perdona los pecados cometidos tras el Bautismo y prepara el alma para la Primera Comunión.\n",
		meta.Author,
		meta.Email,
	)
	if err != nil {
		t.Fatalf("Error creando tema flotante: %v", err)
	}

	unassignedList, err := GetUnassignedTopics(tmpDir)
	if err != nil {
		t.Fatalf("Error listando temas flotantes: %v", err)
	}
	if len(unassignedList) != 1 {
		t.Fatalf("Esperado 1 tema flotante, obtenido %d", len(unassignedList))
	}
	if unassignedList[0].Title != "La Confesión y el Perdón de los Pecados" {
		t.Errorf("Título inesperado: %s", unassignedList[0].Title)
	}

	// Asignar grafo local al tema flotante
	unassignedGraph := &ChapterGraph{
		RelativePath: unassignedRel,
		Title:        "La Confesión y el Perdón de los Pecados",
		Nodes: []GraphNode{
			{ID: "confesion", Label: "Sacramento de la Confesión", Type: "Sacramento", IsUnassigned: true},
			{ID: "bautismo", Label: "El Bautismo", Type: "Sacramento"},
			{ID: "eucaristia", Label: "Primera Comunión (Eucaristía)", Type: "Sacramento"},
		},
		Edges: []GraphEdge{
			{Source: "bautismo", Target: "confesion", Label: "prerrequisito_de", Score: 0.95},
			{Source: "confesion", Target: "eucaristia", Label: "prerrequisito_de", Score: 0.90},
		},
	}
	SaveChapterGraph(tmpDir, unassignedGraph)
	globalGraph = MergeChapterGraph(globalGraph, unassignedGraph)
	SaveGlobalGraph(tmpDir, globalGraph)

	// 6. Probar Asistente de Reubicación y Ordenación por Dependencias (AnalyzeUnassignedPlacement)
	placement, err := AnalyzeUnassignedPlacement(tmpDir, unassignedRel)
	if err != nil {
		t.Fatalf("Error analizando ubicación de tema flotante: %v", err)
	}

	if len(placement.PrerequisitesMet) == 0 {
		t.Errorf("Esperado al menos 1 prerrequisito previo detectado (Bautismo), obtenido 0")
	}
	if placement.SuggestedPosition < 1 {
		t.Errorf("Posición sugerida inválida: %d", placement.SuggestedPosition)
	}
	t.Logf("✅ Sugerencia pedagógica para '%s': %s (Módulo: %s, Confianza: %.2f)",
		placement.TopicTitle, placement.Reasoning, placement.SuggestedModuleSlug, placement.Confidence)

	// 7. Probar Promoción de Tema Flotante a Sesión Estructurada
	promotedRel, err := PromoteUnassignedTopic(tmpDir, unassignedRel, "modulo-1", "La Confesión y la Penitencia", meta.Author, meta.Email)
	if err != nil {
		t.Fatalf("Error promocionando tema flotante: %v", err)
	}
	if promotedRel != "content/modulo-1/sesion-03.adoc" {
		t.Errorf("Ruta promocionada inesperada: %s (esperado content/modulo-1/sesion-03.adoc)", promotedRel)
	}

	// Verificar que la bandeja de flotantes quedó vacía
	unassignedAfter, _ := GetUnassignedTopics(tmpDir)
	if len(unassignedAfter) != 0 {
		t.Errorf("Esperado 0 temas flotantes tras promoción, obtenido %d", len(unassignedAfter))
	}

	// Verificar que el grafo global ya no marca 'confesion' como unassigned
	updatedGlobal, _ := LoadGlobalGraph(tmpDir)
	for _, n := range updatedGlobal.Nodes {
		if n.ID == "confesion" && n.IsUnassigned {
			t.Errorf("El nodo 'confesion' no debería estar marcado como IsUnassigned tras ser promocionado")
		}
	}
}

func TestNormalizeConceptID(t *testing.T) {
	testCases := []struct {
		input    string
		expected string
	}{
		{"El Bautismo", "bautismo"},
		{"La Santísima Trinidad", "santisima-trinidad"},
		{"Los Diez Mandamientos", "diez-mandamientos"},
		{"Una Iglesia Santa y Apostólica", "iglesia-santa-y-apostolica"},
		{"¡Pecado Original!", "pecado-original"},
		{"Eucaristía (Comunión)", "eucaristia-comunion"},
		{"Espíritu Santo", "espiritu-santo"},
	}

	for _, tc := range testCases {
		res := NormalizeConceptID(tc.input)
		if res != tc.expected {
			t.Errorf("NormalizeConceptID(%q) = %q, esperado %q", tc.input, res, tc.expected)
		}
	}
}
