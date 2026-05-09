# Antigravity Writer

Escritor minimalista con superpoderes de dictado local.

## 🚀 Estado Actual del Proyecto

Hemos implementado el esqueleto funcional (MVP) de la aplicación utilizando:
*   **Wails v2 (Go + React)**: Framework para aplicaciones de escritorio nativas.
*   **TipTap**: Editor de texto enriquecido moderno y extensible.
*   **Whisper Local**: Integración con un servidor local de Whisper en el puerto `10300`.
*   **Captura Nativa**: Grabación de audio gestionada por Go (vía `malgo`/miniaudio) para interoperabilidad total entre Linux y Windows. No depende de `arecord`.
*   **Whisper Integrado**: Inferencia local en CPU con descarga automática de modelos (Tiny/Base).
*   **Servidor MCP**: El editor expone un servidor MCP (SSE) en el puerto `3000` para que los LLMs puedan controlarlo directamente.

## 🎙️ Configuración de Dictado Remoto (Virtual Mic)

Si estás desarrollando en una máquina remota (SSH/IDE Remoto) y quieres usar el micrófono de tu portátil, sigue estos pasos:

### 1. En el Servidor (Máquina Remota)
Ejecuta el script para crear el micrófono virtual:
```bash
./remote_setup_virtmic.sh
```
*Esto crea un dispositivo de audio llamado `virtmic` usando PulseAudio/PipeWire.*

### 2. En tu Portátil (Máquina Local)
Ejecuta el script para retransmitir tu voz:
```bash
./local_stream_mic.sh
```
*Asegúrate de editar el script con tu usuario e IP correctos. Mantenlo abierto mientras dictas.*

### 3. Ejecutar la App
```bash
./run.sh
```

## 🛠️ Instalación y Desarrollo

1. **Instalar dependencias**: `go mod tidy` y asegurarte de tener un compilador de C (`gcc`).
2. **Modo Desarrollo**: `wails dev`
3. **Generar Binarios**:
   - Para Linux: `make build-linux`
   - Para Windows (desde Linux): `make build-windows` (Requiere `mingw-w64`)

### 🏁 Compilación Cruzada para Windows
Si estás en Linux y quieres generar el `.exe`, instala el compilador cruzado:
```bash
sudo apt install mingw-w64  # En Ubuntu/Debian
```
Luego usa `make build-windows`. La aplicación utilizará automáticamente el backend de audio de Windows (WASAPI/DirectSound).

### 🤖 Integración con LLMs (MCP)
La aplicación incluye un servidor MCP nativo. Esto permite que un LLM (como Claude o Gemini) pueda escribir en el editor.
- **URL del Servidor**: `http://localhost:3000/mcp`
- **Herramientas disponibles**: `insert_text`, `get_editor_content`.

### 🎙️ Whisper Local vs Remoto
Puedes alternar entre el uso de un servidor externo de Whisper o la inferencia local en tu `config.json`. Consulta la [Guía de Configuración](./CONFIG_GUIDE.md) para más detalles.
```json
{
  "use_local_whisper": true,
  "whisper_model": "ggml-tiny.bin"
}
```
*Si el modelo no existe, se descargará automáticamente al iniciar la aplicación.*

## 📋 Próximos Pasos (TODO)
Ver archivo [TODO.md](./TODO.md) para la lista completa de tareas. Próximo objetivo: Conexión con Canva mediante MCP.

Notas sobre GLiNER:
- https://gemini.google.com/app/ff924737f0f7a9da
- https://github.com/fastino-ai/GLiNER2/blob/main/tutorial/6-relation_extraction.md