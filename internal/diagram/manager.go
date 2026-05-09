package diagram

import (
	"encoding/json"
	"sync"
)

type Node struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Type  string `json:"type"` // e.g., "character", "event", "location"
}

type Edge struct {
	Source string `json:"source"`
	Target string `json:"target"`
	Label  string `json:"label"`
}

type DiagramStep struct {
	Nodes       []Node `json:"nodes"`
	Edges       []Edge `json:"edges"`
	ContextText string `json:"context_text"`
	Explanation string `json:"explanation"`
}

type Manager struct {
	Steps []DiagramStep
	mu    sync.RWMutex
}

func NewManager() *Manager {
	return &Manager{
		Steps: []DiagramStep{},
	}
}

func (m *Manager) AddStep(step DiagramStep) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.Steps = append(m.Steps, step)
}

func (m *Manager) GetSteps() []DiagramStep {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.Steps
}

func (m *Manager) Reset() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.Steps = []DiagramStep{}
}

// TransformToJSON convierte el estado actual a JSON para el frontend
func (m *Manager) ToJSON() string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	data, _ := json.Marshal(m.Steps)
	return string(data)
}
