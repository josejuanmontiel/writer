package main

import (
	"fmt"
	"os"
	"strings"
)

// ListDownloadedModels devuelve una lista de los modelos presentes en la carpeta local
func ListDownloadedModels(modelsDir string) []string {
	if modelsDir == "" {
		modelsDir = "models"
	}
	
	files, err := os.ReadDir(modelsDir)
	if err != nil {
		fmt.Printf("Error al leer carpeta de modelos: %v\n", err)
		return []string{}
	}

	var downloaded []string
	for _, file := range files {
		if !file.IsDir() && strings.HasPrefix(file.Name(), "ggml-") && strings.HasSuffix(file.Name(), ".bin") {
			name := strings.TrimPrefix(file.Name(), "ggml-")
			name = strings.TrimSuffix(name, ".bin")
			downloaded = append(downloaded, name)
		}
	}
	return downloaded
}
