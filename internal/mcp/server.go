package mcp

import (
	"context"
	"fmt"
	"net/http"

	"antigravity-writer/internal/ai"
	"antigravity-writer/internal/canva"
	"antigravity-writer/internal/git"
	"antigravity-writer/internal/storage"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type AppInterface interface {
	EmitEvent(name string, data interface{})
	GetCanvaClient() *canva.CanvaClient
	ExtractEntities(text string, labels []string) ([]ai.Entity, error)
	ExtractFromText(text string) ([]ai.Entity, []ai.Relation, error)
	ProcessDiagramStep(text string) (string, error)
	ProcessDiagramStepFromMCP(text string) (string, error)
	TranscribeAudioFile(path string) (string, error)

	// Métodos del Compendio y Archivos
	GetActiveCompendium() *storage.CompendiumInfo
	GetCompendiumTree() ([]storage.FileNode, error)
	ReadCompendiumFile(relativePath string) (string, error)
	SaveCompendiumFile(relativePath string, content string, commitMsg string) error

	// Grafos y Linter Curricular (Puntos 1.4 y 1.5)
	GetGlobalGraph() (*storage.GraphData, error)
	GetCurriculumLintReport() (*storage.CurriculumLintReport, error)
	GetCurriculumCoherenceMatrix() (*storage.CurriculumMatrix, error)

	// Multi-Audiencia y Derivación (Punto 1.6)
	FilterContentForAudience(content string, audience string) string
	DeriveStudentWorksheet(masterContent string, lessonTitle string) string

	// Herramientas de Calidad de Contenido (Punto 1.7)
	CalculateSessionPacing(content string, conceptsCount int, targetMinutes int) *storage.SessionPacingReport
	ExtractCompendiumGlossary() (*storage.CompendiumGlossary, error)
	ExtractCompendiumResources() (*storage.ResourceMatrix, error)

	// Voz a Estructura y Escaletas Multimedia (Puntos 1.8 y 1.9)
	StructureTranscription(rawTranscript string, sessionTitle string, audioRelPath string) *storage.StructuredSessionDraft
	GenerateMultimediaScript(sessionRelPath string, scriptType string, durationMinutes int, tone string) (*storage.VideoScriptData, error)

	// Git-Flow, Ramas y Sincronización
	GetGitRemoteInfo() (*git.RemoteInfo, error)
	GetGitBranches() (map[string]interface{}, error)
	CreateGitBranch(branchName string, checkout bool) error
	CheckoutGitBranch(branchName string) error
	GetGitPullRequestURL(targetBranch string) (string, error)
}

type MCPEditorServer struct {
	app    AppInterface
	Server *mcp.Server
}

func NewMCPEditorServer(app AppInterface) *MCPEditorServer {
	s := mcp.NewServer(&mcp.Implementation{
		Name:    "Antigravity Writer",
		Version: "1.3.2",
	}, nil)

	// -------------------------------------------------------------
	// Herramientas del Editor Básico
	// -------------------------------------------------------------

	mcp.AddTool(s, &mcp.Tool{
		Name:        "insert_text",
		Description: "Inserta texto en la posición actual del cursor en el editor visual",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		Text string `json:"text" jsonschema:"El texto a insertar"`
	}) (*mcp.CallToolResult, any, error) {
		app.EmitEvent("mcp:insert_text", args.Text)
		return nil, "Texto insertado correctamente en el editor", nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "get_editor_content",
		Description: "Solicita al frontend el texto actual que está abierto en el editor",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct{}) (*mcp.CallToolResult, any, error) {
		app.EmitEvent("mcp:get_content_request", nil)
		return nil, "[Contenido del editor solicitado al frontend]", nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "transcribe_audio_file",
		Description: "Transcribe un archivo de audio WAV usando Whisper local/remoto e inserta el texto en el editor.",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		Path string `json:"path" jsonschema:"Ruta absoluta o relativa del archivo de audio WAV"`
	}) (*mcp.CallToolResult, any, error) {
		text, err := app.TranscribeAudioFile(args.Path)
		if err != nil {
			return nil, fmt.Errorf("error transcribiendo audio: %w", err), nil
		}
		return nil, map[string]string{
			"transcription": text,
		}, nil
	})

	// -------------------------------------------------------------
	// Herramientas de Extracción Local (GLiNER2)
	// -------------------------------------------------------------

	mcp.AddTool(s, &mcp.Tool{
		Name:        "extract_entities",
		Description: "Extrae entidades con nombre y conceptos clave de un texto usando el modelo nativo GLiNER2",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		Text   string   `json:"text" jsonschema:"El texto a analizar"`
		Labels []string `json:"labels" jsonschema:"Lista opcional de etiquetas a buscar (ej: Concept, Sacrament, Person)"`
	}) (*mcp.CallToolResult, any, error) {
		entities, err := app.ExtractEntities(args.Text, args.Labels)
		if err != nil {
			return nil, fmt.Errorf("error en extracción de entidades: %w", err), nil
		}
		return nil, entities, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "extract_relations",
		Description: "Extrae un grafo de conceptos y sus relaciones conceptuales usando GLiNER2 local.",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		Text string `json:"text" jsonschema:"El texto a analizar"`
	}) (*mcp.CallToolResult, any, error) {
		entities, relations, err := app.ExtractFromText(args.Text)
		if err != nil {
			return nil, fmt.Errorf("error en extracción de relaciones: %w", err), nil
		}
		return nil, map[string]interface{}{
			"entities":  entities,
			"relations": relations,
		}, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "process_diagram_step",
		Description: "Añade un nuevo paso conceptual al grafo evolutivo del Director Mode",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		Text string `json:"text" jsonschema:"El texto del nuevo paso"`
	}) (*mcp.CallToolResult, any, error) {
		jsonResult, err := app.ProcessDiagramStepFromMCP(args.Text)
		if err != nil {
			return nil, fmt.Errorf("error procesando paso: %w", err), nil
		}
		return nil, jsonResult, nil
	})

	// -------------------------------------------------------------
	// Herramientas del Compendio y Archivos (Puntos 1.1 a 1.3)
	// -------------------------------------------------------------

	mcp.AddTool(s, &mcp.Tool{
		Name:        "get_active_compendium",
		Description: "Obtiene los metadatos, título, autor y ruta del compendio de libros actualmente abierto",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct{}) (*mcp.CallToolResult, any, error) {
		info := app.GetActiveCompendium()
		if info == nil {
			return nil, "No hay ningún compendio abierto actualmente", nil
		}
		return nil, info, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "get_compendium_tree",
		Description: "Devuelve el árbol jerárquico completo de módulos, lecciones, sesiones e ideas flotantes del compendio",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct{}) (*mcp.CallToolResult, any, error) {
		tree, err := app.GetCompendiumTree()
		if err != nil {
			return nil, fmt.Errorf("error leyendo árbol del compendio: %w", err), nil
		}
		return nil, tree, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "read_compendium_file",
		Description: "Lee el contenido íntegro en AsciiDoc/HTML de un archivo del compendio activo",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		RelativePath string `json:"relative_path" jsonschema:"Ruta relativa del archivo dentro del compendio (ej: content/modulo-1/sesion-01.adoc)"`
	}) (*mcp.CallToolResult, any, error) {
		content, err := app.ReadCompendiumFile(args.RelativePath)
		if err != nil {
			return nil, fmt.Errorf("error leyendo archivo %s: %w", args.RelativePath, err), nil
		}
		return nil, map[string]string{
			"relative_path": args.RelativePath,
			"content":       content,
		}, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "save_compendium_file",
		Description: "Guarda el contenido de un archivo en el compendio y genera automáticamente un commit en Git",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		RelativePath string `json:"relative_path" jsonschema:"Ruta relativa del archivo (ej: content/modulo-1/sesion-01.adoc)"`
		Content      string `json:"content" jsonschema:"Contenido completo a guardar"`
		CommitMsg    string `json:"commit_msg" jsonschema:"Mensaje descriptivo para el commit de Git"`
	}) (*mcp.CallToolResult, any, error) {
		err := app.SaveCompendiumFile(args.RelativePath, args.Content, args.CommitMsg)
		if err != nil {
			return nil, fmt.Errorf("error guardando archivo: %w", err), nil
		}
		return nil, fmt.Sprintf("Archivo %s guardado y versionado con éxito en Git.", args.RelativePath), nil
	})

	// -------------------------------------------------------------
	// Grafo Curricular, Dependencias y Linter (Puntos 1.4 y 1.5)
	// -------------------------------------------------------------

	mcp.AddTool(s, &mcp.Tool{
		Name:        "get_global_graph",
		Description: "Devuelve el grafo ontológico global consolidado del compendio (.writer/graph-global.json) con todos sus nodos y aristas",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct{}) (*mcp.CallToolResult, any, error) {
		graph, err := app.GetGlobalGraph()
		if err != nil {
			return nil, fmt.Errorf("error obteniendo grafo global: %w", err), nil
		}
		return nil, graph, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "get_curriculum_lint_report",
		Description: "Ejecuta el Curriculum Linter y devuelve el informe de salud ontológica (conceptos huérfanos, ciclos de dependencias, uso prematuro de conceptos)",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct{}) (*mcp.CallToolResult, any, error) {
		report, err := app.GetCurriculumLintReport()
		if err != nil {
			return nil, fmt.Errorf("error ejecutando linter curricular: %w", err), nil
		}
		return nil, report, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "get_curriculum_matrix",
		Description: "Genera la matriz de cobertura y mapa de calor de conceptos vs sesiones ordenadas en el compendio",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct{}) (*mcp.CallToolResult, any, error) {
		matrix, err := app.GetCurriculumCoherenceMatrix()
		if err != nil {
			return nil, fmt.Errorf("error generando matriz curricular: %w", err), nil
		}
		return nil, matrix, nil
	})

	// -------------------------------------------------------------
	// Multi-Audiencia y Derivación Didáctica (Punto 1.6)
	// -------------------------------------------------------------

	mcp.AddTool(s, &mcp.Tool{
		Name:        "filter_content_for_audience",
		Description: "Filtra un contenido AsciiDoc/HTML según el rol de audiencia elegido: 'student' (alumno), 'instructor' (profesor), 'simplified' (infantil/fácil) o 'workshop' (taller)",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		Content  string `json:"content" jsonschema:"Contenido maestro a filtrar"`
		Audience string `json:"audience" jsonschema:"Rol de audiencia objetivo ('student', 'instructor', 'simplified', 'workshop')"`
	}) (*mcp.CallToolResult, any, error) {
		filtered := app.FilterContentForAudience(args.Content, args.Audience)
		return nil, map[string]string{
			"audience":         args.Audience,
			"filtered_content": filtered,
		}, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "derive_student_worksheet",
		Description: "Genera automáticamente una ficha de trabajo del alumno con preguntas, actividades y espacios en blanco a partir de una lección",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		MasterContent string `json:"master_content" jsonschema:"Contenido de la lección maestra"`
		LessonTitle   string `json:"lesson_title" jsonschema:"Título de la lección"`
	}) (*mcp.CallToolResult, any, error) {
		worksheet := app.DeriveStudentWorksheet(args.MasterContent, args.LessonTitle)
		return nil, map[string]string{
			"student_worksheet": worksheet,
		}, nil
	})

	// -------------------------------------------------------------
	// Calidad de Contenido, Glosario y Recursos (Punto 1.7)
	// -------------------------------------------------------------

	mcp.AddTool(s, &mcp.Tool{
		Name:        "calculate_session_pacing",
		Description: "Calcula el ritmo pedagógico y distribución de tiempos de una sesión (tiempo estimado de lectura, teoría, dinámicas de grupo y densidad conceptual)",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		Content       string `json:"content" jsonschema:"Contenido de la sesión"`
		ConceptsCount int    `json:"concepts_count" jsonschema:"Número de conceptos clave abordados"`
		TargetMinutes int    `json:"target_minutes" jsonschema:"Minutos objetivo totales para la sesión (ej: 60)"`
	}) (*mcp.CallToolResult, any, error) {
		report := app.CalculateSessionPacing(args.Content, args.ConceptsCount, args.TargetMinutes)
		return nil, report, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "extract_compendium_glossary",
		Description: "Compila el glosario completo del curso con definiciones, términos teológicos/conceptuales y sesiones donde aparecen",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct{}) (*mcp.CallToolResult, any, error) {
		glossary, err := app.ExtractCompendiumGlossary()
		if err != nil {
			return nil, fmt.Errorf("error extrayendo glosario: %w", err), nil
		}
		return nil, glossary, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "extract_compendium_resources",
		Description: "Genera el inventario de materiales, checklist de compras y recursos físicos/digitales necesarios para todas las sesiones",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct{}) (*mcp.CallToolResult, any, error) {
		resources, err := app.ExtractCompendiumResources()
		if err != nil {
			return nil, fmt.Errorf("error extrayendo recursos: %w", err), nil
		}
		return nil, resources, nil
	})

	// -------------------------------------------------------------
	// Voz a Estructura y Escaletas Multimedia (Puntos 1.8 y 1.9)
	// -------------------------------------------------------------

	mcp.AddTool(s, &mcp.Tool{
		Name:        "structure_transcription",
		Description: "Clasifica semánticamente una transcripción verbal (braindump) y genera un borrador estructurado de sesión con objetivos, dinámicas y oraciones",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		RawTranscript string `json:"raw_transcript" jsonschema:"Texto crudo de la transcripción verbal"`
		SessionTitle  string `json:"session_title" jsonschema:"Título para la nueva sesión"`
		AudioRelPath  string `json:"audio_rel_path" jsonschema:"Ruta relativa del audio adjunto (opcional)"`
	}) (*mcp.CallToolResult, any, error) {
		draft := app.StructureTranscription(args.RawTranscript, args.SessionTitle, args.AudioRelPath)
		return nil, draft, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "generate_multimedia_script",
		Description: "Genera una escaleta multimedia estructurada para YouTube/vídeo, Canva Slides o podcast de audio a partir de una sesión existente",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		SessionRelPath  string `json:"session_rel_path" jsonschema:"Ruta relativa de la sesión (ej: content/modulo-1/sesion-01.adoc)"`
		ScriptType      string `json:"script_type" jsonschema:"Tipo de escaleta: 'video', 'slides', 'audio'"`
		DurationMinutes int    `json:"duration_minutes" jsonschema:"Duración deseada en minutos"`
		Tone            string `json:"tone" jsonschema:"Tono pedagógico (ej: 'cercano', 'pastoral', 'dinamico')"`
	}) (*mcp.CallToolResult, any, error) {
		script, err := app.GenerateMultimediaScript(args.SessionRelPath, args.ScriptType, args.DurationMinutes, args.Tone)
		if err != nil {
			return nil, fmt.Errorf("error generando escaleta multimedia: %w", err), nil
		}
		return nil, script, nil
	})

	// -------------------------------------------------------------
	// Git-Flow, Ramas y Sincronización Remota
	// -------------------------------------------------------------

	mcp.AddTool(s, &mcp.Tool{
		Name:        "get_git_remote_info",
		Description: "Obtiene el estado de sincronización remota del compendio, URL de origen y rama activa",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct{}) (*mcp.CallToolResult, any, error) {
		info, err := app.GetGitRemoteInfo()
		if err != nil {
			return nil, fmt.Errorf("error obteniendo info remota de Git: %w", err), nil
		}
		return nil, info, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "get_git_branches",
		Description: "Lista todas las ramas de trabajo locales y devuelve la rama activa actual",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct{}) (*mcp.CallToolResult, any, error) {
		branches, err := app.GetGitBranches()
		if err != nil {
			return nil, fmt.Errorf("error listando ramas: %w", err), nil
		}
		return nil, branches, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "create_git_branch",
		Description: "Crea una nueva rama de trabajo en paralelo para un autor o feature y opcionalmente cambia a ella",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		BranchName string `json:"branch_name" jsonschema:"Nombre de la rama (ej: autor/pedro-tema-1)"`
		Checkout   bool   `json:"checkout" jsonschema:"Si es true, cambia inmediatamente a la nueva rama"`
	}) (*mcp.CallToolResult, any, error) {
		err := app.CreateGitBranch(args.BranchName, args.Checkout)
		if err != nil {
			return nil, fmt.Errorf("error creando rama: %w", err), nil
		}
		return nil, fmt.Sprintf("Rama '%s' creada con éxito (checkout=%v)", args.BranchName, args.Checkout), nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "checkout_git_branch",
		Description: "Cambia la rama activa del compendio",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		BranchName string `json:"branch_name" jsonschema:"Nombre de la rama a la que cambiar"`
	}) (*mcp.CallToolResult, any, error) {
		err := app.CheckoutGitBranch(args.BranchName)
		if err != nil {
			return nil, fmt.Errorf("error cambiando a rama: %w", err), nil
		}
		return nil, fmt.Sprintf("Cambiado con éxito a la rama '%s'", args.BranchName), nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "get_git_pull_request_url",
		Description: "Genera la URL web de Pull Request / Merge Request en GitHub/GitLab para fusionar la rama activa con main",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		TargetBranch string `json:"target_branch" jsonschema:"Rama destino (por defecto 'main')"`
	}) (*mcp.CallToolResult, any, error) {
		url, err := app.GetGitPullRequestURL(args.TargetBranch)
		if err != nil {
			return nil, fmt.Errorf("error generando URL de Pull Request: %w", err), nil
		}
		return nil, map[string]string{
			"pull_request_url": url,
		}, nil
	})

	return &MCPEditorServer{app: app, Server: s}
}

func (m *MCPEditorServer) StartSSE(port int) error {
	handler := mcp.NewSSEHandler(func(req *http.Request) *mcp.Server {
		return m.Server
	}, nil)
	
	mux := http.NewServeMux()
	mux.Handle("/mcp/", handler)
	mux.Handle("/mcp", handler)

	fmt.Printf("Servidor MCP (SSE) iniciado en http://localhost:%d/mcp\n", port)
	return http.ListenAndServe(fmt.Sprintf(":%d", port), mux)
}
