package mcp

import (
	"context"
	"fmt"
	"net/http"

	"antigravity-writer/internal/ai"
	"antigravity-writer/internal/canva"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// AppInterface define lo que necesitamos de App para el servidor MCP
type AppInterface interface {
	EmitEvent(name string, data interface{})
	GetCanvaClient() *canva.CanvaClient
	ExtractEntities(text string, labels []string) ([]ai.Entity, error)
	ExtractFromText(text string) ([]ai.Entity, []ai.Relation, error)
}

type MCPEditorServer struct {
	app    AppInterface
	server *mcp.Server
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
		Description: "Extrae un grafo completo de entidades y relaciones directamente de un texto usando el modelo E2E GLiNER2 local.",
	}, func(ctx context.Context, req *mcp.CallToolRequest, args struct {
		Text string `json:"text" jsonschema:"El texto del cual extraer relaciones y entidades"`
	}) (*mcp.CallToolResult, any, error) {
		entities, relations, err := app.ExtractFromText(args.Text)
		if err != nil {
			return nil, fmt.Errorf("error en extracción de relaciones: %v", err), nil
		}
		return nil, map[string]interface{}{
			"entities":  entities,
			"relations": relations,
		}, nil
	})

	return &MCPEditorServer{
		app:    app,
		server: s,
	}
}

func (m *MCPEditorServer) StartSSE(port int) error {
	handler := mcp.NewSSEHandler(func(req *http.Request) *mcp.Server {
		return m.server
	}, nil)
	
	mux := http.NewServeMux()
	mux.Handle("/mcp", handler)

	fmt.Printf("Servidor MCP (SSE) iniciado en http://localhost:%d/mcp\n", port)
	return http.ListenAndServe(fmt.Sprintf(":%d", port), mux)
}
