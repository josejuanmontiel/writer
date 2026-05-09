# Guía de Configuración - Antigravity Writer

El archivo `config.json` debe estar en la raíz del proyecto.

## Estructura del Archivo

```json
{
  "whisper": {
    "use_local": true,
    "language": "es",
    "local": {
      "model": "base",
      "threads": 4
    },
    "remote": {
      "url": "http://192.168.1.4:10300/v1/audio/transcriptions",
      "model": "tiny"
    }
  },
  "llm_url": "http://192.168.1.4:8000/v3/chat/completions",
  "kokoro_url": "http://192.168.1.4:8880/v1/audio/speech",
  "recording_device": "Unix FIFO source /tmp/virtmic",
  "audio_temp_path": "/tmp/antigravity_dictation.wav"
}
```

## Parámetros Detallados

### Sección `whisper`
- **`use_local`**: (bool) `true` para usar el motor integrado en el binario (CPU), `false` para usar un servidor externo.
- **`language`**: (string) Idioma de transcripción (ej: "es", "en"). Usa "auto" para detección automática (menos preciso).
- **`local.model`**: (string) Nombre del modelo a descargar/usar. Opciones: `tiny`, `base`, `small`.
- **`local.threads`**: (int) Número de hilos de CPU a utilizar. Recomendado: 4.
- **`remote.url`**: (string) URL del endpoint de transcripción (formato OpenAI).
- **`remote.model`**: (string) Nombre del modelo que espera el servidor remoto.

### Globales
- **`llm_url`**: URL de tu servidor LLM (OpenAI compatible, ej: vLLM, Ollama, Qwen).
- **`kokoro_url`**: URL del servidor TTS para la función de lectura.
- **`recording_device`**: Nombre del dispositivo de captura detectado por la aplicación.
- **`audio_temp_path`**: Ruta temporal para el archivo WAV de dictado.
