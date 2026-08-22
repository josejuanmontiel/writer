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

		if envPath := os.Getenv("ORT_LIB_PATH"); envPath != "" {
			if _, err := os.Stat(envPath); err == nil {
				libPath = envPath
			}
		}

		if libPath == "" {
			cwd, _ := os.Getwd()
			searchBases := []string{exeDir, filepath.Dir(exeDir), filepath.Dir(filepath.Dir(exeDir)), cwd, filepath.Dir(cwd), filepath.Dir(filepath.Dir(cwd))}
			
			for _, base := range searchBases {
				var candidates []string
				if runtime.GOOS == "windows" {
					candidates = []string{
						filepath.Join(base, "onnxruntime.dll"),
						filepath.Join(base, "lib", "windows", "onnxruntime.dll"),
					}
				} else if runtime.GOOS == "darwin" {
					candidates = []string{
						filepath.Join(base, "libonnxruntime.dylib"),
						filepath.Join(base, "lib", "onnxruntime", "lib", "libonnxruntime.dylib"),
					}
				} else {
					candidates = []string{
						filepath.Join(base, "libonnxruntime.so"),
						filepath.Join(base, "libonnxruntime.so.1.22.0"),
						filepath.Join(base, "lib", "libonnxruntime.so"),
						filepath.Join(base, "lib", "libonnxruntime.so.1.22.0"),
						filepath.Join(base, "lib", "onnxruntime", "lib", "libonnxruntime.so"),
						filepath.Join(base, "lib", "onnxruntime", "lib", "libonnxruntime.so.1.22.0"),
					}
				}
				for _, cand := range candidates {
					if _, err := os.Stat(cand); err == nil {
						libPath = cand
						break
					}
				}
				if libPath != "" {
					break
				}
			}
		}

		if libPath != "" {
			ort.SetSharedLibraryPath(libPath)
			fmt.Printf("⚡ [ORT-INIT] SetSharedLibraryPath: %s\n", libPath)
		} else {
			fmt.Printf("⚡ [ORT-INIT] No local library found, using system default\n")
		}
	}

	fmt.Println("⚡ [ORT-INIT] Inicializando entorno ONNX Runtime...")
	err = ort.InitializeEnvironment()
	if err != nil {
		fmt.Printf("🚨 [ORT-INIT] Error: %v\n", err)
	}
}
