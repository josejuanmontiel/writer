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
	@echo "  make package-linux-docker - Crea el paquete de Linux dentro de un contenedor Ubuntu 20.04 (Evita error GLIBC)"
	@echo "  make clean         - Elimina los binarios generados"

WHISPER_DIR=$(CURDIR)/lib/whisper.cpp
WHISPER_BUILD_DIR ?= $(WHISPER_DIR)/build-linux
WHISPER_CMAKE_FLAGS ?= -DBUILD_SHARED_LIBS=OFF 

build-whisper:
	@echo "🔨 Compilando whisper.cpp en $$(basename $(WHISPER_BUILD_DIR))..."
	cmake -B $(WHISPER_BUILD_DIR) -S $(WHISPER_DIR) $(WHISPER_CMAKE_FLAGS)
	cmake --build $(WHISPER_BUILD_DIR) --config Release

WAILS_BUILD_TAGS ?= -tags webkit2_41

build-linux: build-whisper
	@echo "🚀 Construyendo para Linux..."
	@echo "Nota: Si tienes errores de GLIBC, compila en una distro más antigua (ej. Ubuntu 20.04)"
	CGO_ENABLED=1 CGO_CFLAGS="-I$(WHISPER_DIR)/include -I$(WHISPER_DIR)/ggml/include" \
	CGO_LDFLAGS="-L$(WHISPER_BUILD_DIR)/src -L$(WHISPER_BUILD_DIR)/ggml/src" \
	wails build $(WAILS_BUILD_TAGS)

build-windows:
	@echo "🚀 Construyendo para Windows..."
	@echo "Nota: Requiere tener instalado x86_64-w64-mingw32-gcc y whisper.cpp compilado para Windows"
	GOOS=windows GOARCH=amd64 CGO_ENABLED=1 \
	CGO_CFLAGS="-I$(WHISPER_DIR)/include -I$(WHISPER_DIR)/ggml/include" \
	CGO_LDFLAGS="-static-libstdc++ -static-libgcc -fopenmp -Wl,-Bstatic -lgomp -Wl,-Bdynamic -lpthread" \
	CC=x86_64-w64-mingw32-gcc \
	CXX=x86_64-w64-mingw32-g++ \
	wails build -platform windows/amd64 -skipbindings

DIST_DIR=dist
APPDIR=$(DIST_DIR)/AppDir
package-linux: build-linux
	@echo "📦 Empaquetando para Linux (AppImage)..."
	rm -rf $(DIST_DIR)
	mkdir -p $(APPDIR)/usr/bin
	mkdir -p $(APPDIR)/usr/lib
	mkdir -p $(APPDIR)/usr/share/applications
	mkdir -p $(APPDIR)/usr/share/icons/hicolor/256x256/apps
	
	# Copiar ejecutable principal
	cp $(BINARY_LINUX) $(APPDIR)/usr/bin/
	
	# Copiar recursos adicionales (config, modelos)
	cp config.json $(APPDIR)/usr/bin/
	mkdir -p $(APPDIR)/usr/bin/models
	cp models/ggml-tiny.bin $(APPDIR)/usr/bin/models/
	cp -r models/gliner2_native $(APPDIR)/usr/bin/models/
	
	# Copiar ONNX Runtime para que linuxdeploy lo intercepte (si no lo hace solo)
	cp lib/onnxruntime/lib/libonnxruntime.so.1.20.1 $(APPDIR)/usr/lib/libonnxruntime.so.1.20.1
	ln -s libonnxruntime.so.1.20.1 $(APPDIR)/usr/lib/libonnxruntime.so || true
	
	# Crear archivo .desktop
	echo "[Desktop Entry]" > $(APPDIR)/usr/share/applications/antigravity-writer.desktop
	echo "Name=Antigravity Writer" >> $(APPDIR)/usr/share/applications/antigravity-writer.desktop
	echo "Exec=writer" >> $(APPDIR)/usr/share/applications/antigravity-writer.desktop
	echo "Icon=antigravity-writer" >> $(APPDIR)/usr/share/applications/antigravity-writer.desktop
	echo "Type=Application" >> $(APPDIR)/usr/share/applications/antigravity-writer.desktop
	echo "Categories=Utility;" >> $(APPDIR)/usr/share/applications/antigravity-writer.desktop
	
	# Copiar icono redimensionado a 256x256
	convert build/appicon.png -resize 256x256 $(APPDIR)/usr/share/icons/hicolor/256x256/apps/antigravity-writer.png
	
	# Ejecutar linuxdeploy
	@echo "Empaquetando con linuxdeploy..."
	export OUTPUT=AntigravityWriter-x86_64.AppImage; \
	linuxdeploy --appdir $(APPDIR) -d $(APPDIR)/usr/share/applications/antigravity-writer.desktop -i $(APPDIR)/usr/share/icons/hicolor/256x256/apps/antigravity-writer.png -e $(APPDIR)/usr/bin/writer --plugin gtk --output appimage
	
	mv AntigravityWriter-x86_64.AppImage ./
	@echo "✅ Paquete creado: ./AntigravityWriter-x86_64.AppImage"

