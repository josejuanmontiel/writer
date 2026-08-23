package storage

import (
	"encoding/base64"
	"os"
	"strings"
	"testing"
)

func TestStructureTranscription_BraindumpParsing(t *testing.T) {
	// Braindump verbal realista de un catequista
	transcript := `Hoy vamos a explicar el sacramento del Bautismo a los niños de primer año.
El Bautismo es el primer sacramento que nos hace hijos de Dios y nos limpia del pecado original. La vela que encendemos representa la luz de Cristo que nos acompaña siempre.
Para los materiales necesitamos velas blancas para todos los niños y agua bendita.
¿Qué significa ser hijo de Dios? ¿Por qué encendemos una vela blanca?
Para la actividad en grupos vamos a pedirles que hagan un dibujo de una pila bautismal con su familia.
Como compromiso para esta semana vamos a rezar un Padre Nuestro antes de dormir.`

	draft := StructureTranscription(transcript, "El Bautismo y la Luz de Cristo", "assets/audio/sesion-01/explicacion.wav")

	if !strings.Contains(draft.Objective, "Hoy vamos a explicar") {
		t.Errorf("Objetivo no capturado correctamente: %s", draft.Objective)
	}

	if len(draft.ResourcesList) == 0 {
		t.Errorf("No se detectaron los materiales mencionados")
	}

	if len(draft.StudentQuestions) < 2 {
		t.Errorf("Se esperaban al menos 2 preguntas para el alumno, obtenidas: %d", len(draft.StudentQuestions))
	}

	if !strings.Contains(draft.GeneratedAsciidoc, "[STUDENT]") {
		t.Errorf("El documento generado no incluye bloque [STUDENT]")
	}

	if !strings.Contains(draft.GeneratedAsciidoc, "[WORKSHOP]") {
		t.Errorf("El documento generado no incluye bloque [WORKSHOP]")
	}

	if !strings.Contains(draft.GeneratedAsciidoc, "audio::assets/audio/sesion-01/explicacion.wav") {
		t.Errorf("El documento generado no incluye la macro de audio")
	}
}

func TestSaveSessionAudioResource_InAssetsAudio(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "compendium-audio-resource-test-*")
	if err != nil {
		t.Fatalf("Error creando tmpDir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dummyAudio := base64.StdEncoding.EncodeToString([]byte("RIFF1234WAVEfmt 1234data1234"))

	asset, err := SaveSessionAudioResource(tmpDir, "modulo-1", "bautismo-oral.wav", dummyAudio)
	if err != nil {
		t.Fatalf("Error guardando audio como recurso: %v", err)
	}

	if !strings.HasPrefix(asset.RelativePath, "assets/audio") && !strings.HasPrefix(asset.RelativePath, "assets\\audio") {
		t.Errorf("Ruta de audio no está en assets/audio: %s", asset.RelativePath)
	}

	gallery, err := ListCompendiumAssets(tmpDir)
	if err != nil {
		t.Fatalf("Error listando activos: %v", err)
	}

	if gallery.AudiosCount != 1 {
		t.Errorf("Se esperaba 1 audio en la mediateca, obtenidos: %d", gallery.AudiosCount)
	}
}
