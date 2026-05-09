package main

import (
	"context"
	"fmt"
	"log"
	"time"
	"antigravity-writer/internal/ai"
)

func main() {
	fmt.Println("🧪 Iniciando test de integración local GLiNER2...")
	
	// 1. Inicializar el procesador con la ruta de los modelos
	processor, err := ai.NewGLiNER2Processor("models/gliner2")
	if err != nil {
		log.Fatalf("❌ Error cargando el modelo: %v", err)
	}
	fmt.Println("✅ Modelo cargado correctamente.")

	// 2. Definir texto y etiquetas de prueba
	text := "Steve Jobs founded Apple Inc. in Cupertino, California. He was a visionary leader."
	labels := []string{"person", "organization", "location", "role"}
	threshold := float32(0.3)

	fmt.Printf("🔍 Analizando texto: \"%s\"\n", text)
	fmt.Printf("🏷️ Etiquetas: %v\n", labels)

	// 3. Ejecutar extracción
	start := time.Now()
	entities, err := processor.ExtractEntities(context.Background(), text, labels, threshold)
	duration := time.Since(start)

	if err != nil {
		log.Fatalf("❌ Error en la extracción: %v", err)
	}

	// 4. Mostrar resultados
	fmt.Printf("\n✨ Resultados (%d entidades encontradas en %.2fs):\n", len(entities), duration.Seconds())
	for _, e := range entities {
		fmt.Printf(" - [%s] \"%s\" (Score: %.2f, Pos: %d-%d)\n", e.Label, e.Text, e.Score, e.Start, e.End)
	}
	
	if len(entities) == 0 {
		fmt.Println("ℹ️ No se detectaron entidades. Revisa los pesos del modelo o el threshold.")
	}
}
