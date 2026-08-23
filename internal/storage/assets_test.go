package storage

import (
	"encoding/base64"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSaveAndListAssetsWithCrossReferences(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "compendium-assets-test-*")
	if err != nil {
		t.Fatalf("Error creando tmpDir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Crear sesión con referencia a una imagen
	s1Dir := filepath.Join(tmpDir, "content", "modulo-1")
	os.MkdirAll(s1Dir, 0755)

	dummyImgB64 := base64.StdEncoding.EncodeToString([]byte("fake-png-image-content-12345"))

	// 1. Guardar Imagen 1 (usada)
	img1, err := SaveAsset(tmpDir, "images", "vela-bautismo.png", dummyImgB64)
	if err != nil {
		t.Fatalf("Error guardando asset: %v", err)
	}

	// 2. Guardar Imagen 2 (huérfana)
	_, err = SaveAsset(tmpDir, "images", "huerfana-sin-uso.png", dummyImgB64)
	if err != nil {
		t.Fatalf("Error guardando asset huérfano: %v", err)
	}

	// Escribir archivo de sesión mencionando img1.Name
	s1Content := `= Sesión 1: El Bautismo
image::assets/images/` + img1.Name + `[Vela, role="left thumb"]
Texto de la catequesis...
`
	os.WriteFile(filepath.Join(s1Dir, "sesion-01.adoc"), []byte(s1Content), 0644)

	// 3. Listar Activos de la Mediateca
	gallery, err := ListCompendiumAssets(tmpDir)
	if err != nil {
		t.Fatalf("Error listando activos: %v", err)
	}

	if gallery.TotalAssets != 2 {
		t.Errorf("TotalAssets esperado 2, obtenido: %d", gallery.TotalAssets)
	}
	if gallery.ImagesCount != 2 {
		t.Errorf("ImagesCount esperado 2, obtenido: %d", gallery.ImagesCount)
	}
	if gallery.OrphansCount != 1 {
		t.Errorf("OrphansCount esperado 1, obtenido: %d", gallery.OrphansCount)
	}

	// Verificar lectura base64
	b64Read, _, err := GetAssetBase64(tmpDir, img1.RelativePath)
	if err != nil || b64Read != dummyImgB64 {
		t.Errorf("GetAssetBase64 devolvió error o contenido diferente")
	}

	// 4. Probar eliminación
	err = DeleteAsset(tmpDir, img1.RelativePath)
	if err != nil {
		t.Fatalf("Error eliminando asset: %v", err)
	}

	galleryAfter, _ := ListCompendiumAssets(tmpDir)
	if galleryAfter.TotalAssets != 1 {
		t.Errorf("TotalAssets tras eliminar esperado 1, obtenido: %d", galleryAfter.TotalAssets)
	}
}

func TestFormatAsciidocImage_BookLayoutPresets(t *testing.T) {
	path := "assets/images/cirio-pascual.png"
	caption := "Cirio Pascual"

	// 1. Preset Flotante Izquierda
	left := FormatAsciidocImage(path, caption, "left", 220)
	if !strings.Contains(left, `role="left thumb"`) || !strings.Contains(left, `width=220`) {
		t.Errorf("Formato left incorrecto: %s", left)
	}

	// 2. Preset Flotante Derecha
	right := FormatAsciidocImage(path, caption, "right", 250)
	if !strings.Contains(right, `role="right thumb"`) || !strings.Contains(right, `width=250`) {
		t.Errorf("Formato right incorrecto: %s", right)
	}

	// 3. Preset Centrado con Pie de Figura
	center := FormatAsciidocImage(path, caption, "center", 400)
	if !strings.Contains(center, `.Cirio Pascual`) || !strings.Contains(center, `align=center`) {
		t.Errorf("Formato center incorrecto: %s", center)
	}

	// 4. Preset Banner Completo
	banner := FormatAsciidocImage(path, caption, "banner", 0)
	if !strings.Contains(banner, `width=100%`) || !strings.Contains(banner, `role="banner-full"`) {
		t.Errorf("Formato banner incorrecto: %s", banner)
	}

	// 5. Preset Icono en Línea
	inline := FormatAsciidocImage(path, caption, "inline", 18)
	if !strings.HasPrefix(inline, "image:") || !strings.Contains(inline, `role="inline"`) {
		t.Errorf("Formato inline incorrecto: %s", inline)
	}
}
