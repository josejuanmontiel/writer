#!/bin/bash
# Script para descargar los modelos desde Hugging Face bypassando Git LFS

BASE_URL="https://huggingface.co/josejuanmontiel/writer-models/resolve/main"
MODELS_DIR="$(dirname "$0")"

echo "📥 Descargando modelos desde Hugging Face..."

# Crear carpeta para GLiNER si no existe
mkdir -p "$MODELS_DIR/gliner2_native"

# Lista de archivos a descargar
files=(
    "ggml-tiny.bin"
    "gliner2_native/count_embed.onnx"
    "gliner2_native/count_embed.onnx.data"
    "gliner2_native/encoder.onnx"
    "gliner2_native/encoder.onnx.data"
    "gliner2_native/gliner_classifiers.safetensors"
    "gliner2_native/prompt_ids.json"
    "gliner2_native/tokenizer.json"
)

for file in "${files[@]}"; do
    echo "⬇️ Descargando $file..."
    wget -q --show-progress -O "$MODELS_DIR/$file" "$BASE_URL/$file"
done

echo "✅ Todos los modelos han sido descargados en la carpeta $MODELS_DIR"
