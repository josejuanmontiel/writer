#!/bin/bash
set -e

# Posicionarse en la raíz del proyecto
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# 1. Asegurar dependencias binarias necesarias (ONNX Runtime, libtokenizers)
if [ -f "./scripts/setup_libs.sh" ]; then
    ./scripts/setup_libs.sh
fi

# 2. Configurar entorno de ejecución (librerías compartidas)
export LD_LIBRARY_PATH="$DIR/lib/onnxruntime/lib:$DIR/lib/tokenizers:$LD_LIBRARY_PATH"

WHISPER_DIR="$DIR/lib/whisper.cpp"
WHISPER_BUILD_DIR="$WHISPER_DIR/build-linux"

MODE="${1:-run}"

case "$MODE" in
    dev|--dev)
        echo "🚀 Iniciando Antigravity Writer en Modo Desarrollo (Hot Reloading)..."
        export CGO_ENABLED=1
        export CGO_CFLAGS="-I$WHISPER_DIR/include -I$WHISPER_DIR/ggml/include"
        export CGO_LDFLAGS="-L$WHISPER_BUILD_DIR/src -L$WHISPER_BUILD_DIR/ggml/src"
        wails dev -tags webkit2_41
        ;;
    build|--build)
        echo "🔨 Compilando y ejecutando binario de producción..."
        make build-linux
        echo "🚀 Lanzando ./build/bin/writer..."
        ./build/bin/writer
        ;;
    *)
        if [ ! -f "build/bin/writer" ]; then
            echo "📦 Binario no encontrado. Compilando por primera vez..."
            make build-linux
        fi
        echo "🚀 Lanzando Antigravity Writer..."
        ./build/bin/writer
        ;;
esac
