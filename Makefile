APP_NAME=antigravity-writer
BINARY_LINUX=build/bin/writer
BINARY_WINDOWS=build/bin/writer.exe

.PHONY: all build-linux build-windows clean help package-linux

all: build-linux

help:
	@echo "Comandos disponibles:"
	@echo "  make build-linux   - Compila la aplicación para Linux"
	@echo "  make build-windows - Compila la aplicación para Windows"
	@echo "  make package-linux - Crea un tar.gz con modelos para uso offline"
	@echo "  make clean         - Elimina los binarios generados"

WHISPER_DIR=$(CURDIR)/lib/whisper.cpp

build-linux:
	@echo "🚀 Construyendo para Linux..."
	@echo "Nota: Si tienes errores de GLIBC, compila en una distro más antigua (ej. Ubuntu 20.04)"
	CGO_ENABLED=1 CGO_CFLAGS="-I$(WHISPER_DIR)/include -I$(WHISPER_DIR)/ggml/include" wails build -tags webkit2_41

build-windows:
	@echo "🚀 Construyendo para Windows..."
	@echo "Nota: Requiere tener instalado x86_64-w64-mingw32-gcc y whisper.cpp compilado para Windows"
	GOOS=windows GOARCH=amd64 CGO_ENABLED=1 \
	CGO_CFLAGS="-I$(WHISPER_DIR)/include -I$(WHISPER_DIR)/ggml/include" \
	CGO_LDFLAGS="-static-libstdc++ -static-libgcc" \
	CC=x86_64-w64-mingw32-gcc \
	CXX=x86_64-w64-mingw32-g++ \
	wails build -platform windows/amd64 -skipbindings

DIST_DIR=dist
package-linux: build-linux
	@echo "📦 Empaquetando para Linux (Offline)..."
	rm -rf $(DIST_DIR)
	mkdir -p $(DIST_DIR)/lib
	mkdir -p $(DIST_DIR)/models
	cp $(BINARY_LINUX) $(DIST_DIR)/
	cp config.json $(DIST_DIR)/
	# Copiar ONNX Runtime (necesario para GLiNER local)
	cp lib/onnxruntime/lib/libonnxruntime.so.1.20.1 $(DIST_DIR)/lib/libonnxruntime.so
	# Copiar modelos (ajustar según necesidad de espacio)
	cp models/ggml-tiny.bin $(DIST_DIR)/models/
	cp -r models/gliner2_native $(DIST_DIR)/models/
	# Crear script de arranque para configurar librerías
	@echo '#!/bin/bash' > $(DIST_DIR)/run.sh
	@echo 'export LD_LIBRARY_PATH=./lib:$$LD_LIBRARY_PATH' >> $(DIST_DIR)/run.sh
	@echo './writer' >> $(DIST_DIR)/run.sh
	chmod +x $(DIST_DIR)/run.sh
	tar -czf antigravity-writer-linux-offline.tar.gz -C $(DIST_DIR) .
	@echo "✅ Paquete creado: antigravity-writer-linux-offline.tar.gz"

DIST_WIN_DIR=dist-win
package-windows:
	@echo "📦 Empaquetando para Windows (Offline)..."
	rm -rf $(DIST_WIN_DIR)
	mkdir -p $(DIST_WIN_DIR)/models
	# Pasamos CC y CXX para que CGO use los correctos de MinGW
	GOOS=windows GOARCH=amd64 CGO_ENABLED=1 \
	CGO_CFLAGS="-I$(WHISPER_DIR)/include -I$(WHISPER_DIR)/ggml/include" \
	CGO_LDFLAGS="-static-libstdc++ -static-libgcc" \
	CC=x86_64-w64-mingw32-gcc \
	CXX=x86_64-w64-mingw32-g++ \
	wails build -platform windows/amd64 -skipbindings
	
	cp build/bin/writer.exe $(DIST_WIN_DIR)/
	cp config.json $(DIST_WIN_DIR)/
	# Copiar DLLs necesarias (deben estar en lib/windows)
	-cp lib/windows/*.dll $(DIST_WIN_DIR)/
	# Copiar modelos
	cp models/ggml-tiny.bin $(DIST_WIN_DIR)/models/
	cp -r models/gliner2_native $(DIST_WIN_DIR)/models/
	zip -r antigravity-writer-windows-offline.zip $(DIST_WIN_DIR)
	@echo "⚠️  Nota: Asegúrate de tener las DLLs (whisper, tokenizers, onnxruntime) en lib/windows"
	@echo "✅ Paquete creado: antigravity-writer-windows-offline.zip"

DIST_MAC_DIR=dist-mac

# Compilar para macOS (Arquitecturas específicas si falla universal)
build-mac-universal:
	CGO_ENABLED=1 wails build -platform darwin/universal

build-mac-arm64:
	CGO_ENABLED=1 wails build -platform darwin/arm64

build-mac-amd64:
	CGO_ENABLED=1 wails build -platform darwin/amd64

package-macos:
	@echo "📦 Empaquetando para macOS (Offline)..."
	@echo "Nota: Si falla darwin/universal, usa build-mac-arm64 o build-mac-amd64"
	rm -rf $(DIST_MAC_DIR)
	mkdir -p $(DIST_MAC_DIR)/models
	# Intentar universal, si falla avisar
	CGO_ENABLED=1 wails build -platform darwin/universal || (echo "❌ Falló build universal. Intenta compilar para tu arquitectura específica." && exit 1)
	
	cp -r build/bin/antigravity-writer.app $(DIST_MAC_DIR)/
	cp config.json $(DIST_MAC_DIR)/
	# En macOS las librerías suelen ir dentro del .app/Contents/Frameworks
	# Pero para simplicidad en este script offline:
	cp models/ggml-tiny.bin $(DIST_MAC_DIR)/models/
	cp -r models/gliner2_native $(DIST_MAC_DIR)/models/
	zip -r antigravity-writer-macos-offline.zip $(DIST_MAC_DIR)
	@echo "✅ Paquete creado: antigravity-writer-macos-offline.zip"

clean:
	@echo "🧹 Limpiando..."
	rm -rf build/bin/*
	rm -rf $(DIST_DIR) $(DIST_WIN_DIR)
	rm -f antigravity-writer-linux-offline.tar.gz
	rm -f antigravity-writer-windows-offline.zip
