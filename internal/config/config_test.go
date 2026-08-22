package config

import (
	"testing"
)

func TestRecentCompendiums(t *testing.T) {
	cfg := &Config{}

	cfg.AddRecentCompendium("/path/to/curso-1", "Curso 1")
	if len(cfg.RecentCompendiums) != 1 {
		t.Fatalf("expected 1 recent compendium, got %d", len(cfg.RecentCompendiums))
	}
	if cfg.LastCompendiumPath != "/path/to/curso-1" {
		t.Errorf("expected LastCompendiumPath to be /path/to/curso-1, got %s", cfg.LastCompendiumPath)
	}

	cfg.AddRecentCompendium("/path/to/curso-2", "Curso 2")
	if len(cfg.RecentCompendiums) != 2 {
		t.Fatalf("expected 2 recent compendiums, got %d", len(cfg.RecentCompendiums))
	}
	if cfg.RecentCompendiums[0].Name != "Curso 2" {
		t.Errorf("expected most recent to be Curso 2, got %s", cfg.RecentCompendiums[0].Name)
	}

	// Re-add Curso 1 (should move to top without duplicating)
	cfg.AddRecentCompendium("/path/to/curso-1", "Curso 1 Modificado")
	if len(cfg.RecentCompendiums) != 2 {
		t.Fatalf("expected 2 recent compendiums after re-add, got %d", len(cfg.RecentCompendiums))
	}
	if cfg.RecentCompendiums[0].Name != "Curso 1 Modificado" {
		t.Errorf("expected top to be Curso 1 Modificado, got %s", cfg.RecentCompendiums[0].Name)
	}

	// Remove Curso 2
	cfg.RemoveRecentCompendium("/path/to/curso-2")
	if len(cfg.RecentCompendiums) != 1 {
		t.Fatalf("expected 1 recent compendium after removal, got %d", len(cfg.RecentCompendiums))
	}
}
