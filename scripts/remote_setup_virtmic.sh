#!/bin/bash
# Script para ejecutar en la MÁQUINA REMOTA (Servidor)

PIPE=/tmp/virtmic

echo "🧹 Limpiando configuraciones previas..."

# 1. Intentar descargar el módulo si existe
MODULE_ID=$(pactl list modules short | grep "source_name=virtmic" | cut -f1)
if [ ! -z "$MODULE_ID" ]; then
    pactl unload-module $MODULE_ID
fi

# 2. Borrar el archivo/pipe físicamente (CRÍTICO para evitar acumulaciones)
rm -f $PIPE

# 3. Cargar el módulo de fuente virtual
# El sistema creará el archivo PIPE limpio de nuevo
echo "🎙️ Creando micrófono virtual 'virtmic'..."
MODULE_ID=$(pactl load-module module-pipe-source \
    source_name=virtmic \
    file=$PIPE \
    format=s16le \
    rate=16000 \
    channels=1)

if [ $? -eq 0 ]; then
    echo "✅ Micrófono virtual listo (ID: $MODULE_ID)"
    echo "🚀 Recuerda arrancar el envío desde tu portátil."
else
    echo "❌ Error al crear el micrófono virtual."
fi
