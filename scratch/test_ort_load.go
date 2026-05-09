package main

import (
	"fmt"
	"os"
	ort "github.com/yalue/onnxruntime_go"
)

func main() {
	ort.SetSharedLibraryPath("../libonnxruntime.so")
	err := ort.InitializeEnvironment()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
	defer ort.DestroyEnvironment()

	fmt.Println("ORT Initialized successfully.")
}
