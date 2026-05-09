package ai

import (
	"context"
	"fmt"
	"testing"
)

func TestGLiNERExtraction(t *testing.T) {
	processor, err := NewGLiNER2Processor("../../models/gliner2")
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
