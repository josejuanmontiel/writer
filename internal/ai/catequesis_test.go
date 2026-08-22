package ai

import (
	"context"
	"fmt"
	"strings"
	"testing"

	_ "antigravity-writer/internal/ortinit"
	"antigravity-writer/internal/storage"
)

// TestGLiNER2_IniciacionCristiana prueba la extracción de entidades y relaciones sobre los Sacramentos de Iniciación
func TestGLiNER2_IniciacionCristiana(t *testing.T) {
	processor, err := NewGLiNER2Processor("../../models/gliner2_native")
	if err != nil {
		t.Skipf("Saltando test de GLiNER2: Modelo no disponible en ../../models/gliner2_native: %v", err)
		return
	}

	textoCatequesis := `El Bautismo es el primer sacramento de la iniciación cristiana.
El Bautismo perdona el pecado original y nos hace hijos de Dios mediante la gracia santificante.
La Confirmación fortalece los dones del Espíritu Santo recibidos en el Bautismo.
La Sagrada Eucaristía alimenta el alma cristiana con el Cuerpo y la Sangre de Jesucristo.`

	entities, relations, err := processor.ExtractFromText(context.Background(), textoCatequesis)
	if err != nil {
		t.Fatalf("Error ejecutando inferencia GLiNER2 en texto de Iniciación Cristiana: %v", err)
	}

	fmt.Printf("\n=== TEST CATEQUESIS: INICIACIÓN CRISTIANA ===\n")
	fmt.Printf("Texto evaluado: %d caracteres\n", len(textoCatequesis))
	fmt.Printf("Entidades extraídas (%d):\n", len(entities))
	for idx, e := range entities {
		fmt.Printf("  [%d] '%s' (Tipo: %s, Score: %.3f)\n", idx+1, e.Text, e.Label, e.Score)
	}

	fmt.Printf("Relaciones extraídas (%d):\n", len(relations))
	for idx, r := range relations {
		fmt.Printf("  [%d] [%s] --(%s)--> [%s] (Score: %.3f)\n", idx+1, r.Head, r.Label, r.Tail, r.Score)
	}

	if len(entities) == 0 {
		t.Errorf("Se esperaban entidades teológicas extraídas, pero se obtuvieron 0")
	}

	// Verificar presencia de conceptos clave (case-insensitive)
	conceptosBuscados := []string{"bautismo", "pecado", "espiritu", "eucaristia"}
	encontrados := 0
	for _, cb := range conceptosBuscados {
		for _, e := range entities {
			if strings.Contains(strings.ToLower(e.Text), cb) {
				encontrados++
				break
			}
		}
	}
	t.Logf("Conceptos teológicos clave detectados: %d/%d", encontrados, len(conceptosBuscados))
}

// TestGLiNER2_SacramentosYPerdon valida la extracción sobre la Confesión, Reconciliación y Comunión
func TestGLiNER2_SacramentosYPerdon(t *testing.T) {
	processor, err := NewGLiNER2Processor("../../models/gliner2_native")
	if err != nil {
		t.Skipf("Saltando test de GLiNER2: Modelo no disponible: %v", err)
		return
	}

	textoCatequesis := `El Sacramento de la Penitencia o Confesión otorga el perdón de los pecados.
Para comulgar en la Primera Comunión es necesario haber realizado la Primera Confesión y estar en estado de gracia.
La absolución sacerdotal reconcilia al pecador con Dios y con la Iglesia.`

	entities, relations, err := processor.ExtractFromText(context.Background(), textoCatequesis)
	if err != nil {
		t.Fatalf("Error ejecutando inferencia GLiNER2 en texto de Confesión y Comunión: %v", err)
	}

	fmt.Printf("\n=== TEST CATEQUESIS: SACRAMENTOS DE CURACIÓN Y PERDÓN ===\n")
	fmt.Printf("Entidades extraídas (%d):\n", len(entities))
	for _, e := range entities {
		fmt.Printf("  • '%s' (Score: %.3f)\n", e.Text, e.Score)
	}

	fmt.Printf("Relaciones extraídas (%d):\n", len(relations))
	for _, r := range relations {
		fmt.Printf("  🤝 [%s] ---> %s ---> [%s]\n", r.Head, r.Label, r.Tail)
	}

	if len(entities) == 0 {
		t.Errorf("Se esperaban entidades extraídas del texto de Penitencia")
	}
}

// TestGLiNER2_CredoYFundamentos prueba la extracción sobre el Credo Apostólico y la Trinidad
func TestGLiNER2_CredoYFundamentos(t *testing.T) {
	processor, err := NewGLiNER2Processor("../../models/gliner2_native")
	if err != nil {
		t.Skipf("Saltando test de GLiNER2: Modelo no disponible: %v", err)
		return
	}

	textoCatequesis := `Creemos en un solo Dios, Padre Todopoderoso, Creador del cielo y de la tierra.
Creemos en Jesucristo, Hijo único de Dios, que nació de la Virgen María y resucitó al tercer día.
Creemos en la Iglesia Católica fundada sobre los doce Apóstoles bajo la guía de San Pedro.`

	entities, relations, err := processor.ExtractFromText(context.Background(), textoCatequesis)
	if err != nil {
		t.Fatalf("Error ejecutando inferencia GLiNER2 en Credo: %v", err)
	}

	fmt.Printf("\n=== TEST CATEQUESIS: CREDO Y DOCTRINA TRINITARIA ===\n")
	fmt.Printf("Entidades extraídas: %d | Relaciones: %d\n", len(entities), len(relations))
	for _, e := range entities {
		fmt.Printf("  • [%s] %s\n", e.Label, e.Text)
	}
}

