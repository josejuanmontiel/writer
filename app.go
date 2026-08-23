package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"antigravity-writer/internal/ai"
	"antigravity-writer/internal/audio"
	"antigravity-writer/internal/canva"
	"antigravity-writer/internal/config"
	"antigravity-writer/internal/diagram"
	"antigravity-writer/internal/git"
	"antigravity-writer/internal/mcp"
	"antigravity-writer/internal/models"
	"antigravity-writer/internal/storage"
	"antigravity-writer/internal/updater"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const AppVersion = "v1.3.0"

// App struct
type App struct {
	ctx              context.Context
	config           *config.Config
	recorder         *audio.Recorder
	aiProcessor      *ai.AIProcessor
	mcpServer        *mcp.MCPEditorServer
	canvaClient      *canva.CanvaClient
	diagram          *diagram.Manager
	updater          *updater.Updater
	modelManager     *models.Manager
	headless         bool
	activeCompendium *storage.CompendiumInfo
	activeFilePath   string
}

// NewApp creates a new App application struct
func NewApp() *App {
	// Inicializar managers básicos de inmediato para evitar race conditions
	return &App{
		config:       &config.Config{},
		diagram:      diagram.NewManager(),
		aiProcessor:  ai.NewAIProcessor("models", "models/gliner2_native"), // Valores por defecto, se pueden ajustar luego
		updater:      updater.NewUpdater(AppVersion),
		modelManager: models.NewManager("models"),
	}
}

// startup is called when the app starts. The context is saved
func (a *App) startup(ctx context.Context) {
	fmt.Println("🚀 [STARTUP] entering...")
	os.Stdout.Sync()
	a.ctx = ctx
	
	// Limpieza de ejecutables temporales de updates anteriores (.old)
	updater.CleanupOldExecutables()
	
	// Cargar Configuración
	fmt.Println("🚀 [STARTUP] loading config...")
	os.Stdout.Sync()
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("Error cargando configuración: %v\n", err)
	}
	a.config = cfg
	fmt.Println("🚀 [STARTUP] config loaded.")
	os.Stdout.Sync()

	// Auto-recuperar último compendio si está configurado y el directorio existe
	if a.config != nil && a.config.LastCompendiumPath != "" {
		if _, err := os.Stat(a.config.LastCompendiumPath); err == nil {
			fmt.Printf("🚀 [STARTUP] auto-reopening compendium: %s\n", a.config.LastCompendiumPath)
			os.Stdout.Sync()
			info, openErr := storage.OpenCompendium(a.config.LastCompendiumPath)
			if openErr == nil {
				a.activeCompendium = info
				if a.config.LastOpenedFile != "" {
					a.activeFilePath = a.config.LastOpenedFile
				} else {
					a.activeFilePath = "content/modulo-1/sesion-01.md"
				}
			} else {
				fmt.Printf("Aviso: No se pudo auto-abrir compendio anterior: %v\n", openErr)
				a.config.LastCompendiumPath = ""
				config.Save(a.config)
			}
		} else {
			a.config.LastCompendiumPath = ""
			config.Save(a.config)
		}
	}

	// Inicializar Audio (solo si no es modo headless/mcp-only)
	if !a.headless {
		fmt.Println("🚀 [STARTUP] initializing audio recorder...")
		os.Stdout.Sync()
		rec, err := audio.NewRecorder()
		if err != nil {
			fmt.Printf("Error inicializando audio: %v\n", err)
		}
		a.recorder = rec
	} else {
		fmt.Println("🔇 Modo headless/mcp-only: omitiendo inicialización del grabador de audio")
		os.Stdout.Sync()
	}

	// Actualizar IA con el path de la configuración si es necesario
	if a.config != nil && a.config.GLiNER.ModelPath != "" {
		fmt.Printf("🚀 [STARTUP] initializing AI Processor with path: %s...\n", a.config.GLiNER.ModelPath)
		os.Stdout.Sync()
		a.aiProcessor = ai.NewAIProcessor("models", a.config.GLiNER.ModelPath)
	}

	// Inicializar Canva
	fmt.Println("🚀 [STARTUP] initializing Canva client...")
	os.Stdout.Sync()
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
	fmt.Println("🚀 [STARTUP] initializing MCP server...")
	os.Stdout.Sync()
	a.mcpServer = mcp.NewMCPEditorServer(a)
	go func() {
		fmt.Println("🚀 [STARTUP] starting MCP SSE server on port 3000...")
		os.Stdout.Sync()
		if err := a.mcpServer.StartSSE(3000); err != nil {
			fmt.Printf("Error en servidor MCP: %v\n", err)
			os.Stdout.Sync()
		}
	}()
	fmt.Println("🚀 [STARTUP] startup completed successfully.")
	os.Stdout.Sync()
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
	if a.recorder == nil {
		return fmt.Errorf("grabador de audio no inicializado (modo headless)")
	}
	fmt.Printf("🎤 Iniciando grabación con dispositivo: %s\n", a.config.RecordingDevice)
	a.recorder.SetLevelCallback(func(level, peak int) {
		a.EmitEvent("audio:level", map[string]interface{}{
			"level":     level,
			"peak":      peak,
			"recording": true,
			"device":    a.config.RecordingDevice,
		})
	})
	return a.recorder.Start(a.config.RecordingDevice)
}

func (a *App) StartMicTest(deviceName string) error {
	if a.recorder == nil {
		return fmt.Errorf("grabador de audio no inicializado")
	}
	if deviceName == "" && a.config != nil {
		deviceName = a.config.RecordingDevice
	}
	fmt.Printf("🎤 Iniciando prueba de nivel de audio para: %s\n", deviceName)
	return a.recorder.StartMonitor(deviceName, func(level, peak int) {
		a.EmitEvent("audio:level", map[string]interface{}{
			"level":   level,
			"peak":    peak,
			"testing": true,
			"device":  deviceName,
		})
	})
}

