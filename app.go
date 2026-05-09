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
	// Inicializar managers básicos de inmediato para evitar race conditions
	return &App{
		diagram:     diagram.NewManager(),
		aiProcessor: ai.NewAIProcessor("models", "models/gliner2_native"), // Valores por defecto, se pueden ajustar luego
	}
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

	// Actualizar IA con el path de la configuración si es necesario
	if a.config != nil && a.config.GLiNER.ModelPath != "" {
		a.aiProcessor = ai.NewAIProcessor("models", a.config.GLiNER.ModelPath)
	}

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

	// El diagrama ya ha sido inicializado en NewApp

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

// ProcessDiagramStep es el método que llama la UI (NO inserta texto en el editor)
func (a *App) ProcessDiagramStep(text string) (string, error) {
	return a.internalProcessDiagramStep(text, false)
}

// ProcessDiagramStepFromMCP es el método que llama el servidor MCP (SÍ inserta texto)
func (a *App) ProcessDiagramStepFromMCP(text string) (string, error) {
	return a.internalProcessDiagramStep(text, true)
}

func (a *App) internalProcessDiagramStep(text string, shouldInsertText bool) (string, error) {
	fmt.Printf("📊 Procesando paso de diagrama para: %.50s...\n", text)
	startTime := time.Now()

	// Evitar duplicados
	steps := a.diagram.GetSteps()
	if len(steps) > 0 && strings.TrimSpace(steps[len(steps)-1].ContextText) == strings.TrimSpace(text) {
		fmt.Println("ℹ️ Saltando procesamiento: el párrafo ya ha sido procesado.")
		return a.diagram.ToJSON(), nil
	}

	if shouldInsertText {
		// Insertar el texto en el editor también (efecto "escritor fantasma")
		a.EmitEvent("mcp:insert_text", text+"\n\n")
	}

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

			// MEMORIA: Obtener entidades previas para continuidad
			existingEntities := make(map[string]string) // label -> id
			for _, step := range a.diagram.GetSteps() {
				for _, node := range step.Nodes {
					existingEntities[strings.ToLower(node.Label)] = node.ID
				}
			}

			// Función para encontrar o crear ID con continuidad
			resolveID := func(label string) string {
				l := strings.ToLower(label)
				// 1. Match exacto
				if id, ok := existingEntities[l]; ok {
					return id
				}
				// 2. Match parcial (ej: "Rodríguez" coincide con "Elena Rodríguez")
				for existingLabel, id := range existingEntities {
					if (strings.Contains(existingLabel, l) || strings.Contains(l, existingLabel)) && len(l) > 3 {
						return id
					}
				}
				// 3. Fallback: ID determinista
				return fmt.Sprintf("node_%s", strings.ReplaceAll(label, " ", "_"))
			}

			// Filtrar ruido: Solo añadimos al diagrama las entidades que forman parte de una relación
			for _, r := range relations {
				if r.Score >= a.config.GLiNER.Threshold {
					validRelationsCount++
					
					headID := resolveID(r.Head)
					if _, exists := nodesMap[headID]; !exists {
						nodesMap[headID] = diagram.Node{ID: headID, Label: r.Head, Type: "Concept"}
					}
					
					tailID := resolveID(r.Tail)
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
	
	// Preparar contexto previo para continuidad del grafo (solo nodos y aristas)
	steps = a.diagram.GetSteps()
	contextHistory := ""
	if len(steps) > 0 {
		start := len(steps) - 2
		if start < 0 {
			start = 0
		}
		recentSteps := steps[start:]
		
		// Simplificamos para no saturar al LLM: solo IDs y Labels
		type SimpleStep struct {
			Nodes []diagram.Node `json:"nodes"`
			Edges []diagram.Edge `json:"edges"`
		}
		var simplifiedContext []SimpleStep
		for _, s := range recentSteps {
			simplifiedContext = append(simplifiedContext, SimpleStep{
				Nodes: s.Nodes,
				Edges: s.Edges,
			})
		}

		historyJSON, _ := json.MarshalIndent(simplifiedContext, "", "  ")
		contextHistory = fmt.Sprintf("\n--- CONTEXTO PREVIO DEL GRAFO (para continuidad) ---\n%s\n--- FIN DEL CONTEXTO ---\n", string(historyJSON))
	}

	// Prompt EXTREMADAMENTE directo para evitar razonamientos
	prompt := fmt.Sprintf(`Eres un extractor de datos JSON para grafos relacionales.
Tu única tarea es analizar el texto y extraer entidades y sus relaciones.

REGLA DE CONTINUIDAD: Si las entidades mencionadas en el texto actual ya aparecen en el "CONTEXTO PREVIO", DEBES usar exactamente el mismo "id" para referirte a ellas. Esto permite que el grafo sea conexo y coherente.
Si detectas que una entidad nueva tiene una relación con una del contexto previo, crea el enlace correspondiente usando los IDs existentes.

REGLA 1: NO pienses, no uses etiquetas <think>.
REGLA 2: NO uses markdown para el JSON, responde solo con las llaves.
REGLA 3: Responde EXCLUSIVAMENTE con un objeto JSON crudo y válido.

Formato requerido:
{
  "nodes": [{"id": "id_unico_1", "label": "Nombre", "type": "Persona|Empresa|Lugar|Concepto"}],
  "edges": [{"source": "id_unico_1", "target": "id_unico_2", "label": "relación (verbo/acción)"}],
  "explanation": "resumen muy breve de la acción principal"
}

%s

Texto a analizar:
%s`, contextHistory, text)

	fmt.Printf("📡 Enviando prompt al LLM (%d bytes)...\n", len(prompt))
	respText, err := ai.SimpleLLMCall(a.config.LLMURL, prompt)
	duration := time.Since(startTime)
	
	if err != nil {
		fmt.Printf("❌ Error llamando al LLM: %v\n", err)
		return "", err
	}

	fmt.Printf("⏱️ Respuesta del LLM recibida en %.2fs. Longitud: %d caracteres.\n", duration.Seconds(), len(respText))
	
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

	// Normalización
	if newStep.Nodes == nil {
		newStep.Nodes = []diagram.Node{}
	}
	if newStep.Edges == nil {
		newStep.Edges = []diagram.Edge{}
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

// SaveDiagramStep guarda los cambios manuales en un paso específico
func (a *App) SaveDiagramStep(index int, nodes []diagram.Node, edges []diagram.Edge) bool {
	if a.diagram == nil {
		return false
	}
	
	// Obtener el paso original para conservar el texto de contexto y la explicación
	steps := a.diagram.GetSteps()
	if index < 0 || index >= len(steps) {
		return false
	}
	
	updatedStep := steps[index]
	updatedStep.Nodes = nodes
	updatedStep.Edges = edges
	
	return a.diagram.UpdateStep(index, updatedStep)
}

func (a *App) UpdateDiagramStep(index int, stepJSON string) error {
	var step diagram.DiagramStep
	if err := json.Unmarshal([]byte(stepJSON), &step); err != nil {
		return fmt.Errorf("error parseando JSON del paso: %v", err)
	}

	if !a.diagram.UpdateStep(index, step) {
		return fmt.Errorf("índice de paso no válido: %d", index)
	}

	fmt.Printf("✏️ Paso de diagrama %d actualizado manualmente\n", index)
	return nil
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

// Métodos para gestión de modelos Whisper

func (a *App) GetAvailableWhisperModels() []string {
	return []string{"tiny", "base", "small", "medium", "large-v3-turbo"}
}

func (a *App) GetDownloadedWhisperModels() []string {
	downloaded := []string{}
	modelsDir := "models"
	files, err := os.ReadDir(modelsDir)
	if err != nil {
		return downloaded
	}

	for _, file := range files {
		if !file.IsDir() && strings.HasPrefix(file.Name(), "ggml-") && strings.HasSuffix(file.Name(), ".bin") {
			name := strings.TrimPrefix(file.Name(), "ggml-")
			name = strings.TrimSuffix(name, ".bin")
			downloaded = append(downloaded, name)
		}
	}
	return downloaded
}

func (a *App) ChangeWhisperModel(modelName string) error {
	fmt.Printf("🔄 Cambiando modelo Whisper a: %s\n", modelName)
	
	// Asegurar que el modelo esté descargado con seguimiento de progreso
	_, err := a.aiProcessor.ModelManager.EnsureModel(modelName, func(percent int) {
		a.EmitEvent("whisper:download_progress", map[string]interface{}{
			"model":   modelName,
			"percent": percent,
		})
	})

	if err != nil {
		return err
	}

	// Actualizar configuración
	a.config.Whisper.Local.Model = modelName
	return config.Save(a.config)
}
