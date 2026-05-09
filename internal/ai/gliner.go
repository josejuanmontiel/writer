package ai

import (
	"context"
	"fmt"

	"hugot-gliner2/pkg/gliner"
)

// Entity representa una entidad extraída
type Entity struct {
	Text  string  `json:"text"`
	Label string  `json:"label"`
	Score float32 `json:"score"`
}

// Relation representa una relación extraída
type Relation struct {
	Head  string  `json:"head"`
	Tail  string  `json:"tail"`
	Label string  `json:"label"`
	Score float32 `json:"score"` // Promedio de Head y Tail
}

// GLiNER2Processor maneja la inferencia de GLiNER2 usando hugot-gliner2
type GLiNER2Processor struct {
	pipeline *gliner.Pipeline
}

// NewGLiNER2Processor crea una nueva instancia del procesador nativo
func NewGLiNER2Processor(modelDir string) (*GLiNER2Processor, error) {
	p, err := gliner.NewPipeline(
		modelDir+"/encoder.onnx",
		modelDir+"/count_embed.onnx",
		modelDir+"/gliner_classifiers.safetensors",
		modelDir+"/tokenizer.json",
		modelDir+"/prompt_ids.json",
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("error cargando GLiNER2 nativo: %v", err)
	}

	return &GLiNER2Processor{
		pipeline: p,
	}, nil
}

// ExtractFromText procesa el texto y extrae entidades y relaciones usando el prompt estático
func (g *GLiNER2Processor) ExtractFromText(ctx context.Context, text string) ([]Entity, []Relation, error) {
	entitiesMatches, relationMatches, words, spansInfo, err := g.pipeline.ExtractFromText(text)
	if err != nil {
		return nil, nil, err
	}

	getText := func(spanIdx int) string {
		span := spansInfo[spanIdx]
		startWord, endWord := span[0], span[1]
		txt := ""
		for w := startWord; w <= endWord; w++ {
			if w > startWord {
				txt += " "
			}
			txt += words[w]
		}
		return txt
	}

	var entities []Entity
	for _, ent := range entitiesMatches {
		entities = append(entities, Entity{
			Text:  getText(ent.Index),
			Label: "Concept", // Default label for entities in this relational schema
			Score: float32(ent.Score),
		})
	}

	var relations []Relation
	for _, rel := range relationMatches {
		relations = append(relations, Relation{
			Head:  getText(rel.Head.Index),
			Tail:  getText(rel.Tail.Index),
			Label: rel.Label,
			Score: float32((rel.Head.Score + rel.Tail.Score) / 2.0),
		})
	}

	return entities, relations, nil
}

// Para compatibilidad con MCP / código antiguo
func (g *GLiNER2Processor) ExtractEntities(ctx context.Context, text string, labels []string, threshold float32) ([]Entity, error) {
	entities, _, err := g.ExtractFromText(ctx, text)
	return entities, err
}
