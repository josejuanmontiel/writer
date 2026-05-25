#!/bin/bash
set -e

echo "=== Generando los paquetes offline (Linux y Windows) ==="
make package-linux-docker
make package-windows

echo "=== Creando Dockerfile temporal para test ==="
cat << 'EOF' > Dockerfile.test
# Usamos una imagen limpia de Ubuntu 22.04
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Instalamos GTK/WebKit (para Linux) y Wine (para Windows)
RUN dpkg --add-architecture i386 && apt-get update && apt-get install -y \
    libgtk-3-0 \
    libwebkit2gtk-4.0-37 \
    libwebkit2gtk-4.1-0 \
    curl \
    tar \
    unzip \
    wine64 \
    wine32 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY antigravity-writer-linux-offline.tar.gz /app/
COPY antigravity-writer-windows-offline.zip /app/

# TEST WINDOWS
RUN echo "--- Testeando binario de Windows con Wine ---"
RUN unzip -q antigravity-writer-windows-offline.zip
# Iniciamos Wine en modo Headless (xvfb). Usamos timeout para abortar cuando el programa arranque exitosamente,
# porque las apps Wails de escritorio se quedan bloqueando el hilo indefinidamente.
# Si falta alguna DLL esencial (ej: whisper, onnxruntime, o CGO C++ stdlib), 
# Wine escupirá un error de módulo no encontrado y puede que retorne código de error.
# Redirigimos stderr para inspeccionarlo.
RUN xvfb-run -a timeout 10 wine64 dist-win/writer.exe 2> wine_err.log || true
RUN if grep -i "module not found" wine_err.log || grep -i "failed to load" wine_err.log; then \
      echo "ERROR: Faltan DLLs dinámicas en el binario de Windows."; \
      cat wine_err.log; \
      exit 1; \
    else \
      echo "ÉXITO: Test de Windows completado sin errores de DLL perdidas."; \
    fi

# TEST LINUX
RUN echo "--- Testeando binario de Linux ---"
RUN mkdir linux-dist && tar -xzf antigravity-writer-linux-offline.tar.gz -C linux-dist/
# Primero un escaneo estático de librerías vinculadas en tiempo de compilación
# Nota: Pasamos LD_LIBRARY_PATH para que ldd encuentre las librerías empaquetadas en dist/lib/
RUN if env LD_LIBRARY_PATH=./linux-dist/lib ldd linux-dist/writer | grep -i "not found"; then \
      echo "ERROR: Faltan librerías dinámicas en el binario de Linux."; \
      exit 1; \
    fi

# Ahora una ejecución real (en servidor X11 virtual) para atrapar dependencias de dlopen o webkit
RUN echo "--- Ejecutando binario de Linux en Xvfb ---"
RUN xvfb-run -a env LD_LIBRARY_PATH=./linux-dist/lib timeout 10 ./linux-dist/writer 2> linux_err.log || true
RUN if grep -i -E "symbol lookup error|segmentation fault|core dumped|cannot open shared object file" linux_err.log; then \
      echo "ERROR: El binario de Linux falló al intentar ejecutarse."; \
      cat linux_err.log; \
      exit 1; \
    else \
      echo "ÉXITO: Test de ejecución de Linux (Xvfb) completado sin crashes inmediatos."; \
    fi

EOF

echo "=== Construyendo contenedor para simular usuario final ==="
docker build -t antigravity-test-dist -f Dockerfile.test .

echo "=== Limpiando... ==="
rm Dockerfile.test
echo "=== ¡Test superado! Se han verificado las distribuciones de Linux y Windows exitosamente. ==="