func (a *App) StopMicTest() error {
	if a.recorder == nil {
		return nil
	}
	fmt.Println("⏹️ Deteniendo prueba de micrófono")
	return a.recorder.StopMonitor()
}

func (a *App) GetAudioDevices() ([]string, error) {
	if a.recorder == nil {
		return nil, fmt.Errorf("grabador de audio no inicializado (modo headless)")
	}
	return a.recorder.GetDevices()
}

func (a *App) GetAppLogs() (string, error) {
	logPaths := []string{"writer.log"}
	if exePath, err := os.Executable(); err == nil {
		logPaths = append(logPaths, filepath.Join(filepath.Dir(exePath), "writer.log"))
	}

	for _, p := range logPaths {
		if data, err := os.ReadFile(p); err == nil {
			if len(data) > 300*1024 {
				data = data[len(data)-300*1024:]
			}
			return string(data), nil
		}
	}
	return "No se ha encontrado el archivo writer.log o aún no hay registros.", nil
}

func (a *App) ClearAppLogs() error {
	logPaths := []string{"writer.log"}
	if exePath, err := os.Executable(); err == nil {
		logPaths = append(logPaths, filepath.Join(filepath.Dir(exePath), "writer.log"))
	}
	for _, p := range logPaths {
		_ = os.WriteFile(p, []byte(""), 0644)
	}
	return nil
}

func (a *App) StopRecording(mode string, isAiMode bool) (string, error) {
	if a.recorder == nil {
		return "", fmt.Errorf("grabador de audio no inicializado (modo headless)")
	}
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

func (a *App) TranscribeAudioFile(path string) (string, error) {
	if path == "" {
		path = a.config.AudioTempPath
	}
	if a.aiProcessor == nil || a.aiProcessor.ModelManager == nil {
		return "", fmt.Errorf("AI Processor no inicializado")
	}
	fmt.Printf("🤖 Transcribiendo archivo de audio: %s (modelo: %s, idioma: %s)...\n", path, a.config.Whisper.Local.Model, a.config.Whisper.Language)
	text, err := a.aiProcessor.ModelManager.TranscribeLocal(
		path,
		a.config.Whisper.Local.Model,
		a.config.Whisper.Language,
		a.config.Whisper.Local.Threads,
	)
	if err != nil {
		fmt.Printf("❌ Error transcribiendo archivo: %v\n", err)
		return "", err
	}
	fmt.Printf("📝 Transcripción completada: %s\n", text)
	a.EmitEvent("mcp:insert_text", text)
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
	if a.headless {
		fmt.Printf("[Headless Event] %s: %v\n", name, data)
		return
	}
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
	if a.aiProcessor != nil && a.aiProcessor.ModelManager != nil && a.aiProcessor.ModelManager.ModelsPath != "" {
		modelsDir = a.aiProcessor.ModelManager.ModelsPath
	}
	files, err := os.ReadDir(modelsDir)
	if err != nil {
		if exePath, err := os.Executable(); err == nil {
			modelsDir = filepath.Join(filepath.Dir(exePath), "models")
			files, err = os.ReadDir(modelsDir)
		}
	}
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

// -------------------------------------------------------------
// Métodos de Gestión de Compendios y Persistencia Git (1.1)
// -------------------------------------------------------------

// SelectFolderDialog opens a native OS dialog to select a directory
func (a *App) SelectFolderDialog(title string) (string, error) {
	if title == "" {
		title = "Seleccionar Carpeta del Compendio"
	}
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: title,
	})
	if err != nil {
		return "", err
	}
	return dir, nil
}

// CreateCompendium initializes a new compendium project with git
func (a *App) CreateCompendium(dirPath string, name string, description string, author string, email string) (*storage.CompendiumInfo, error) {
	if dirPath == "" {
		return nil, fmt.Errorf("debe seleccionar un directorio válido")
	}

	meta := storage.ProjectMeta{
		ID:          fmt.Sprintf("comp-%d", time.Now().Unix()),
		Name:        name,
		Description: description,
		Author:      author,
		Email:       email,
	}

	info, err := storage.CreateCompendium(dirPath, meta)
	if err != nil {
		return nil, err
	}

	a.activeCompendium = info
	a.activeFilePath = "content/modulo-1/sesion-01.md"

	if a.config != nil {
		a.config.AddRecentCompendium(dirPath, name)
		a.config.LastOpenedFile = a.activeFilePath
		config.Save(a.config)
	}

	return info, nil
}

// OpenCompendium opens an existing compendium project
func (a *App) OpenCompendium(dirPath string) (*storage.CompendiumInfo, error) {
	if dirPath == "" {
		return nil, fmt.Errorf("debe seleccionar un directorio válido")
	}

	info, err := storage.OpenCompendium(dirPath)
	if err != nil {
		return nil, err
	}

	a.activeCompendium = info
	if a.config != nil && a.config.LastOpenedFile != "" && a.config.LastCompendiumPath == dirPath {
		a.activeFilePath = a.config.LastOpenedFile
	} else {
		a.activeFilePath = "content/modulo-1/sesion-01.md"
	}

	if a.config != nil {
		a.config.AddRecentCompendium(dirPath, info.Meta.Name)
		a.config.LastOpenedFile = a.activeFilePath
		config.Save(a.config)
	}

	return info, nil
}

// CloseCompendium closes active compendium and reverts to free draft mode
func (a *App) CloseCompendium() error {
	a.activeCompendium = nil
	a.activeFilePath = ""
	if a.config != nil {
		a.config.LastCompendiumPath = ""
		a.config.LastOpenedFile = ""
		return config.Save(a.config)
	}
	return nil
}

