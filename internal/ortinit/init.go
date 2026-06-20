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
			// Intentar varias rutas posibles para Linux
			paths := []string{
				filepath.Join(exeDir, "libonnxruntime.so"),
				filepath.Join(exeDir, "libonnxruntime.so.1.22.0"),
				filepath.Join(filepath.Dir(exeDir), "lib", "libonnxruntime.so"),
				filepath.Join(filepath.Dir(exeDir), "lib", "libonnxruntime.so.1.22.0"),
				filepath.Join(filepath.Dir(filepath.Dir(exeDir)), "lib", "onnxruntime", "lib", "libonnxruntime.so"),
				filepath.Join(filepath.Dir(filepath.Dir(exeDir)), "lib", "onnxruntime", "lib", "libonnxruntime.so.1.22.0"),
			}
			for _, p := range paths {
				if _, err := os.Stat(p); err == nil {
					libPath = p
					break
				}
			}
			if libPath == "" {
				// Si no se encuentra ninguno, dejamos que el default apunte al primero esperado
				libPath = filepath.Join(exeDir, "libonnxruntime.so")
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
