package mcp

import (
	"testing"

	"antigravity-writer/internal/ai"
	"antigravity-writer/internal/canva"
	"antigravity-writer/internal/git"
	"antigravity-writer/internal/storage"
)

type mockApp struct{}

func (m *mockApp) EmitEvent(name string, data interface{}) {}
func (m *mockApp) GetCanvaClient() *canva.CanvaClient      { return nil }
func (m *mockApp) ExtractEntities(text string, labels []string) ([]ai.Entity, error) {
	return []ai.Entity{}, nil
}
func (m *mockApp) ExtractFromText(text string) ([]ai.Entity, []ai.Relation, error) {
	return []ai.Entity{}, []ai.Relation{}, nil
}
func (m *mockApp) ProcessDiagramStep(text string) (string, error)        { return "{}", nil }
func (m *mockApp) ProcessDiagramStepFromMCP(text string) (string, error) { return "{}", nil }
func (m *mockApp) TranscribeAudioFile(path string) (string, error)       { return "test audio", nil }

func (m *mockApp) GetActiveCompendium() *storage.CompendiumInfo {
	return &storage.CompendiumInfo{
		Path: "/tmp/compendium",
		Meta: storage.ProjectMeta{Name: "Compendio Test"},
	}
}
func (m *mockApp) GetCompendiumTree() ([]storage.FileNode, error) {
	return []storage.FileNode{}, nil
}
func (m *mockApp) ReadCompendiumFile(relativePath string) (string, error) {
	return "= Test Session", nil
}
func (m *mockApp) SaveCompendiumFile(relativePath string, content string, commitMsg string) error {
	return nil
}
func (m *mockApp) GetGlobalGraph() (*storage.GraphData, error) {
	return &storage.GraphData{Nodes: []storage.GraphNode{}, Edges: []storage.GraphEdge{}}, nil
}
func (m *mockApp) GetCurriculumLintReport() (*storage.CurriculumLintReport, error) {
	return &storage.CurriculumLintReport{}, nil
}
func (m *mockApp) GetCurriculumCoherenceMatrix() (*storage.CurriculumMatrix, error) {
	return &storage.CurriculumMatrix{}, nil
}
func (m *mockApp) FilterContentForAudience(content string, audience string) string {
	return content
}
func (m *mockApp) DeriveStudentWorksheet(masterContent string, lessonTitle string) string {
	return "=== Worksheet"
}
func (m *mockApp) CalculateSessionPacing(content string, conceptsCount int, targetMinutes int) *storage.SessionPacingReport {
	return &storage.SessionPacingReport{}
}
func (m *mockApp) ExtractCompendiumGlossary() (*storage.CompendiumGlossary, error) {
	return &storage.CompendiumGlossary{}, nil
}
func (m *mockApp) ExtractCompendiumResources() (*storage.ResourceMatrix, error) {
	return &storage.ResourceMatrix{}, nil
}
func (m *mockApp) StructureTranscription(rawTranscript string, sessionTitle string, audioRelPath string) *storage.StructuredSessionDraft {
	return &storage.StructuredSessionDraft{Title: sessionTitle}
}
func (m *mockApp) GenerateMultimediaScript(sessionRelPath string, scriptType string, durationMinutes int, tone string) (*storage.VideoScriptData, error) {
	return &storage.VideoScriptData{Title: "Script Test"}, nil
}
func (m *mockApp) GetGitRemoteInfo() (*git.RemoteInfo, error) {
	return &git.RemoteInfo{CurrentBranch: "main"}, nil
}
func (m *mockApp) GetGitBranches() (map[string]interface{}, error) {
	return map[string]interface{}{"current": "main"}, nil
}
func (m *mockApp) CreateGitBranch(branchName string, checkout bool) error {
	return nil
}
func (m *mockApp) CheckoutGitBranch(branchName string) error {
	return nil
}
func (m *mockApp) GetGitPullRequestURL(targetBranch string) (string, error) {
	return "https://github.com/test/pull/new", nil
}

func TestMCPEditorServer_Initialization(t *testing.T) {
	mock := &mockApp{}
	server := NewMCPEditorServer(mock)

	if server == nil {
		t.Fatalf("Expected non-nil MCPEditorServer")
	}

	if server.Server == nil {
		t.Fatalf("Expected non-nil mcp.Server")
	}
}