// ConvertDraftToCompendium creates a new compendium and saves the current draft text as first lesson
func (a *App) ConvertDraftToCompendium(dirPath string, name string, description string, author string, email string, draftText string) (*storage.CompendiumInfo, error) {
	info, err := a.CreateCompendium(dirPath, name, description, author, email)
	if err != nil {
		return nil, err
	}

	if strings.TrimSpace(draftText) != "" {
		// Guardar el borrador en la primera sesión
		lessonRel := "content/modulo-1/sesion-01.adoc"
		saveErr := a.SaveCompendiumFile(lessonRel, draftText, "Inicializar lección con borrador redactado")
		if saveErr != nil {
			fmt.Printf("Aviso: no se pudo volcar borrador completo: %v\n", saveErr)
		}
	}

	return info, nil
}

// GenerateCompendiumFromWizard generates a structured compendium with modules, sessions and calendar
func (a *App) GenerateCompendiumFromWizard(cfg storage.WizardConfig) (*storage.CompendiumInfo, error) {
	info, err := storage.GenerateCompendiumFromWizard(cfg)
	if err != nil {
		return nil, err
	}

	a.activeCompendium = info
	a.activeFilePath = "content/modulo-1/sesion-01.adoc"
	if len(cfg.Modules) > 0 && cfg.Modules[0].Slug != "" {
		a.activeFilePath = fmt.Sprintf("content/%s/sesion-01.adoc", cfg.Modules[0].Slug)
	}

	if a.config != nil {
		a.config.LastCompendiumPath = cfg.TargetDir
		a.config.LastOpenedFile = a.activeFilePath
		a.config.AddRecentCompendium(cfg.TargetDir, info.Meta.Name)
		config.Save(a.config)
	}

	return info, nil
}


// GetRecentCompendiums returns the list of recently opened compendiums
func (a *App) GetRecentCompendiums() []config.RecentCompendium {
	if a.config == nil {
		return []config.RecentCompendium{}
	}
	return a.config.RecentCompendiums
}

// GetInitialSessionState returns active compendium, file, initial content and recent workspaces
func (a *App) GetInitialSessionState() map[string]interface{} {
	result := map[string]interface{}{
		"active_compendium": a.activeCompendium,
		"active_file":       a.activeFilePath,
		"initial_content":   "",
		"recent_compendiums": []config.RecentCompendium{},
	}

	if a.config != nil {
		result["recent_compendiums"] = a.config.RecentCompendiums
	}

	if a.activeCompendium != nil && a.activeFilePath != "" {
		content, err := storage.ReadFile(a.activeCompendium.Path, a.activeFilePath)
		if err == nil {
			result["initial_content"] = content
		}
	}

	return result
}

// GetActiveCompendium returns the current active compendium metadata
func (a *App) GetActiveCompendium() *storage.CompendiumInfo {
	return a.activeCompendium
}

// GetCompendiumTree returns the file tree hierarchy for the UI
func (a *App) GetCompendiumTree() ([]storage.FileNode, error) {
	if a.activeCompendium == nil {
		return []storage.FileNode{}, nil
	}
	return storage.GetFileTree(a.activeCompendium.Path)
}

// ReadCompendiumFile reads a file from the active compendium
func (a *App) ReadCompendiumFile(relativePath string) (string, error) {
	if a.activeCompendium == nil {
		return "", fmt.Errorf("no hay ningún compendio abierto")
	}
	content, err := storage.ReadFile(a.activeCompendium.Path, relativePath)
	if err != nil {
		return "", err
	}
	a.activeFilePath = relativePath
	if a.config != nil {
		a.config.LastOpenedFile = relativePath
		config.Save(a.config)
	}
	return content, nil
}

// SaveCompendiumFile saves a file to the active compendium and creates an automatic commit
func (a *App) SaveCompendiumFile(relativePath string, content string, commitMsg string) error {
	if a.activeCompendium == nil {
		return fmt.Errorf("no hay ningún compendio abierto")
	}

	authorName := a.activeCompendium.Meta.Author
	authorEmail := a.activeCompendium.Meta.Email

	err := storage.SaveLessonFile(a.activeCompendium.Path, relativePath, content, commitMsg, authorName, authorEmail)
	if err != nil {
		return err
	}

	a.activeFilePath = relativePath
	return nil
}

// CreateCompendiumFile creates a new lesson or note in the compendium
func (a *App) CreateCompendiumFile(relativePath string, templateName string) error {
	if a.activeCompendium == nil {
		return fmt.Errorf("no hay ningún compendio abierto")
	}

	authorName := a.activeCompendium.Meta.Author
	authorEmail := a.activeCompendium.Meta.Email

	return storage.CreateFile(a.activeCompendium.Path, relativePath, "", "", authorName, authorEmail)
}

// RenameCompendiumFile updates the main title and/or path of a file in the compendium
func (a *App) RenameCompendiumFile(oldRelPath string, newRelPath string, newTitle string) (string, error) {
	if a.activeCompendium == nil {
		return "", fmt.Errorf("no hay ningún compendio abierto")
	}

	authorName := a.activeCompendium.Meta.Author
	authorEmail := a.activeCompendium.Meta.Email

	finalPath, err := storage.UpdateFileTitleAndRename(a.activeCompendium.Path, oldRelPath, newRelPath, newTitle, authorName, authorEmail)
	if err != nil {
		return "", err
	}

	if a.activeFilePath == oldRelPath {
		a.activeFilePath = finalPath
	}

	return finalPath, nil
}

