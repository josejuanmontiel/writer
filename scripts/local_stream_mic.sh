#!/bin/bash
# Script para ejecutar en tu PORTÁTIL LOCAL

# --- CONFIGURACIÓN ---
REMOTE_USER="jose"
REMOTE_IP="core5"
# ---------------------

echo "🎤 Capturando micrófono local y enviando a $REMOTE_USER@$REMOTE_IP..."
echo "Press Ctrl+C to stop"

# Captura el micro local y lo envía por SSH al pipe del servidor
arecord -f S16_LE -c 1 -r 16000 | ssh $REMOTE_USER@$REMOTE_IP "cat > /tmp/virtmic"
