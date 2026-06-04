package ortinit

import (
	"fmt"
	ort "github.com/yalue/onnxruntime_go"
	"os"
	"path/filepath"
	"runtime"
)

func init() {
	// Configurar la ruta de la librería compartida de ONNX Runtime si está empaquetada
	exePath, err := os.Executable()
	if err == nil {
		exeDir := filepath.Dir(exePath)
		var libPath string

		if runtime.GOOS == "windows" {
			libPath = filepath.Join(exeDir, "onnxruntime.dll")
		} else if runtime.GOOS == "darwin" {
			libPath = filepath.Join(exeDir, "libonnxruntime.dylib")
		} else {
			// Intentar al lado del ejecutable (para offline simple)
			libPath = filepath.Join(exeDir, "libonnxruntime.so")
			if _, err := os.Stat(libPath); os.IsNotExist(err) {
				// Intentar en ../lib (para AppImage usr/bin -> usr/lib)
				libPath = filepath.Join(filepath.Dir(exeDir), "lib", "libonnxruntime.so")
			}
		}

		if _, err := os.Stat(libPath); err == nil {
			ort.SetSharedLibraryPath(libPath)
			fmt.Printf("⚡ [ORT-INIT] SetSharedLibraryPath: %s\n", libPath)
		} else {
			fmt.Printf("⚡ [ORT-INIT] No local library found at %s, using system default\n", libPath)
		}
	}

	fmt.Println("⚡ [ORT-INIT] Inicializando entorno ONNX Runtime...")
	err = ort.InitializeEnvironment()
	if err != nil {
		fmt.Printf("🚨 [ORT-INIT] Error: %v\n", err)
	}
}
