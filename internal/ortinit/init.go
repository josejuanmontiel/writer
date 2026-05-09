package ortinit

import (
	"fmt"
	ort "github.com/yalue/onnxruntime_go"
)

func init() {
	// Dejamos que use la del sistema (1.24.0) ya que ahora el wrapper pide API 24
	fmt.Println("⚡ [ORT-INIT] Usando librería del sistema (Compatible con API 24)")
	err := ort.InitializeEnvironment()
	if err != nil {
		fmt.Printf("🚨 [ORT-INIT] Error: %v\n", err)
	}
}
