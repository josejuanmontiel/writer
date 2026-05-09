package main
import (
    "fmt"
    ort "github.com/yalue/onnxruntime_go"
)
func main() {
    ort.SetSharedLibraryPath("../libonnxruntime.so")
    err := ort.InitializeEnvironment()
    if err != nil {
        fmt.Println("Error env:", err)
        return
    }
    defer ort.DestroyEnvironment()

    fmt.Println("ORT Environment Initialized")
}
