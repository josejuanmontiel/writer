#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================================="
echo " 🪟 dockurr/windows: Entorno de prueba Windows en Docker "
echo "=========================================================="

# 1. Comprobar /dev/kvm
if [ ! -e /dev/kvm ]; then
    echo "⚠️  ADVERTENCIA: No se encontró /dev/kvm."
    echo "   La emulación funcionará pero será significativamente más lenta."
fi

# 2. Comprobar docker
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado."
    exit 1
fi

# 3. Preguntar versión si no está definida
VERSION=${1:-"11"}

echo ""
echo "Versión seleccionada: $VERSION"
echo "  - 11     : Windows 11 Pro oficial (~6 GB descarga, ~18 GB disco) [RECOMENDADO]"
echo "  - tiny11 : Imagen ligera de Win11 (~3.5 GB descarga, ~10 GB disco)"
echo ""
echo "Nota: Para cambiar de versión pasa el argumento: ./run-docker.sh 11"
echo ""

export VERSION

echo "🚀 Iniciando contenedor Windows..."
echo "👉 Abre tu navegador en: http://localhost:8006"
echo "👉 O conéctate por RDP a: localhost:3389"
echo ""
echo "📂 Tu carpeta '../dist-win' se montará automáticamente como unidad compartida en Windows."
echo "Presiona Ctrl+C para detener la máquina virtual cuando termines."
echo ""

docker compose up
