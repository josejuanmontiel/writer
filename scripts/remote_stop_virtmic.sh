#!/bin/bash
# Script para limpiar el micrófono virtual en la MÁQUINA REMOTA

PIPE=/tmp/virtmic

echo "🛑 Desactivando micrófono virtual..."

# 1. Descargar el módulo de PulseAudio
# Buscamos el ID del módulo que usa nuestro dispositivo virtmic
MODULE_ID=$(pactl list modules short | grep "source_name=virtmic" | cut -f1)

if [ ! -z "$MODULE_ID" ]; then
    pactl unload-module $MODULE_ID
    echo "✅ Módulo PulseAudio descargado (ID: $MODULE_ID)."
else
    echo "⚠️ No se encontró ningún módulo 'virtmic' activo."
fi

# 2. Borrar el pipe
if [ -p $PIPE ]; then
    rm $PIPE
    echo "✅ Pipe $PIPE eliminado."
fi

echo "✨ Sistema de audio limpio."
