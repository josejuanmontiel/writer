package ai

import (
	"context"
	"fmt"
	"testing"

	_ "antigravity-writer/internal/ortinit"
)

func TestGLiNERExtraction(t *testing.T) {
	processor, err := NewGLiNER2Processor("../../models/gliner2_native")
	if err != nil {
		t.Skipf("Saltando test: No se pudo cargar el modelo (probablemente faltan librerías nativas): %v", err)
		return
	}

	text := "Steve Jobs founded Apple in Cupertino."
	labels := []string{"person", "organization", "location"}
	
	entities, err := processor.ExtractEntities(context.Background(), text, labels, 0.3)
	if err != nil {
		t.Fatalf("Error en extracción: %v", err)
	}

	fmt.Printf("Entidades encontradas: %d\n", len(entities))
	for _, e := range entities {
		fmt.Printf("- [%s] %s (%.2f)\n", e.Label, e.Text, e.Score)
	}
}

func TestGLiNERRelations(t *testing.T) {
	// Usamos un modelo más completo si está disponible (o el mismo de gliner2)
	processor, err := NewGLiNER2Processor("../../models/gliner2_native")
	if err != nil {
		t.Skipf("Saltando test: No se pudo cargar el modelo gliner2_native: %v", err)
		return
	}

	text := "Lukas Virtanen fundó Nordic AI en Helsinki."
	
	// ExtractFromText es el método E2E que saca entidades y relaciones
	entities, relations, err := processor.ExtractFromText(context.Background(), text)
	if err != nil {
		t.Fatalf("Error en extracción completa: %v", err)
	}

	fmt.Printf("Entidades encontradas: %d\n", len(entities))
	fmt.Printf("Relaciones encontradas: %d\n", len(relations))
	
	for _, r := range relations {
		fmt.Printf(" 🤝 [%s] ---> %s ---> [%s] (Confianza: %.2f)\n", r.Head, r.Label, r.Tail, r.Score)
	}
}
