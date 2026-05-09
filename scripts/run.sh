#!/bin/bash

# Asegurarnos de que estamos en la raíz del proyecto
cd "$(dirname "$0")/.."

# Variables de entorno para CGO (Whisper y ONNX Runtime local)
export CWD=$(pwd)
export LD_LIBRARY_PATH="$CWD/lib/onnxruntime/lib:$CWD/lib/tokenizers:$LD_LIBRARY_PATH"
export CGO_CFLAGS="-I$CWD/lib/whisper.cpp/include -I$CWD/lib/whisper.cpp/ggml/include -I$CWD/lib/onnxruntime/include"
export CGO_LDFLAGS="-L$CWD/lib/tokenizers -L$CWD/lib/onnxruntime/lib -Wl,-rpath,$CWD/lib/onnxruntime/lib -L$CWD/lib/whisper.cpp/build/src -L$CWD/lib/whisper.cpp/build/ggml/src -lwhisper -lggml -lggml-cpu -lstdc++ -lm -lonnxruntime -ltokenizers"

echo "🚀 Iniciando Antigravity Writer (Estructura Profesional) en modo Desarrollo..."
wails dev -tags "webkit2_41,ORT"
