package mcp

import (
	"context"
	"fmt"
	"net/http"

	"antigravity-writer/internal/ai"
	"antigravity-writer/internal/canva"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type AppInterface interface {
	EmitEvent(name string, data interface{})
	GetCanvaClient() *canva.CanvaClient
	ExtractEntities(text string, labels []string) ([]ai.Entity, error)
	ExtractFromText(text string) ([]ai.Entity, []ai.Relation, error)
	ProcessDiagramStep(text string) (string, error)
	ProcessDiagramStepFromMCP(text string) (string, error)
}

type MCPEditorServer struct {
	app    AppInterface
	Server *mcp.Server
}

func NewMCPEditorServer(app AppInterface) *MCPEditorServer {
	s := mcp.NewServer(&mcp.Implementation{
		Name:    "Antigravity Writer",
		Version: "1.0.0",
	}, nil)

	mcp.AddTool(s, &mcp.Tool{
		Name:        "insert_text",
		Description: "Inserta texto en la posición actual del cursor en el editor",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		Text string `json:"text" jsonschema:"El texto a insertar"`
	}) (*mcp.CallToolResult, any, error) {
		app.EmitEvent("mcp:insert_text", args.Text)
		return nil, "Texto insertado correctamente", nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "get_editor_content",
		Description: "Obtiene todo el texto actual del editor",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct{}) (*mcp.CallToolResult, any, error) {
		app.EmitEvent("mcp:get_content_request", nil)
		return nil, "[Contenido del editor solicitado al frontend]", nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "extract_entities",
		Description: "Extrae entidades del texto usando el motor local GLiNER2",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		Text   string   `json:"text" jsonschema:"El texto a analizar"`
		Labels []string `json:"labels" jsonschema:"Lista de etiquetas a buscar (ej: person, location)"`
	}) (*mcp.CallToolResult, any, error) {
		entities, err := app.ExtractEntities(args.Text, args.Labels)
		if err != nil {
			return nil, fmt.Errorf("error en extracción local: %v", err), nil
		}
		return nil, entities, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "extract_relations",
		Description: "Extrae un grafo completo de entidades y relaciones usando GLiNER2 local.",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		Text string `json:"text" jsonschema:"El texto a analizar"`
	}) (*mcp.CallToolResult, any, error) {
		entities, relations, err := app.ExtractFromText(args.Text)
		if err != nil {
			return nil, fmt.Errorf("error: %v", err), nil
		}
		return nil, map[string]interface{}{
			"entities":  entities,
			"relations": relations,
		}, nil
	})

	mcp.AddTool(s, &mcp.Tool{
		Name:        "process_diagram_step",
		Description: "Analiza un texto y añade un nuevo paso al grafo evolutivo del Director Mode.",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		Text string `json:"text" jsonschema:"El texto a analizar para el grafo"`
	}) (*mcp.CallToolResult, any, error) {
		jsonResult, err := app.ProcessDiagramStepFromMCP(args.Text)
		if err != nil {
			return nil, fmt.Errorf("error procesando paso: %v", err), nil
		}
		return nil, jsonResult, nil
	})

	return &MCPEditorServer{app: app, Server: s}
}

func (m *MCPEditorServer) StartSSE(port int) error {
	handler := mcp.NewSSEHandler(func(req *http.Request) *mcp.Server {
		return m.Server
	}, nil)
	
	mux := http.NewServeMux()
	mux.Handle("/mcp", handler)

	fmt.Printf("Servidor MCP (SSE) iniciado en http://localhost:%d/mcp\n", port)
	return http.ListenAndServe(fmt.Sprintf(":%d", port), mux)
}
