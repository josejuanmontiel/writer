#!/bin/bash
set -e

echo "📥 Descargando librerías binarias para desarrollo local..."

# Crear directorios
mkdir -p lib/tokenizers
mkdir -p lib/onnxruntime/lib

# Descargar libtokenizers (Linux x64)
if [ ! -f "lib/tokenizers/libtokenizers.a" ]; then
    echo "📦 Bajando libtokenizers..."
    wget -q -O libtokenizers.tar.gz https://github.com/daulet/tokenizers/releases/download/v1.26.0/libtokenizers.linux-amd64.tar.gz
    tar -xzf libtokenizers.tar.gz -C lib/tokenizers
    rm libtokenizers.tar.gz
    echo "✅ libtokenizers instalada."
else
    echo "✔ libtokenizers ya presente."
fi

# Descargar ONNX Runtime (Linux x64)
if [ ! -f "lib/onnxruntime/lib/libonnxruntime.so" ]; then
    echo "📦 Bajando ONNX Runtime..."
    wget -q -O lib/onnxruntime/lib/libonnxruntime.so.1.22.0 https://huggingface.co/josejuanmontiel/writer-models/resolve/main/lib/onnxruntime/lib/libonnxruntime.so.1.22.0
    ln -sf libonnxruntime.so.1.22.0 lib/onnxruntime/lib/libonnxruntime.so
    echo "✅ ONNX Runtime instalada."
else
    echo "✔ ONNX Runtime ya presente."
fi

echo "🚀 Todo listo. Ahora puedes ejecutar ./scripts/run.sh"
