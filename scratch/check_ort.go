package main

import (
	"fmt"
	ort "github.com/yalue/onnxruntime_go"
)

func main() {
	fmt.Printf("ORT loaded %v\n", ort.IsInitialized())
}