// DeleteCompendiumFile deletes a single file from the active compendium
func (a *App) DeleteCompendiumFile(relativePath string) error {
	if a.activeCompendium == nil {
		return fmt.Errorf("no hay ningún compendio abierto")
	}

	authorName := a.activeCompendium.Meta.Author
	authorEmail := a.activeCompendium.Meta.Email

	err := storage.DeleteCompendiumFile(a.activeCompendium.Path, relativePath, authorName, authorEmail)
	if err != nil {
		return err
	}

	if a.activeFilePath == relativePath {
		a.activeFilePath = ""
	}

	return nil
}


// GetFileTimeline returns the git commit history for the specified file (or whole project if empty)
func (a *App) GetFileTimeline(relativePath string) ([]git.CommitInfo, error) {
	if a.activeCompendium == nil {
		return []git.CommitInfo{}, nil
	}
	return git.GetFileHistory(a.activeCompendium.Path, relativePath, 50)
}

// GetFileHistoricalContent retrieves the file content at a specific git commit
func (a *App) GetFileHistoricalContent(relativePath string, commitHash string) (string, error) {
	if a.activeCompendium == nil {
		return "", fmt.Errorf("no hay ningún compendio abierto")
	}
	return git.GetFileContentAtCommit(a.activeCompendium.Path, commitHash, relativePath)
}

// GetCompendiumStatus returns the git status of files in the active compendium
func (a *App) GetCompendiumStatus() ([]git.FileStatus, error) {
	if a.activeCompendium == nil {
		return []git.FileStatus{}, nil
	}
	return git.GetStatus(a.activeCompendium.Path)
}

// CreateCompendiumModule creates a new module directory in content/
func (a *App) CreateCompendiumModule(moduleSlug string, title string, description string) error {
	if a.activeCompendium == nil {
		return fmt.Errorf("no hay ningún compendio abierto")
	}

	authorName := a.activeCompendium.Meta.Author
	authorEmail := a.activeCompendium.Meta.Email

	return storage.CreateModule(a.activeCompendium.Path, moduleSlug, title, description, authorName, authorEmail)
}

// GetCompendiumModules returns all available modules in the active compendium
func (a *App) GetCompendiumModules() ([]storage.ModuleInfo, error) {
	if a.activeCompendium == nil {
		return []storage.ModuleInfo{}, nil
	}
	return storage.GetModules(a.activeCompendium.Path)
}

// UpdateCompendiumModule updates module metadata in _index.adoc
func (a *App) UpdateCompendiumModule(moduleSlug string, newTitle string, newDescription string) error {
	if a.activeCompendium == nil {
		return fmt.Errorf("no hay ningún compendio abierto")
	}

	authorName := a.activeCompendium.Meta.Author
	authorEmail := a.activeCompendium.Meta.Email

	return storage.UpdateModule(a.activeCompendium.Path, moduleSlug, newTitle, newDescription, authorName, authorEmail)
}

// DeleteCompendiumModule deletes a module directory and its files from the compendium
func (a *App) DeleteCompendiumModule(moduleSlug string) error {
	if a.activeCompendium == nil {
		return fmt.Errorf("no hay ningún compendio abierto")
	}

	authorName := a.activeCompendium.Meta.Author
	authorEmail := a.activeCompendium.Meta.Email

	return storage.DeleteModule(a.activeCompendium.Path, moduleSlug, authorName, authorEmail)
}

// CreateJournalEntry creates a new DevLog entry in content/journal/
func (a *App) CreateJournalEntry(title string, relatedSession string) (string, error) {
	if a.activeCompendium == nil {
		return "", fmt.Errorf("no hay ningún compendio abierto")
	}

	authorName := a.activeCompendium.Meta.Author
	authorEmail := a.activeCompendium.Meta.Email

	return storage.CreateJournalEntry(a.activeCompendium.Path, title, "", relatedSession, authorName, authorEmail)
}

// GetJournalEntries returns all DevLog entries in the active compendium
func (a *App) GetJournalEntries() ([]storage.JournalEntryInfo, error) {
	if a.activeCompendium == nil {
		return []storage.JournalEntryInfo{}, nil
	}
	return storage.GetJournalEntries(a.activeCompendium.Path)
}

// -------------------------------------------------------------
// 🧩 Métodos de Gestión Progresiva de Grafos y Staging (Punto 1.4)
// -------------------------------------------------------------

// GetGlobalGraph devuelve el grafo curricular consolidado acumulado del compendio
func (a *App) GetGlobalGraph() (*storage.GraphData, error) {
	if a.activeCompendium == nil {
		return &storage.GraphData{Version: "1.0", Nodes: []storage.GraphNode{}, Edges: []storage.GraphEdge{}}, nil
	}
	return storage.LoadGlobalGraph(a.activeCompendium.Path)
}

// GetChapterGraph devuelve el grafo conceptual local de un capítulo o tema específico
func (a *App) GetChapterGraph(relativePath string) (*storage.ChapterGraph, error) {
	if a.activeCompendium == nil {
		return &storage.ChapterGraph{RelativePath: relativePath, Nodes: []storage.GraphNode{}, Edges: []storage.GraphEdge{}}, nil
	}
	return storage.LoadChapterGraph(a.activeCompendium.Path, relativePath)
}

