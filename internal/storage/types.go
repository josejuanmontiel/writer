package storage

import "time"

// ProjectMeta holds configuration and metadata for a compendium project
type ProjectMeta struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Author      string            `json:"author"`
	Email       string            `json:"email"`
	Version     string            `json:"version"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	Settings    map[string]string `json:"settings,omitempty"`
}

// CompendiumInfo holds loaded compendium details
type CompendiumInfo struct {
	Path        string      `json:"path"`
	Meta        ProjectMeta `json:"meta"`
	LastCommit  string      `json:"last_commit"`
	IsClean     bool        `json:"is_clean"`
}

// FileNode represents a file or folder in the compendium tree
type FileNode struct {
	Name         string     `json:"name"`
	RelativePath string     `json:"relative_path"`
	IsDir        bool       `json:"is_dir"`
	Size         int64      `json:"size"`
	ModTime      time.Time  `json:"mod_time"`
	Category     string     `json:"category"` // "content", "journal", "static", "templates", "root"
	Children     []FileNode `json:"children,omitempty"`
}

// ModuleInfo represents a content module (folder in content/)
type ModuleInfo struct {
	Slug        string `json:"slug"`
	Title       string `json:"title"`
	Path        string `json:"path"`
	Description string `json:"description"`
}

// JournalEntryInfo represents a DevLog entry in content/journal/
type JournalEntryInfo struct {
	Slug           string    `json:"slug"`
	Title          string    `json:"title"`
	Path           string    `json:"path"`
	Date           string    `json:"date"`
	RelatedSession string    `json:"related_session,omitempty"`
	Summary        string    `json:"summary,omitempty"`
	ModTime        time.Time `json:"mod_time"`
}

// WizardSession holds custom session titles or generated attributes
type WizardSession struct {
	Title      string   `json:"title"`
	Week       int      `json:"week"`
	Date       string   `json:"date,omitempty"`
	Objectives []string `json:"objectives,omitempty"`
}

// WizardModule defines a thematic block created via the Wizard
type WizardModule struct {
	Slug         string          `json:"slug"`
	Title        string          `json:"title"`
	Description  string          `json:"description"`
	Year         int             `json:"year,omitempty"` // For multi-year courses (e.g. 1 or 2)
	SessionCount int             `json:"session_count"`
	Sessions     []WizardSession `json:"sessions,omitempty"`
}

// WizardCalendar holds calendar settings and key dates
type WizardCalendar struct {
	StartDate       string   `json:"start_date"` // YYYY-MM-DD
	SessionDuration int      `json:"session_duration"` // in minutes (e.g. 60)
	Vacations       []string `json:"vacations,omitempty"` // Break weeks or dates
	Milestones      []string `json:"milestones,omitempty"` // Key milestone dates
}

// WizardTemplateBlock defines a customizable pedagogical block in the lesson template
type WizardTemplateBlock struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Kind    string `json:"kind"` // "heading", "instructor", "note", "tip", "important", "quote", "custom"
	Content string `json:"content"`
	Enabled bool   `json:"enabled"`
}

// WizardConfig contains all settings from the Compendium Outliner Wizard
type WizardConfig struct {
	TargetDir              string                `json:"target_dir"`
	Name                   string                `json:"name"`
	Description            string                `json:"description"`
	Author                 string                `json:"author"`
	Email                  string                `json:"email"`
	HorizonType            string                `json:"horizon_type"` // "multi_year", "annual", "intensive", "custom"
	Years                  int                   `json:"years"`
	DurationMinutes        int                   `json:"duration_minutes"`
	IncludeInstructorNotes bool                  `json:"include_instructor_notes"`
	IncludeStudentNotes    bool                  `json:"include_student_notes"`
	TemplateBlocks         []WizardTemplateBlock `json:"template_blocks,omitempty"`
	Modules                []WizardModule        `json:"modules"`
	Calendar               WizardCalendar        `json:"calendar"`
}


