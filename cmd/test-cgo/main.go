package main

import (
	"fmt"
	"os"

	// Uncomment these one by one to see which one breaks the build with libc6 issues
	_ "github.com/ggerganov/whisper.cpp/bindings/go"
	_ "github.com/yalue/onnxruntime_go"
	_ "hugot-gliner2"
)

func main() {
	fmt.Println("¡Hola! Test de compilación simplificado.")
	fmt.Println("Si esto compila y ejecuta, el entorno base de Go está bien.")
	fmt.Println("Siguiente paso: descomentar las dependencias en main.go una por una.")
	os.Exit(0)
}