// SaveChapterGraph guarda el subgrafo local de un capítulo y lo fusiona automáticamente con el grafo global
func (a *App) SaveChapterGraph(relativePath string, chGraph storage.ChapterGraph) error {
	if a.activeCompendium == nil {
		return fmt.Errorf("no hay ningún compendio abierto")
	}

	chGraph.RelativePath = relativePath
	if err := storage.SaveChapterGraph(a.activeCompendium.Path, &chGraph); err != nil {
		return err
	}

	globalGraph, err := storage.LoadGlobalGraph(a.activeCompendium.Path)
	if err != nil {
		globalGraph = &storage.GraphData{Version: "1.0", Nodes: []storage.GraphNode{}, Edges: []storage.GraphEdge{}}
	}

	globalGraph = storage.MergeChapterGraph(globalGraph, &chGraph)
	if err := storage.SaveGlobalGraph(a.activeCompendium.Path, globalGraph); err != nil {
		return err
	}

	// Auto-commit del grafo
	authorName := a.activeCompendium.Meta.Author
	authorEmail := a.activeCompendium.Meta.Email
	git.CommitFiles(a.activeCompendium.Path, []string{storage.GraphGlobalFile}, "Actualizar grafo global acumulado", authorName, authorEmail)

	return nil
}

// ExtractAndMergeChapterGraph extrae entidades y relaciones usando GLiNER2 nativo y actualiza los grafos local y global
func (a *App) ExtractAndMergeChapterGraph(relativePath string, content string) (*storage.ChapterGraph, error) {
	if a.activeCompendium == nil {
		return nil, fmt.Errorf("no hay ningún compendio abierto")
	}

	plainText := cleanHtmlForExtraction(content)
	if plainText == "" {
		plainText = content
	}

	title := storage.ExtractDocumentTitle(plainText)
	if title == "" {
		title = filepath.Base(relativePath)
	}

	chGraph := &storage.ChapterGraph{
		RelativePath: relativePath,
		Title:        title,
		Nodes:        []storage.GraphNode{},
		Edges:        []storage.GraphEdge{},
		ExtractedAt:  time.Now(),
	}

	isUnassigned := strings.HasPrefix(filepath.ToSlash(filepath.Clean(relativePath)), "content/unassigned/")

	// Extraer usando GLiNER2 si está disponible
	if a.aiProcessor != nil && a.aiProcessor.GLiNERProcessor != nil {
		entities, relations, err := a.aiProcessor.GLiNERProcessor.ExtractFromText(context.Background(), plainText)
		if err == nil {
			nodeMap := make(map[string]storage.GraphNode)
			for _, ent := range entities {
				id := storage.NormalizeConceptID(ent.Text)
				if id == "" {
					continue
				}
				nodeType := ent.Label
				if nodeType == "" || nodeType == "Concept" {
					nodeType = "Concepto"
				}
				nodeMap[id] = storage.GraphNode{
					ID:           id,
					Label:        ent.Text,
					Type:         nodeType,
					SourceFiles:  []string{relativePath},
					Occurrences:  1,
					IsUnassigned: isUnassigned,
				}
			}

			for _, rel := range relations {
				srcID := storage.NormalizeConceptID(rel.Head)
				tgtID := storage.NormalizeConceptID(rel.Tail)
				if srcID == "" || tgtID == "" || srcID == tgtID {
					continue
				}
				if _, ok := nodeMap[srcID]; !ok {
					nodeMap[srcID] = storage.GraphNode{ID: srcID, Label: rel.Head, Type: "Concepto", SourceFiles: []string{relativePath}, Occurrences: 1, IsUnassigned: isUnassigned}
				}
				if _, ok := nodeMap[tgtID]; !ok {
					nodeMap[tgtID] = storage.GraphNode{ID: tgtID, Label: rel.Tail, Type: "Concepto", SourceFiles: []string{relativePath}, Occurrences: 1, IsUnassigned: isUnassigned}
				}

				chGraph.Edges = append(chGraph.Edges, storage.GraphEdge{
					ID:           fmt.Sprintf("%s--%s-->%s", srcID, rel.Label, tgtID),
					Source:       srcID,
					Target:       tgtID,
					Label:        rel.Label,
					Score:        rel.Score,
					SourceFiles:  []string{relativePath},
					IsUnassigned: isUnassigned,
				})
			}

			for _, n := range nodeMap {
				chGraph.Nodes = append(chGraph.Nodes, n)
			}
		}
	}

	// Persistir grafo de capítulo
	if err := storage.SaveChapterGraph(a.activeCompendium.Path, chGraph); err != nil {
		return nil, err
	}

	// Fusionar con grafo global acumulado
	globalGraph, err := storage.LoadGlobalGraph(a.activeCompendium.Path)
	if err != nil {
		globalGraph = &storage.GraphData{Version: "1.0", Nodes: []storage.GraphNode{}, Edges: []storage.GraphEdge{}}
	}

	globalGraph = storage.MergeChapterGraph(globalGraph, chGraph)
	if err := storage.SaveGlobalGraph(a.activeCompendium.Path, globalGraph); err != nil {
		return nil, err
	}

	return chGraph, nil
}

// GetContextSuggestions devuelve conceptos previos aprendidos en el curso para autocompletado en el editor
func (a *App) GetContextSuggestions(relativePath string) (*storage.ContextSuggestions, error) {
	if a.activeCompendium == nil {
		return &storage.ContextSuggestions{
			PreviousConcepts:        []storage.GraphNode{},
			GlobalConcepts:          []storage.GraphNode{},
			PrerequisiteSuggestions: []storage.GraphEdge{},
		}, nil
	}
	return storage.GetContextSuggestions(a.activeCompendium.Path, relativePath)
}

// GetUnassignedTopics lista los temas y reflexiones flotantes en content/unassigned/
func (a *App) GetUnassignedTopics() ([]storage.UnassignedTopicInfo, error) {
	if a.activeCompendium == nil {
		return []storage.UnassignedTopicInfo{}, nil
	}
	return storage.GetUnassignedTopics(a.activeCompendium.Path)
}

