#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================================="
echo " 🪟 Quickemu: Entorno de prueba Windows nativo con QEMU "
echo "=========================================================="

# 1. Comprobar si quickemu y quickget están instalados
if ! command -v quickemu &> /dev/null || ! command -v quickget &> /dev/null; then
    echo "❌ quickemu no está instalado en tu sistema."
    echo ""
    echo "Para instalarlo en Ubuntu/Debian ejecuta:"
    echo "  sudo add-apt-repository ppa:flexiondotorg/quickemu"
    echo "  sudo apt update"
    echo "  sudo apt install quickemu"
    echo ""
    echo "O en Arch Linux:"
    echo "  yay -S quickemu"
    echo ""
    exit 1
fi

VM_NAME="windows-11"
CONF_FILE="${VM_NAME}.conf"

# 2. Descargar y generar configuración si no existe
if [ ! -f "$CONF_FILE" ]; then
    echo "📥 Descargando ISO oficial y generando configuración para Windows 11..."
    quickget windows 11
fi

echo ""
echo "🚀 Arrancando máquina virtual Windows 11 con Quickemu..."
echo "📂 Para compartir la carpeta dist-win, se puede usar samba o arrastrar archivos vía SPICE WebDAV."
echo ""

quickemu --vm "$CONF_FILE" --public-dir "$DIR/../dist-win"
