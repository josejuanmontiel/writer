# Entorno de Pruebas Windows en Local

Esta carpeta contiene scripts y configuraciones listas para levantar una máquina virtual Windows 11 o Tiny11 en Linux para probar el ejecutable `dist-win/writer.exe` sin complicaciones.

---

## 💾 Comparativa de Espacio en Disco

| Opción | Descarga | Espacio en Disco | Características |
| :--- | :--- | :--- | :--- |
| **dockurr/windows (tiny11)** ⭐ | **~3.5 GB** | **~10 GB** (dinámico) | Instalación desatendida automática, acceso web inmediato en `http://localhost:8006`, monta `dist-win` automáticamente. |
| **dockurr/windows (Win 11 oficial)** | **~6 GB** | **~20 GB** (dinámico) | Windows 11 Pro oficial sin modificar. |
| **Quickemu (Win 11)** | **~6 GB** | **~25 GB** (dinámico) | QEMU/KVM nativo en ventana de escritorio Linux. |

> [!TIP]
> **Ahorro de espacio:** Los discos virtuales usan formato sparse (`qcow2`), lo que significa que solo ocupan el espacio real que se va escribiendo, no los 25GB completos de golpe.

---

## 🚀 Opción 1: Docker (`dockurr/windows`) — *Recomendada*

Usa aceleración por hardware de Linux KVM (`/dev/kvm`).

### Arrancar la VM ligera (Tiny11 - mínimo espacio):
```bash
./run-docker.sh
```

### Arrancar con Windows 11 Pro oficial:
```bash
./run-docker.sh 11
```

### Cómo interactuar con Windows:
1. Abre tu navegador en **`http://localhost:8006`** (o usa un cliente RDP como Remmina a `localhost:3389`).
2. La primera vez se instalará de forma 100% automática en unos minutos.
3. Una vez en el escritorio de Windows:
   - Abre el explorador de archivos.
   - Ve a **Red (Network)** o busca la unidad compartida `\\host.lan\Data` (o unidad `Z:`).
   - Ahí verás directamente los contenidos de tu carpeta `dist-win` (`writer.exe`, modelos y `.dll`).
   - Copia la carpeta al Escritorio o ejecútala directamente.

### Liberar espacio cuando termines:
```bash
docker compose down -v
rm -rf storage/
```

---

## 🐧 Opción 2: Quickemu (Nativo en Linux)

Si prefieres ejecutar una ventana QEMU nativa en lugar de Docker:

1. Instalar Quickemu (si no lo tienes):
   ```bash
   sudo add-apt-repository ppa:flexiondotorg/quickemu
   sudo apt update
   sudo apt install quickemu
   ```
2. Iniciar la máquina virtual:
   ```bash
   ./run-quickemu.sh
   ```

---

## 🔍 Checklist de por qué fallaba antes en Windows real

1. **WebView2 Runtime**: Wails v2 en Windows necesita Microsoft Edge WebView2 para renderizar la interfaz gráfica. En Windows 11 viene preinstalado, pero en Wine de CI no existe.
2. **DLLs de MSVC Runtime**: `onnxruntime.dll` requiere las librerías `vcruntime140.dll`, `vcruntime140_1.dll` y `msvcp140.dll`. Asegúrate de que estén junto a `writer.exe` o de que el sistema tenga instalado el *Visual C++ Redistributable 2015-2022*.
3. **Rutas Unix en `config.json`**: En `config.json`, `"audio_temp_path": "/tmp/antigravity_dictation.wav"` fallará en Windows al grabar voz porque la carpeta `/tmp` no existe de forma nativa en Windows (debe ser `C:\\Temp\\...` o usar el directorio temporal del sistema).
4. **Dispositivo de micrófono**: En `config.json`, `"recording_device": "NoMachine Microphone"` debe coincidir con un dispositivo de entrada real en Windows (o dejarse vacío/por defecto).