// CreateUnassignedTopic crea un nuevo borrador de tema flotante
func (a *App) CreateUnassignedTopic(title string, initialContent string) (string, error) {
	if a.activeCompendium == nil {
		return "", fmt.Errorf("no hay ningún compendio abierto")
	}
	authorName := a.activeCompendium.Meta.Author
	authorEmail := a.activeCompendium.Meta.Email
	return storage.CreateUnassignedTopic(a.activeCompendium.Path, title, initialContent, authorName, authorEmail)
}

// AnalyzeUnassignedPlacement analiza los prerrequisitos de un tema flotante y recomienda su posición ideal
func (a *App) AnalyzeUnassignedPlacement(topicRelPath string) (*storage.PlacementSuggestion, error) {
	if a.activeCompendium == nil {
		return nil, fmt.Errorf("no hay ningún compendio abierto")
	}
	return storage.AnalyzeUnassignedPlacement(a.activeCompendium.Path, topicRelPath)
}

// PromoteUnassignedTopic reubica y asigna un tema flotante a un módulo del compendio
func (a *App) PromoteUnassignedTopic(topicRelPath string, targetModuleSlug string, sessionTitle string) (string, error) {
	if a.activeCompendium == nil {
		return "", fmt.Errorf("no hay ningún compendio abierto")
	}
	authorName := a.activeCompendium.Meta.Author
	authorEmail := a.activeCompendium.Meta.Email
	return storage.PromoteUnassignedTopic(a.activeCompendium.Path, topicRelPath, targetModuleSlug, sessionTitle, authorName, authorEmail)
}

func cleanHtmlForExtraction(html string) string {
	// Reemplazar saltos de línea HTML por saltos reales
	r := strings.ReplaceAll(html, "<br>", "\n")
	r = strings.ReplaceAll(r, "<br/>", "\n")
	r = strings.ReplaceAll(r, "</p>", "\n")
	r = strings.ReplaceAll(r, "</div>", "\n")
	r = strings.ReplaceAll(r, "</h1>", "\n")
	r = strings.ReplaceAll(r, "</h2>", "\n")
	r = strings.ReplaceAll(r, "</h3>", "\n")

	// Quitar tags HTML
	re := regexp.MustCompile(`<[^>]*>`)
	cleaned := re.ReplaceAllString(r, " ")

	// Normalizar espacios
	lines := strings.Split(cleaned, "\n")
	var resultLines []string
	for _, l := range lines {
		trimmed := strings.TrimSpace(l)
		if trimmed != "" {
			resultLines = append(resultLines, trimmed)
		}
	}
	return strings.Join(resultLines, "\n")
}



// -------------------------------------------------------------
// Métodos de Auto-Updater (GitHub Releases)
// -------------------------------------------------------------

// GetAppVersion devuelve la versión actual de la aplicación
func (a *App) GetAppVersion() string {
	return AppVersion
}

// CheckAppUpdate consulta si existe una versión más reciente en GitHub
func (a *App) CheckAppUpdate() (*updater.UpdateInfo, error) {
	if a.updater == nil {
		return nil, fmt.Errorf("updater no inicializado")
	}
	return a.updater.CheckForUpdates()
}

// ApplyAppUpdate descarga y aplica la actualización con emisión de progreso
func (a *App) ApplyAppUpdate(downloadURL string) error {
	if a.updater == nil {
		return fmt.Errorf("updater no inicializado")
	}
	return a.updater.DownloadAndApplyUpdate(downloadURL, func(percent int) {
		a.EmitEvent("app:update_progress", map[string]interface{}{
			"percent": percent,
		})
	})
}

// RestartApp reinicia la aplicación aplicando la nueva versión
func (a *App) RestartApp() error {
	return updater.RestartApp()
}

// -------------------------------------------------------------
// Métodos de Gestor de Modelos de IA (Model Hub)
// -------------------------------------------------------------

// GetModelCatalogStatus devuelve el catálogo con el estado actual de cada modelo
func (a *App) GetModelCatalogStatus() []models.ModelInfo {
	if a.modelManager == nil {
		return []models.ModelInfo{}
	}
	return a.modelManager.GetCatalogStatus()
}

// DownloadModel descarga o repara un modelo emitiendo progreso en tiempo real
func (a *App) DownloadModel(modelID string) error {
	if a.modelManager == nil {
		return fmt.Errorf("model manager no inicializado")
	}
	return a.modelManager.DownloadModel(modelID, func(percent int) {
		a.EmitEvent("model:download_progress", map[string]interface{}{
			"modelId": modelID,
			"percent": percent,
		})
	})
}

// DeleteModel elimina un modelo local para liberar espacio
func (a *App) DeleteModel(modelID string) error {
	if a.modelManager == nil {
		return fmt.Errorf("model manager no inicializado")
	}
	return a.modelManager.DeleteModel(modelID)
}

// -------------------------------------------------------------
// Métodos de Agilidad Pedagógica y Coherencia Conceptual (Punto 1.4)
// -------------------------------------------------------------