package-linux-docker:
	@echo "🐳 Construyendo contenedor de compilación (Ubuntu 20.04)..."
	docker build -t antigravity-builder -f Dockerfile.build .
	@echo "🐳 Compilando paquete de Linux dentro del contenedor..."
	# Montamos el directorio actual y el caché de go para no descargar todo cada vez
	docker run --entrypoint bash --rm -v $(CURDIR):/app -v go_mod_cache:/go/pkg/mod -e WHISPER_BUILD_DIR=/app/lib/whisper.cpp/build-docker -e WAILS_BUILD_TAGS="" antigravity-builder -c "make package-linux && chown -R $(shell id -u):$(shell id -g) /app/frontend /app/build /app/dist /app/lib/whisper.cpp/build-docker"
	@echo "✅ Paquete compilado en Docker exportado con éxito."

DIST_WIN_DIR=dist-win
package-windows:
	@echo "📦 Empaquetando para Windows (Offline)..."
	rm -rf $(DIST_WIN_DIR)
	mkdir -p $(DIST_WIN_DIR)/models
	# Pasamos CC y CXX para que CGO use los correctos de MinGW
	GOOS=windows GOARCH=amd64 CGO_ENABLED=1 \
	CGO_CFLAGS="-I$(WHISPER_DIR)/include -I$(WHISPER_DIR)/ggml/include" \
	CGO_LDFLAGS="-L$(CURDIR)/lib/windows -static-libstdc++ -static-libgcc -fopenmp -Wl,-Bstatic -lgomp -Wl,-Bdynamic -lpthread -lntdll -lbcrypt" \
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
	@echo "🔨 Compilando whisper.cpp para macOS Universal..."
	cmake -B $(WHISPER_DIR)/build-mac -S $(WHISPER_DIR) -DGGML_METAL=ON -DCMAKE_OSX_ARCHITECTURES="arm64;x86_64"
	cmake --build $(WHISPER_DIR)/build-mac --config Release
	CGO_ENABLED=1 CGO_CFLAGS="-I$(WHISPER_DIR)/include -I$(WHISPER_DIR)/ggml/include" \
	CGO_LDFLAGS="-L$(WHISPER_DIR)/build-mac/src -L$(WHISPER_DIR)/build-mac/ggml/src" \
	wails build -platform darwin/universal

build-mac-arm64:
	@echo "🔨 Compilando whisper.cpp para macOS arm64..."
	cmake -B $(WHISPER_DIR)/build-mac -S $(WHISPER_DIR) -DGGML_METAL=ON
	cmake --build $(WHISPER_DIR)/build-mac --config Release
	CGO_ENABLED=1 CGO_CFLAGS="-I$(WHISPER_DIR)/include -I$(WHISPER_DIR)/ggml/include" \
	CGO_LDFLAGS="-L$(WHISPER_DIR)/build-mac/src -L$(WHISPER_DIR)/build-mac/ggml/src" \
	wails build -platform darwin/arm64

build-mac-amd64:
	@echo "🔨 Compilando whisper.cpp para macOS amd64..."
	cmake -B $(WHISPER_DIR)/build-mac -S $(WHISPER_DIR) -DGGML_METAL=ON
	cmake --build $(WHISPER_DIR)/build-mac --config Release
	CGO_ENABLED=1 CGO_CFLAGS="-I$(WHISPER_DIR)/include -I$(WHISPER_DIR)/ggml/include" \
	CGO_LDFLAGS="-L$(WHISPER_DIR)/build-mac/src -L$(WHISPER_DIR)/build-mac/ggml/src" \
	wails build -platform darwin/amd64

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
	rm -rf $(DIST_DIR) $(DIST_WIN_DIR) $(DIST_MAC_DIR)
	rm -f antigravity-writer-linux-offline.tar.gz
	rm -f antigravity-writer-windows-offline.zip
	rm -f antigravity-writer-macos-offline.zip
	rm -rf $(WHISPER_DIR)/build-*
