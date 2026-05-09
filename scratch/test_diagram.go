package main

import (
	"context"
	"fmt"
	"log"
	"strings"
	"encoding/json"

	"antigravity-writer/internal/ai"
	"antigravity-writer/internal/config"
	"antigravity-writer/internal/diagram"
	_ "antigravity-writer/internal/ortinit" // ¡IMPORTANTE para ONNX!
)

type TestApp struct {
	config  *config.Config
	ai      *ai.AIProcessor
	diagram *diagram.Manager
}

func main() {
	fmt.Println("🧪 Iniciando prueba de diagnóstico del Director Mode...")

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Error cargando config: %v", err)
	}

	manager := diagram.NewManager()
	processor := ai.NewAIProcessor("models", cfg.GLiNER.ModelPath)
	
	app := &TestApp{
		config:  cfg,
		ai:      processor,
		diagram: manager,
	}

	p1 := `El pasado lunes, Elena Rodríguez, Directora de Operaciones de TechNova Solutions, anunció en la sede de Madrid la adquisición de la startup finlandesa Nordic AI. Según el acuerdo valorado en 45 millones de euros, el fundador de Nordic AI, Lukas Virtanen, se unirá al comité ejecutivo de TechNova. Esta operación fue supervisada por el Banco Santander, que actuó como asesor financiero principal, asegurando que la integración tecnológica comience el próximo mes de junio en sus oficinas de Helsinki.`

	p2 := `Simultáneamente, la firma de abogados Garrigues coordinó la auditoría legal en colaboración con Sarah Jenkins, consultora senior de Global Compliance. Durante la rueda de prensa, Jenkins confirmó que la propiedad intelectual de los algoritmos de Nordic AI será transferida a la nueva división de I+D en Barcelona. Como parte de este movimiento estratégico, la ingeniera jefa Sofía Al-Mansoori liderará el equipo de desarrollo, reportando directamente a Elena Rodríguez, con el objetivo de lanzar el primer prototipo de IA generativa para el sector bancario europeo antes de finales de año.`

	fmt.Println("\n--- [PASO 1] Procesando párrafo 1... ---")
	_, err = app.ProcessDiagramStep(p1)
	if err != nil {
		fmt.Printf("❌ Error en Paso 1: %v\n", err)
	} else {
		fmt.Printf("✅ Paso 1 completado.\n")
	}

	fmt.Println("\n--- [PASO 2] Procesando párrafo 2... ---")
	_, err = app.ProcessDiagramStep(p2)
	if err != nil {
		fmt.Printf("❌ Error en Paso 2: %v\n", err)
	} else {
		fmt.Printf("✅ Paso 2 completado.\n")
	}
}

func (a *TestApp) ProcessDiagramStep(text string) (string, error) {
	// 1. Intentar GLiNER local (con check de nil)
	if a.ai.GLiNERProcessor != nil {
		fmt.Println("🤖 Ejecutando GLiNER local...")
		_, relations, _ := a.ai.GLiNERProcessor.ExtractFromText(context.Background(), text)
		if len(relations) > 0 {
			fmt.Printf("✨ GLiNER detectó %d relaciones.\n", len(relations))
			// Simular que el primer paso fue por GLiNER si es el P1
			// Pero para diagnosticar el LLM, vamos a forzar LLM siempre
		}
	}

	fmt.Println("🔄 Forzando LLM remoto para diagnóstico de contexto...")
	
	steps := a.diagram.GetSteps()
	contextHistory := ""
	if len(steps) > 0 {
		start := len(steps) - 2
		if start < 0 { start = 0 }
		recentSteps := steps[start:]
		
		type SimpleStep struct {
			Nodes []diagram.Node `json:"nodes"`
			Edges []diagram.Edge `json:"edges"`
		}
		var simplifiedContext []SimpleStep
		for _, s := range recentSteps {
			simplifiedContext = append(simplifiedContext, SimpleStep{Nodes: s.Nodes, Edges: s.Edges})
		}
		historyJSON, _ := json.MarshalIndent(simplifiedContext, "", "  ")
		contextHistory = fmt.Sprintf("\n--- CONTEXTO PREVIO DEL GRAFO ---\n%s\n--- FIN DEL CONTEXTO ---\n", string(historyJSON))
	}

	prompt := fmt.Sprintf(`Eres un extractor de datos JSON para grafos relacionales.
Formato:
{
  "nodes": [{"id": "id", "label": "Nombre", "type": "Tipo"}],
  "edges": [{"source": "id1", "target": "id2", "label": "relación"}],
  "explanation": "breve"
}

%s

Texto: %s`, contextHistory, text)

	fmt.Printf("📡 Enviando prompt (%d bytes)...\n", len(prompt))
	resp, err := ai.SimpleLLMCall(a.config.LLMURL, prompt)
	if err != nil {
		return "", err
	}

	fmt.Printf("⏱️ Respuesta recibida. Validando JSON...\n")
	
	start := strings.Index(resp, "{")
	end := strings.LastIndex(resp, "}")
	if start != -1 && end != -1 {
		cleanJSON := resp[start : end+1]
		var newStep diagram.DiagramStep
		json.Unmarshal([]byte(cleanJSON), &newStep)
		a.diagram.AddStep(newStep)
		return "OK", nil
	}
	return "", fmt.Errorf("no JSON found")
}
