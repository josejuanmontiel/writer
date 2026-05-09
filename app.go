package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"antigravity-writer/internal/ai"
	"antigravity-writer/internal/audio"
	"antigravity-writer/internal/canva"
	"antigravity-writer/internal/config"
	"antigravity-writer/internal/diagram"
	"antigravity-writer/internal/mcp"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx          context.Context
	config       *config.Config
	recorder     *audio.Recorder
	aiProcessor  *ai.AIProcessor
	mcpServer    *mcp.MCPEditorServer
	canvaClient  *canva.CanvaClient
	diagram      *diagram.Manager
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	
	// Cargar Configuración
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("Error cargando configuración: %v\n", err)
	}
	a.config = cfg

	// Inicializar Audio
	rec, err := audio.NewRecorder()
	if err != nil {
		fmt.Printf("Error inicializando audio: %v\n", err)
	}
	a.recorder = rec

	// Inicializar IA
	a.aiProcessor = ai.NewAIProcessor("models", a.config.GLiNER.ModelPath)

	// Inicializar Canva
	a.canvaClient = canva.NewCanvaClient(
		a.config.Canva.ClientID, 
		a.config.Canva.ClientSecret, 
		a.config.Canva.AccessToken, 
		a.config.Canva.RefreshToken, 
		func(access, refresh string) {
			a.config.Canva.AccessToken = access
			a.config.Canva.RefreshToken = refresh
			config.Save(a.config)
		},
	)

	// Inicializar Diagrama
	a.diagram = diagram.NewManager()

	// Inicializar MCP
	a.mcpServer = mcp.NewMCPEditorServer(a)
	go func() {
		if err := a.mcpServer.StartSSE(3000); err != nil {
			fmt.Printf("Error en servidor MCP: %v\n", err)
		}
	}()
}

func (a *App) shutdown(ctx context.Context) {
	if a.recorder != nil {
		a.recorder.Shutdown()
	}
}

// Métodos para el frontend (Wails Bindings)

func (a *App) GetConfig() config.Config {
	return *a.config
}

func (a *App) UpdateConfig(newConfig config.Config) error {
	a.config = &newConfig
	return config.Save(a.config)
}

func (a *App) StartRecording() error {
	fmt.Printf("🎤 Iniciando grabación con dispositivo: %s\n", a.config.RecordingDevice)
	return a.recorder.Start(a.config.RecordingDevice)
}

func (a *App) GetAudioDevices() ([]string, error) {
	return a.recorder.GetDevices()
}

func (a *App) StopRecording(mode string, isAiMode bool) (string, error) {
	fmt.Println("⏹️ Deteniendo grabación...")
	buffer, err := a.recorder.Stop()
	if err != nil {
		return "", err
	}

	fmt.Printf("📊 Audio capturado: %d bytes (~%.2f segundos)\n", len(buffer), float64(len(buffer))/(16000*2))

	fmt.Printf("💾 Guardando audio temporal en: %s\n", a.config.AudioTempPath)
	err = audio.SaveWav(a.config.AudioTempPath, buffer)
	if err != nil {
		return "", err
	}

	var text string
	if a.config.Whisper.UseLocal {
		fmt.Printf("🤖 Transcribiendo localmente (modelo: %s, hilos: %d)...\n", a.config.Whisper.Local.Model, a.config.Whisper.Local.Threads)
		text, err = a.aiProcessor.ModelManager.TranscribeLocal(
			a.config.AudioTempPath, 
			a.config.Whisper.Local.Model, 
			a.config.Whisper.Language, 
			a.config.Whisper.Local.Threads,
		)
	} else {
		fmt.Printf("🌐 Transcribiendo remotamente (URL: %s)...\n", a.config.Whisper.Remote.URL)
		text, err = ai.ProcessAudioRemote(
			a.config.Whisper.Remote.URL, 
			a.config.Whisper.Remote.Model, 
			a.config.Whisper.Language, 
			a.config.AudioTempPath,
		)
	}

	if err != nil {
		fmt.Printf("❌ Error en la transcripción: %v\n", err)
		return "", err
	}

	fmt.Printf("📝 Texto transcrito: %s\n", text)

	if isAiMode {
		fmt.Printf("🧠 Enviando texto a la IA (%s)...\n", a.config.LLMURL)
		go ai.ProcessWithLLM(a.config.LLMURL, text, func(newText string) {
			fmt.Printf("✨ Respuesta de la IA recibida: %s\n", newText)
			a.EmitEvent("mcp:insert_text", newText)
		})
	}

	return text, nil
}