// TestGLiNER2_MandamientosYMoral prueba la extracción sobre los Diez Mandamientos y la Historia Sagrada
func TestGLiNER2_MandamientosYMoral(t *testing.T) {
	processor, err := NewGLiNER2Processor("../../models/gliner2_native")
	if err != nil {
		t.Skipf("Saltando test de GLiNER2: Modelo no disponible: %v", err)
		return
	}

	textoCatequesis := `Dios entregó las Tablas de la Ley a Moisés en el Monte Sinaí.
Los Diez Mandamientos enseñan a amar a Dios sobre todas las cosas y al prójimo como a nosotros mismos.
El mandamiento del Amor fue perfeccionado por Jesús en la Última Cena.`

	entities, relations, err := processor.ExtractFromText(context.Background(), textoCatequesis)
	if err != nil {
		t.Fatalf("Error ejecutando inferencia GLiNER2 en Mandamientos: %v", err)
	}

	fmt.Printf("\n=== TEST CATEQUESIS: MANDAMIENTOS Y MORAL CRISTIANA ===\n")
	fmt.Printf("Entidades extraídas: %d | Relaciones: %d\n", len(entities), len(relations))
	for _, r := range relations {
		fmt.Printf("  🤝 [%s] --(%s)--> [%s]\n", r.Head, r.Label, r.Tail)
	}
}

// TestGLiNER2_ProgressiveFusionPipeline valida el ciclo E2E de extracción con GLiNER2 y fusión progresiva en el grafo curricular
func TestGLiNER2_ProgressiveFusionPipeline(t *testing.T) {
	processor, err := NewGLiNER2Processor("../../models/gliner2_native")
	if err != nil {
		t.Skipf("Saltando test E2E de GLiNER2: Modelo no disponible: %v", err)
		return
	}

	// Sesión 1: Bautismo
	sesion1Texto := "El Bautismo limpia el pecado original e infunde la gracia santificante en el alma del niño."
	ent1, rel1, err := processor.ExtractFromText(context.Background(), sesion1Texto)
	if err != nil {
		t.Fatalf("Error extrayendo sesión 1: %v", err)
	}

	ch1 := &storage.ChapterGraph{
		RelativePath: "content/modulo-1/sesion-01.adoc",
		Title:        "El Sacramento del Bautismo",
	}
	for _, e := range ent1 {
		id := storage.NormalizeConceptID(e.Text)
		if id != "" {
			ch1.Nodes = append(ch1.Nodes, storage.GraphNode{ID: id, Label: e.Text, Type: e.Label, SourceFiles: []string{ch1.RelativePath}})
		}
	}
	for _, r := range rel1 {
		srcID := storage.NormalizeConceptID(r.Head)
		tgtID := storage.NormalizeConceptID(r.Tail)
		if srcID != "" && tgtID != "" && srcID != tgtID {
			ch1.Edges = append(ch1.Edges, storage.GraphEdge{
				ID:          fmt.Sprintf("%s--%s-->%s", srcID, r.Label, tgtID),
				Source:      srcID,
				Target:      tgtID,
				Label:       r.Label,
				Score:       r.Score,
				SourceFiles: []string{ch1.RelativePath},
			})
		}
	}

	// Sesión 2: Confirmación
	sesion2Texto := "El Sacramento de la Confirmación perfecciona la gracia del Bautismo con los siete dones del Espíritu Santo."
	ent2, rel2, err := processor.ExtractFromText(context.Background(), sesion2Texto)
	if err != nil {
		t.Fatalf("Error extrayendo sesión 2: %v", err)
	}

	ch2 := &storage.ChapterGraph{
		RelativePath: "content/modulo-1/sesion-02.adoc",
		Title:        "La Confirmación y el Espíritu Santo",
	}
	for _, e := range ent2 {
		id := storage.NormalizeConceptID(e.Text)
		if id != "" {
			ch2.Nodes = append(ch2.Nodes, storage.GraphNode{ID: id, Label: e.Text, Type: e.Label, SourceFiles: []string{ch2.RelativePath}})
		}
	}
	for _, r := range rel2 {
		srcID := storage.NormalizeConceptID(r.Head)
		tgtID := storage.NormalizeConceptID(r.Tail)
		if srcID != "" && tgtID != "" && srcID != tgtID {
			ch2.Edges = append(ch2.Edges, storage.GraphEdge{
				ID:          fmt.Sprintf("%s--%s-->%s", srcID, r.Label, tgtID),
				Source:      srcID,
				Target:      tgtID,
				Label:       r.Label,
				Score:       r.Score,
				SourceFiles: []string{ch2.RelativePath},
			})
		}
	}

	// Fusión progresiva continua
	global := &storage.GraphData{Version: "1.0", Nodes: []storage.GraphNode{}, Edges: []storage.GraphEdge{}}
	global = storage.MergeChapterGraph(global, ch1)
	nodosTrasS1 := len(global.Nodes)

	global = storage.MergeChapterGraph(global, ch2)
	nodosTrasS2 := len(global.Nodes)

	fmt.Printf("\n=== PIPELINE E2E: FUSIÓN PROGRESIVA CON GLINER2 ===\n")
	fmt.Printf("Nodos tras Sesión 1: %d\n", nodosTrasS1)
	fmt.Printf("Nodos tras Sesión 2 (fusionados): %d\n", nodosTrasS2)
	fmt.Printf("Total de aristas globales consolidadas: %d\n", len(global.Edges))

	if nodosTrasS2 < nodosTrasS1 {
		t.Errorf("El grafo global acumulado no debería perder nodos tras fusionar la sesión 2")
	}

	t.Logf("✅ Pipeline de extracción y fusión progresiva completado exitosamente con %d nodos y %d aristas",
		len(global.Nodes), len(global.Edges))
}