// ExtractSelectionToUnassigned extrae un fragmento de texto seleccionado y crea un tema flotante independiente
func (a *App) ExtractSelectionToUnassigned(sourceRelPath string, selectionText string, title string) (map[string]string, error) {
	if a.compendiumManager == nil {
		return nil, fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	meta := a.compendiumManager.GetMeta()

	unassignedRel, modifiedSource, err := storage.ExtractSelectionToUnassigned(targetDir, sourceRelPath, selectionText, title, meta.Author, meta.Email)
	if err != nil {
		return nil, err
	}

	// Extraer subgrafo automáticamente para la nueva idea en background
	go func() {
		cleanContent := a.cleanHtmlForExtraction(selectionText)
		if cleanContent != "" && a.glinerExtractor != nil {
			chGraph, extErr := a.glinerExtractor.ExtractChapterGraph(cleanContent, unassignedRel, title)
			if extErr == nil {
				for i := range chGraph.Nodes {
					chGraph.Nodes[i].IsUnassigned = true
				}
				storage.SaveChapterGraph(targetDir, chGraph)
				globalGraph, _ := storage.LoadGlobalGraph(targetDir)
				globalGraph = storage.MergeChapterGraph(globalGraph, chGraph)
				storage.SaveGlobalGraph(targetDir, globalGraph)
			}
		}
	}()

	return map[string]string{
		"unassigned_path": unassignedRel,
		"modified_source": modifiedSource,
	}, nil
}

// EmbedUnassignedTopicIntoSession incrusta una nota o lección flotante dentro de una sesión ya existente
func (a *App) EmbedUnassignedTopicIntoSession(unassignedRelPath string, targetSessionRelPath string, embedMode string) error {
	if a.compendiumManager == nil {
		return fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	meta := a.compendiumManager.GetMeta()

	return storage.EmbedUnassignedTopicIntoSession(targetDir, unassignedRelPath, targetSessionRelPath, embedMode, meta.Author, meta.Email)
}

// GetCurriculumCoherenceMatrix genera la matriz de cobertura y mapa de calor de conceptos vs sesiones ordenadas
func (a *App) GetCurriculumCoherenceMatrix() (*storage.CurriculumMatrix, error) {
	if a.compendiumManager == nil {
		return nil, fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	return storage.GetCurriculumCoherenceMatrix(targetDir)
}

// -------------------------------------------------------------
// Métodos de Grafo de Dependencias y Linter Curricular (Punto 1.5)
// -------------------------------------------------------------

// GetCurriculumLintReport genera el informe de inconsistencias y salud ontológica del compendio
func (a *App) GetCurriculumLintReport() (*storage.CurriculumLintReport, error) {
	if a.compendiumManager == nil {
		return nil, fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	return storage.GetCurriculumLintReport(targetDir)
}

// SaveGlobalGraphPositions persiste las coordenadas de los nodos arrastrados en el visualizador
func (a *App) SaveGlobalGraphPositions(positions map[string]storage.NodePosition) error {
	if a.compendiumManager == nil {
		return fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	return storage.SaveGlobalGraphPositions(targetDir, positions)
}

// SaveGlobalGraphManualEdge añade o actualiza una relación conceptual manual
func (a *App) SaveGlobalGraphManualEdge(source string, target string, label string) error {
	if a.compendiumManager == nil {
		return fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	return storage.SaveGlobalGraphManualEdge(targetDir, source, target, label)
}

// DeleteGlobalGraphEdge elimina una arista entre dos nodos en el grafo global
func (a *App) DeleteGlobalGraphEdge(source string, target string) error {
	if a.compendiumManager == nil {
		return fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	return storage.DeleteGlobalGraphEdge(targetDir, source, target)
}

// -------------------------------------------------------------
// Métodos de Redacción Dual y Multi-Audiencia (Punto 1.6)
// -------------------------------------------------------------

// FilterContentForAudience filtra un documento según el rol de audiencia elegido
func (a *App) FilterContentForAudience(content string, audience string) string {
	return storage.FilterContentForAudience(content, audience)
}

// DeriveStudentWorksheet genera una ficha didáctica del alumno a partir de la lección maestra
func (a *App) DeriveStudentWorksheet(masterContent string, lessonTitle string) string {
	return storage.DeriveStudentWorksheet(masterContent, lessonTitle)
}

// DeriveSimplifiedVersion genera una versión adaptada a lenguaje sencillo o infantil
func (a *App) DeriveSimplifiedVersion(masterContent string, lessonTitle string) string {
	return storage.DeriveSimplifiedVersion(masterContent, lessonTitle)
}

// SaveDerivedLesson guarda una lección derivada en el compendio
func (a *App) SaveDerivedLesson(relPath string, content string, title string) (string, error) {
	if a.compendiumManager == nil {
		return "", fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	meta := a.compendiumManager.GetMeta()

	fullPath := filepath.Join(targetDir, filepath.Clean(relPath))
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return "", err
	}

	if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
		return "", err
	}

	git.CommitFiles(targetDir, []string{relPath}, fmt.Sprintf("Crear lección derivada: %s", title), meta.Author, meta.Email)
	return relPath, nil
}

// -------------------------------------------------------------
// Métodos de Herramientas de Calidad de Contenido (Punto 1.7)
// -------------------------------------------------------------

// CalculateSessionPacing calcula la estimación de tiempos de lectura, teoría y dinámicas de una sesión
func (a *App) CalculateSessionPacing(content string, conceptsCount int, targetMinutes int) *storage.SessionPacingReport {
	return storage.CalculateSessionPacing(content, conceptsCount, targetMinutes)
}

// ExtractCompendiumGlossary extrae el glosario completo del curso
func (a *App) ExtractCompendiumGlossary() (*storage.CompendiumGlossary, error) {
	if a.compendiumManager == nil {
		return nil, fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	return storage.ExtractCompendiumGlossary(targetDir)
}

// GenerateGlossaryAsciidoc genera el archivo content/glosario.adoc en el compendio
func (a *App) GenerateGlossaryAsciidoc() (string, error) {
	if a.compendiumManager == nil {
		return "", fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	meta := a.compendiumManager.GetMeta()

	relPath, err := storage.GenerateGlossaryAsciidoc(targetDir)
	if err != nil {
		return "", err
	}

	git.CommitFiles(targetDir, []string{relPath}, "Generar glosario del compendio", meta.Author, meta.Email)
	return relPath, nil
}

// ExtractCompendiumResources compila el inventario de materiales y recursos necesarios
func (a *App) ExtractCompendiumResources() (*storage.ResourceMatrix, error) {
	if a.compendiumManager == nil {
		return nil, fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	return storage.ExtractCompendiumResources(targetDir)
}

// SaveVoiceMemo guarda un audio de consejo docente adjunto a una sesión
func (a *App) SaveVoiceMemo(sessionRelPath string, audioBase64 string, title string) (*storage.VoiceMemo, error) {
	if a.compendiumManager == nil {
		return nil, fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	return storage.SaveVoiceMemo(targetDir, sessionRelPath, audioBase64, title)
}

// GetVoiceMemos obtiene los memos de voz de una sesión o de todo el compendio
func (a *App) GetVoiceMemos(sessionRelPath string) ([]storage.VoiceMemo, error) {
	if a.compendiumManager == nil {
		return []storage.VoiceMemo{}, nil
	}
	targetDir := a.compendiumManager.GetTargetDir()
	return storage.GetVoiceMemos(targetDir, sessionRelPath)
}

// DeleteVoiceMemo elimina una nota de voz
func (a *App) DeleteVoiceMemo(memoID string) error {
	if a.compendiumManager == nil {
		return fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	return storage.DeleteVoiceMemo(targetDir, memoID)
}

// GetVoiceMemoAudio obtiene el audio base64 para reproducir
func (a *App) GetVoiceMemoAudio(audioRelPath string) (string, error) {
	if a.compendiumManager == nil {
		return "", fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	return storage.GetVoiceMemoAudio(targetDir, audioRelPath)
}

// -------------------------------------------------------------
// Métodos de Mediateca y Gestión de Activos (Assets & Layout)
// -------------------------------------------------------------

// SaveAsset guarda una imagen o archivo en assets/ y hace commit silencioso en Git
func (a *App) SaveAsset(subFolder string, filename string, base64Data string) (*storage.AssetInfo, error) {
	if a.compendiumManager == nil {
		return nil, fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	meta := a.compendiumManager.GetMeta()

	asset, err := storage.SaveAsset(targetDir, subFolder, filename, base64Data)
	if err != nil {
		return nil, err
	}

	git.CommitFiles(targetDir, []string{asset.RelativePath}, fmt.Sprintf("Guardar archivo multimedia: %s", asset.Name), meta.Author, meta.Email)
	return asset, nil
}

// ListCompendiumAssets obtiene la mediateca completa con referencias cruzadas e imágenes huérfanas
func (a *App) ListCompendiumAssets() (*storage.AssetGallery, error) {
	if a.compendiumManager == nil {
		return nil, fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	return storage.ListCompendiumAssets(targetDir)
}

// DeleteAsset elimina un archivo de assets/
func (a *App) DeleteAsset(relativePath string) error {
	if a.compendiumManager == nil {
		return fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	meta := a.compendiumManager.GetMeta()

	if err := storage.DeleteAsset(targetDir, relativePath); err != nil {
		return err
	}

	git.CommitFiles(targetDir, []string{relativePath}, fmt.Sprintf("Eliminar archivo multimedia: %s", relativePath), meta.Author, meta.Email)
	return nil
}

// GetAssetBase64 obtiene el contenido en base64 de un archivo multimedia para previsualizarlo
func (a *App) GetAssetBase64(relativePath string) (string, error) {
	if a.compendiumManager == nil {
		return "", fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	b64, _, err := storage.GetAssetBase64(targetDir, relativePath)
	return b64, err
}

// FormatAsciidocImage formatea la llamada image:: con presets de maquetación editorial
func (a *App) FormatAsciidocImage(imageRelPath string, caption string, layout string, width int) string {
	return storage.FormatAsciidocImage(imageRelPath, caption, layout, width)
}

// -------------------------------------------------------------
// Métodos de Captura de Voz a Estructura (Punto 1.8)
// -------------------------------------------------------------

// StructureTranscription clasifica semánticamente una transcripción verbal y genera una sesión completa
func (a *App) StructureTranscription(rawTranscript string, sessionTitle string, audioRelPath string) *storage.StructuredSessionDraft {
	return storage.StructureTranscription(rawTranscript, sessionTitle, audioRelPath)
}

// SaveSessionAudioResource guarda una grabación de sesión completa en assets/audio/
func (a *App) SaveSessionAudioResource(sessionSlug string, filename string, audioBase64 string) (*storage.AssetInfo, error) {
	if a.compendiumManager == nil {
		return nil, fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	meta := a.compendiumManager.GetMeta()

	asset, err := storage.SaveSessionAudioResource(targetDir, sessionSlug, filename, audioBase64)
	if err != nil {
		return nil, err
	}

	git.CommitFiles(targetDir, []string{asset.RelativePath}, fmt.Sprintf("Guardar grabación de sesión: %s", asset.Name), meta.Author, meta.Email)
	return asset, nil
}

// SaveVoiceStructuredSession persiste la nueva lección generada y su audio en el compendio
func (a *App) SaveVoiceStructuredSession(moduleSlug string, sessionSlug string, title string, content string, audioRelPath string) (string, error) {
	if a.compendiumManager == nil {
		return "", fmt.Errorf("no hay ningún compendio abierto")
	}
	targetDir := a.compendiumManager.GetTargetDir()
	meta := a.compendiumManager.GetMeta()

	relPath, err := storage.SaveVoiceStructuredSession(targetDir, moduleSlug, sessionSlug, title, content, audioRelPath)
	if err != nil {
		return "", err
	}

	git.CommitFiles(targetDir, []string{relPath}, fmt.Sprintf("Crear sesión a partir de voz: %s", title), meta.Author, meta.Email)
	return relPath, nil
}

// FormatAsciidocAudio genera la macro de reproductor de audio AsciiDoc
func (a *App) FormatAsciidocAudio(audioRelPath string, title string) string {
	return storage.FormatAsciidocAudio(audioRelPath, title)
}