func (a *App) ProcessText(text string, isAi bool) {
	if isAi {
		go ai.ProcessWithLLM(a.config.LLMURL, text, func(newText string) {
			a.EmitEvent("mcp:insert_text", newText)
		})
	} else {
		a.EmitEvent("mcp:insert_text", text)
	}
}

func (a *App) ConnectCanva() error {
	if a.canvaClient == nil {
		return fmt.Errorf("Canva no configurado")
	}
	return a.canvaClient.StartOAuthFlow(func(url string) {
		runtime.BrowserOpenURL(a.ctx, url)
	})
}

func (a *App) ProcessDiagramStep(text string) (string, error) {
	fmt.Printf("📊 Procesando paso de diagrama para: %.50s...\n", text)
	startTime := time.Now()

	// 1. Intentar extracción local si está habilitada
	if a.config.GLiNER.UseLocal && a.aiProcessor.GLiNERProcessor != nil {
		fmt.Println("🤖 Usando GLiNER2 local para extracción de entidades y relaciones...")
		entities, relations, err := a.aiProcessor.GLiNERProcessor.ExtractFromText(context.Background(), text)
		if err != nil {
			fmt.Printf("❌ Error en GLiNER local: %v\n", err)
		} else if len(entities) > 0 || len(relations) > 0 {
			fmt.Printf("✨ GLiNER local detectó %d entidades y %d relaciones:\n", len(entities), len(relations))
			for _, e := range entities {
				fmt.Printf("   → Entidad: '%s' [%s] (score: %.3f)\n", e.Text, e.Label, e.Score)
			}
			for _, r := range relations {
				fmt.Printf("   → Relación: [%s] --(%s)--> [%s] (score: %.3f)\n", r.Head, r.Label, r.Tail, r.Score)
			}

			// Convertir entidades GLiNER a formato de diagrama
			newStep := diagram.DiagramStep{
				ContextText: text,
				Explanation: "Extraído localmente con GLiNER2",
				Nodes:       []diagram.Node{},
				Edges:       []diagram.Edge{},
			}

			// Map to ensure uniqueness and fast lookup for nodes
			nodesMap := make(map[string]diagram.Node)
			validRelationsCount := 0

			// Filtrar ruido: Solo añadimos al diagrama las entidades que forman parte de una relación
			for _, r := range relations {
				if r.Score >= a.config.GLiNER.Threshold {
					validRelationsCount++
					headID := fmt.Sprintf("node_%s", strings.ReplaceAll(r.Head, " ", "_"))
					if _, exists := nodesMap[headID]; !exists {
						nodesMap[headID] = diagram.Node{ID: headID, Label: r.Head, Type: "Concept"} // Opcionalmente podríamos buscar su Type real en entities
					}
					
					tailID := fmt.Sprintf("node_%s", strings.ReplaceAll(r.Tail, " ", "_"))
					if _, exists := nodesMap[tailID]; !exists {
						nodesMap[tailID] = diagram.Node{ID: tailID, Label: r.Tail, Type: "Concept"}
					}
					
					// Add the edge
					newStep.Edges = append(newStep.Edges, diagram.Edge{
						Source: headID,
						Target: tailID,
						Label:  r.Label,
					})
				}
			}

			if validRelationsCount > 0 {
				for _, n := range nodesMap {
					newStep.Nodes = append(newStep.Nodes, n)
				}

				a.diagram.AddStep(newStep)
				jsonResult := a.diagram.ToJSON()
				fmt.Printf("📦 JSON enviado al frontend: %s\n", jsonResult)
				fmt.Printf("⏱️ Extracción local completada en %.2fs\n", time.Since(startTime).Seconds())
				return jsonResult, nil
			} else {
				fmt.Println("ℹ️ GLiNER local no detectó relaciones válidas (score >= threshold).")
			}
		} else {
			fmt.Println("ℹ️ GLiNER local no detectó entidades o relaciones relevantes.")
		}
		fmt.Println("🔄 Reintentando con LLM remoto...")
	}
	
	// Prompt EXTREMADAMENTE directo para evitar razonamientos
	prompt := fmt.Sprintf(`Eres un extractor de datos JSON para grafos relacionales.
Tu única tarea es analizar el texto y extraer entidades y sus relaciones.
REGLA 1: NO pienses, no uses etiquetas <think>.
REGLA 2: NO uses markdown para el JSON, responde solo con las llaves.
REGLA 3: Responde EXCLUSIVAMENTE con un objeto JSON crudo y válido.

Formato requerido:
{
  "nodes": [{"id": "id_unico_1", "label": "Nombre", "type": "Persona|Empresa|Lugar|Concepto"}],
  "edges": [{"source": "id_unico_1", "target": "id_unico_2", "label": "relación (verbo/acción)"}],
  "explanation": "resumen muy breve de la acción principal"
}

Texto a analizar:
%s`, text)

	// Podemos pasar "json" format si el LLM local lo soporta en payload, 
	// pero por ahora dependemos del prompt estricto.
	respText, err := ai.SimpleLLMCall(a.config.LLMURL, prompt)
	duration := time.Since(startTime)
	
	if err != nil {
		fmt.Printf("❌ Error llamando al LLM: %v\n", err)
		return "", err
	}

	fmt.Printf("⏱️ Respuesta del LLM recibida en %.2fs\n", duration.Seconds())
	
	// Limpieza agresiva: buscar el primer '{' y el último '}' en TODA la respuesta original
	// Ignoramos cualquier lógica de <think> previa, vamos directo a la estructura JSON
	startIdx := strings.Index(respText, "{")
	endIdx := strings.LastIndex(respText, "}")
	
	if startIdx == -1 || endIdx == -1 || endIdx < startIdx {
		fmt.Printf("❌ No se encontró estructura JSON { } en la respuesta del LLM\n")
		return "", fmt.Errorf("no se encontró JSON en la respuesta")
	}
	
	cleanJSON := strings.TrimSpace(respText[startIdx : endIdx+1])

	var newStep diagram.DiagramStep
	if err := json.Unmarshal([]byte(cleanJSON), &newStep); err != nil {
		fmt.Printf("❌ Error al deserializar JSON: %v\n", err)
		// Si falla el primer intento, probamos a limpiar posibles caracteres de control
		cleanJSON = strings.Map(func(r rune) rune {
			if r >= 32 && r != 127 {
				return r
			}
			return -1
		}, cleanJSON)
		
		if err := json.Unmarshal([]byte(cleanJSON), &newStep); err != nil {
			return "", fmt.Errorf("error parseando JSON final: %v", err)
		}
	}

	newStep.ContextText = text
	a.diagram.AddStep(newStep)
	
	return a.diagram.ToJSON(), nil
}

