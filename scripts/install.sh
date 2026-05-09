#!/bin/bash

# Script de instalación de dependencias para Antigravity Writer
# Optimizado para Debian Trixie / Ubuntu 24.04+

set -e

echo "🛠️ Preparando el entorno de desarrollo..."

# 1. Dependencias del sistema
echo "📦 Instalando librerías de sistema..."
sudo apt update
sudo apt install -y \
    build-essential \
    pkg-config \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    alsa-utils \
    curl \
    nodejs \
    npm

# 2. Instalación de Wails
if ! command -v wails &> /dev/null
then
    echo "🐹 Instalando Wails CLI..."
    go install github.com/wailsapp/wails/v2/cmd/wails@latest
    export PATH=$PATH:$(go env GOPATH)/bin
    echo "Añade 'export PATH=\$PATH:\$(go env GOPATH)/bin' a tu .bashrc para mayor comodidad."
else
    echo "✅ Wails CLI ya está presente."
fi

# 3. Dependencias del frontend
echo "⚛️ Instalando paquetes de Node..."
if [ -d "frontend" ]; then
    cd frontend
    npm install
    cd ..
fi

echo ""
echo "🚀 Todo listo. Usa './run.sh' para arrancar la aplicación."