func (a *App) GetDiagramSteps() string {
	return a.diagram.ToJSON()
}

func (a *App) ResetDiagram() {
	a.diagram.Reset()
}

// Implementación de AppInterface para MCP
func (a *App) EmitEvent(name string, data interface{}) {
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, name, data)
	}
}

func (a *App) GetCanvaClient() *canva.CanvaClient {
	return a.canvaClient
}

func (a *App) ExtractEntities(text string, labels []string) ([]ai.Entity, error) {
	if a.aiProcessor.GLiNERProcessor == nil {
		return nil, fmt.Errorf("procesador GLiNER no inicializado")
	}
	return a.aiProcessor.GLiNERProcessor.ExtractEntities(context.Background(), text, labels, a.config.GLiNER.Threshold)
}

func (a *App) ExtractFromText(text string) ([]ai.Entity, []ai.Relation, error) {
	if a.aiProcessor.GLiNERProcessor == nil {
		return nil, nil, fmt.Errorf("procesador GLiNER no inicializado")
	}
	return a.aiProcessor.GLiNERProcessor.ExtractFromText(context.Background(), text)
}

func (a *App) SaveProject(text string, diagramJSON string) (string, error) {
	options := runtime.SaveDialogOptions{
		Title: "Guardar Proyecto Antigravity",
		Filters: []runtime.FileFilter{
			{DisplayName: "Antigravity Writer Project (*.agw)", Pattern: "*.agw"},
			{DisplayName: "Archivos JSON (*.json)", Pattern: "*.json"},
		},
		DefaultFilename: "proyecto.agw",
	}

	filepath, err := runtime.SaveFileDialog(a.ctx, options)
	if err != nil {
		return "", err
	}
	if filepath == "" {
		return "", nil // El usuario canceló
	}

	// Crear el objeto a guardar
	projectData := map[string]interface{}{
		"text": text,
		"diagram": diagramJSON,
		"saved_at": time.Now().Format(time.RFC3339),
	}

	data, err := json.MarshalIndent(projectData, "", "  ")
	if err != nil {
		return "", fmt.Errorf("error serializando proyecto: %v", err)
	}

	err = os.WriteFile(filepath, data, 0644)
	if err != nil {
		return "", fmt.Errorf("error guardando archivo: %v", err)
	}

	return filepath, nil
}
