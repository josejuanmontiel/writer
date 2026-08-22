package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"antigravity-writer/internal/git"
)

// buildSessionAsciiDoc constructs structured lesson AsciiDoc content with ample spacing
func buildSessionAsciiDoc(title, author, dateStr string, week, duration int, blocks []WizardTemplateBlock, includeInstructor, includeStudent bool) string {
	var sb strings.Builder

	// 1. Header Metadata
	sb.WriteString(fmt.Sprintf("= %s\n", title))
	if author != "" {
		sb.WriteString(fmt.Sprintf(":author: %s\n", author))
	}
	if dateStr != "" {
		sb.WriteString(fmt.Sprintf(":date: %s\n", dateStr))
	}
	if week > 0 {
		sb.WriteString(fmt.Sprintf(":week: %d\n", week))
	}
	if duration > 0 {
		sb.WriteString(fmt.Sprintf(":duration: %d min\n", duration))
	}
	sb.WriteString(":doctype: article\n\n")

	// 2. Custom or Default Blocks with ample breathing spacing
	if len(blocks) > 0 {
		for _, b := range blocks {
			if !b.Enabled {
				continue
			}

			switch b.Kind {
			case "instructor":
				sb.WriteString("[INSTRUCTOR]\n")
				if b.Title != "" {
					sb.WriteString(fmt.Sprintf(".%s\n", b.Title))
				}
				content := strings.TrimSpace(b.Content)
				if content == "" {
					content = "* Notas y recomendaciones pedagógicas para el docente."
				}
				sb.WriteString(content)
				sb.WriteString("\n\n\n")

			case "note":
				sb.WriteString("[NOTE]\n")
				if b.Title != "" {
					sb.WriteString(fmt.Sprintf(".%s\n", b.Title))
				}
				content := strings.TrimSpace(b.Content)
				if content == "" {
					content = "* Espacio para notas y reflexiones del alumno."
				}
				sb.WriteString(content)
				sb.WriteString("\n\n\n")

			case "tip":
				sb.WriteString("[TIP]\n")
				if b.Title != "" {
					sb.WriteString(fmt.Sprintf(".%s\n", b.Title))
				}
				content := strings.TrimSpace(b.Content)
				if content == "" {
					content = "* Consejo práctico para la clase."
				}
				sb.WriteString(content)
				sb.WriteString("\n\n\n")

			case "warning":
				sb.WriteString("[WARNING]\n")
				if b.Title != "" {
					sb.WriteString(fmt.Sprintf(".%s\n", b.Title))
				}
				content := strings.TrimSpace(b.Content)
				if content == "" {
					content = "* Punto de especial atención o seguridad."
				}
				sb.WriteString(content)
				sb.WriteString("\n\n\n")

			case "important":
				sb.WriteString("[IMPORTANT]\n")
				if b.Title != "" {
					sb.WriteString(fmt.Sprintf(".%s\n", b.Title))
				}
				content := strings.TrimSpace(b.Content)
				if content == "" {
					content = "* Concepto clave imprescindible a recordar."
				}
				sb.WriteString(content)
				sb.WriteString("\n\n\n")

			case "quote":
				sb.WriteString("[quote]\n____\n")
				content := strings.TrimSpace(b.Content)
				if content == "" {
					content = "Cita destacada, pasaje o testimonio..."
				}
				sb.WriteString(content)
				sb.WriteString("\n____\n\n\n")

			case "custom":
				sb.WriteString(strings.TrimSpace(b.Content))
				sb.WriteString("\n\n\n")

			case "heading":
			default:
				if b.Title != "" {
					sb.WriteString(fmt.Sprintf("== %s\n", b.Title))
				}
				if strings.TrimSpace(b.Content) != "" {
					sb.WriteString(strings.TrimSpace(b.Content))
					sb.WriteString("\n")
				}
				sb.WriteString("\n\n")
			}
		}
	} else {
		// Default blocks with clean ample spacing
		sb.WriteString("== 🎯 Objetivos de la Sesión\n")
		sb.WriteString("* Comprender los conceptos fundamentales del tema.\n")
		sb.WriteString("* Desarrollar la actividad práctica y dinámicas de grupo.\n")
		sb.WriteString("* Formular conclusiones y compromisos de aprendizaje.\n\n\n")

		sb.WriteString("== 📦 Materiales y Dinámica de Inicio\n")
		sb.WriteString("* **Materiales necesarios**: Cuadernos, fichas de trabajo, proyector/recursos visuales.\n")
		sb.WriteString("* **Dinámica rompehielos (10 min)**: Breve pregunta motivadora o testimonio para captar la atención.\n\n\n")

		if includeInstructor {
			sb.WriteString("[INSTRUCTOR]\n")
			sb.WriteString(".👨‍🏫 Notas Pedagógicas del Formador / Catequista\n")
			sb.WriteString("* **Objetivo didáctico clave**: Asegurar que los alumnos comprendan el mensaje central.\n")
			sb.WriteString("* **Tiempos recomendados**: 10 min inicio, 25 min desarrollo, 20 min práctica, 5 min cierre.\n")
			sb.WriteString("* **Preguntas para debate**: ¿Qué aplicaciones prácticas vemos en el día a día?\n\n\n")
		}

		sb.WriteString("== 📖 Desarrollo Conceptual\n")
		sb.WriteString("Espacio para volcar la explicación teórica, pasajes clave, anécdotas o demostración técnica.\n\n\n")

		sb.WriteString("== 🛠️ Actividad Práctica y Taller en Grupo\n")
		sb.WriteString("1. Trabajo guiado en parejas o grupos pequeños.\n")
		sb.WriteString("2. Puesta en común de dudas o descubrimientos.\n\n\n")

		if includeStudent {
			sb.WriteString("[NOTE]\n")
			sb.WriteString(".📝 Cuaderno del Participante\n")
			sb.WriteString("* Resumen de la sesión para repasar en casa.\n")
			sb.WriteString("* Espacio para notas personales o reflexiones.\n\n\n")
		}

		sb.WriteString("== 💬 Conclusión y Compromiso Semanal\n")
		sb.WriteString("* **Resumen**: Idea central a recordar.\n")
		sb.WriteString("* **Compromiso / Tarea**: Acción práctica para aplicar durante la semana.\n\n")
	}

	return strings.TrimSpace(sb.String()) + "\n"
}

// GenerateCompendiumFromWizard creates a complete multi-module structured compendium from WizardConfig
func GenerateCompendiumFromWizard(cfg WizardConfig) (*CompendiumInfo, error) {
	if cfg.TargetDir == "" {
		return nil, fmt.Errorf("target directory cannot be empty")
	}
	if cfg.Name == "" {
		cfg.Name = filepath.Base(cfg.TargetDir)
	}
	if cfg.DurationMinutes <= 0 {
		cfg.DurationMinutes = 60
	}
	if cfg.Calendar.SessionDuration <= 0 {
		cfg.Calendar.SessionDuration = cfg.DurationMinutes
	}

	// Calculate start date
	startDate := time.Now()
	if cfg.Calendar.StartDate != "" {
		if parsed, err := time.Parse("2006-01-02", cfg.Calendar.StartDate); err == nil {
			startDate = parsed
		}
	}

	// 1. Create base directory structure
	dirs := []string{
		filepath.Join(cfg.TargetDir, WriterDir),
		filepath.Join(cfg.TargetDir, TemplatesDir),
		filepath.Join(cfg.TargetDir, ContentDir, "journal"),
		filepath.Join(cfg.TargetDir, ContentDir, "unassigned"),
		filepath.Join(cfg.TargetDir, StaticDir),
		filepath.Join(cfg.TargetDir, ".github", "workflows"),
	}

	for _, d := range dirs {
		if err := os.MkdirAll(d, 0755); err != nil {
			return nil, fmt.Errorf("failed to create directory %s: %w", d, err)
		}
	}

	// 2. Write project.json
	now := time.Now()
	meta := ProjectMeta{
		ID:          strings.ToLower(strings.ReplaceAll(cfg.Name, " ", "-")),
		Name:        cfg.Name,
		Description: cfg.Description,
		Author:      cfg.Author,
		Email:       cfg.Email,
		Version:     "1.0.0",
		CreatedAt:   now,
		UpdatedAt:   now,
		Settings: map[string]string{
			"horizon_type":     cfg.HorizonType,
			"duration_minutes": fmt.Sprintf("%d", cfg.DurationMinutes),
			"start_date":       startDate.Format("2006-01-02"),
		},
	}

	metaBytes, err := json.MarshalIndent(meta, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to serialize project meta: %w", err)
	}
	if err := os.WriteFile(filepath.Join(cfg.TargetDir, ProjectFile), metaBytes, 0644); err != nil {
		return nil, fmt.Errorf("failed to write project.json: %w", err)
	}

	// 3. Write initial graph-global.json
	initialGraph := map[string]interface{}{
		"version":    "1.0",
		"updated_at": now.Format(time.RFC3339),
		"nodes":      []interface{}{},
		"edges":      []interface{}{},
	}
	graphBytes, _ := json.MarshalIndent(initialGraph, "", "  ")
	os.WriteFile(filepath.Join(cfg.TargetDir, GraphGlobalFile), graphBytes, 0644)

	// 4. Write default lesson template in .writer/templates/
	templatePath := filepath.Join(cfg.TargetDir, TemplatesDir, "sesion-default.adoc")
	tplContent := fmt.Sprintf(cleanSessionAdocTemplate, "Plantilla de Sesión", cfg.Author, now.Format("2006-01-02"))
	os.WriteFile(templatePath, []byte(tplContent), 0644)

	// 5. Write Hugo config (hugo.toml) and GitHub Actions workflow
	hugoConfig := fmt.Sprintf(defaultHugoConfigTemplate, cfg.Name, cfg.Author, cfg.Description)
	os.WriteFile(filepath.Join(cfg.TargetDir, "hugo.toml"), []byte(hugoConfig), 0644)

	workflowPath := filepath.Join(cfg.TargetDir, ".github", "workflows", "hugo-pages.yml")
	os.WriteFile(workflowPath, []byte(defaultHugoGitHubWorkflow), 0644)

	// 6. Write Course Landing Page (content/_index.adoc)
	courseLanding := fmt.Sprintf(courseLandingAdocTemplate, cfg.Name, cfg.Author, now.Format("2006-01-02"), cfg.Description)
	os.WriteFile(filepath.Join(cfg.TargetDir, ContentDir, "_index.adoc"), []byte(courseLanding), 0644)

	// 7. Write Journal DevLog files (content/journal/)
	journalIndex := fmt.Sprintf(journalIndexAdocTemplate, cfg.Author)
	os.WriteFile(filepath.Join(cfg.TargetDir, ContentDir, "journal", "_index.adoc"), []byte(journalIndex), 0644)

	initialDevlog := fmt.Sprintf(journalEntryAdocTemplate, "Planificación y Estructuración del Compendio", cfg.Author, now.Format("2006-01-02"), "")
	devlogFileName := fmt.Sprintf("%s-planificacion-estructuracion.adoc", now.Format("2006-01-02"))
	os.WriteFile(filepath.Join(cfg.TargetDir, ContentDir, "journal", devlogFileName), []byte(initialDevlog), 0644)

	// 8. Generate Modules & Sessions
	if len(cfg.Modules) == 0 {
		// Default single module if none provided
		cfg.Modules = []WizardModule{
			{
				Slug:         "modulo-1-fundamentos",
				Title:        "Módulo 1: Fundamentos y Conceptos Clave",
				Description:  "Introducción y bases del conocimiento.",
				SessionCount: 4,
			},
		}
	}

	globalWeek := 1
	totalSessionsGenerated := 0
	currentSessionDate := startDate

	for mIdx, mod := range cfg.Modules {
		cleanSlug := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(mod.Slug), " ", "-"))
		if cleanSlug == "" {
			cleanSlug = fmt.Sprintf("modulo-%d", mIdx+1)
		}

		moduleDir := filepath.Join(cfg.TargetDir, ContentDir, cleanSlug)
		if err := os.MkdirAll(moduleDir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create module dir %s: %w", cleanSlug, err)
		}

		if mod.Title == "" {
			mod.Title = fmt.Sprintf("Módulo %d: %s", mIdx+1, strings.Title(strings.ReplaceAll(cleanSlug, "-", " ")))
		}
		if mod.Description == "" {
			mod.Description = fmt.Sprintf("Objetivos formativos y contenidos del %s.", mod.Title)
		}

		// Write module _index.adoc
		moduleIndexContent := fmt.Sprintf(defaultModuleIndexAdocTemplate, mod.Title, mod.Description)
		os.WriteFile(filepath.Join(moduleDir, "_index.adoc"), []byte(moduleIndexContent), 0644)

		// Determine number of sessions
		count := mod.SessionCount
		if count <= 0 && len(mod.Sessions) > 0 {
			count = len(mod.Sessions)
		}
		if count <= 0 {
			count = 3
		}

		for sIdx := 0; sIdx < count; sIdx++ {
			sessionNumber := sIdx + 1
			sessionFileName := fmt.Sprintf("sesion-%02d.adoc", sessionNumber)
			sessionFilePath := filepath.Join(moduleDir, sessionFileName)

			sessionTitle := fmt.Sprintf("%s - Sesión %d", mod.Title, sessionNumber)
			if sIdx < len(mod.Sessions) && mod.Sessions[sIdx].Title != "" {
				sessionTitle = mod.Sessions[sIdx].Title
			}

			sessionDateStr := currentSessionDate.Format("2006-01-02")
			sessionContent := buildSessionAsciiDoc(
				sessionTitle,
				cfg.Author,
				sessionDateStr,
				globalWeek,
				cfg.DurationMinutes,
				cfg.TemplateBlocks,
				cfg.IncludeInstructorNotes,
				cfg.IncludeStudentNotes,
			)

			os.WriteFile(sessionFilePath, []byte(sessionContent), 0644)

			globalWeek++
			totalSessionsGenerated++
			currentSessionDate = currentSessionDate.AddDate(0, 0, 7) // +1 week
		}
	}

	// 9. Write .gitignore
	os.WriteFile(filepath.Join(cfg.TargetDir, ".gitignore"), []byte(defaultGitignore), 0644)

	// 10. Init git repository and commit
	if _, err := git.InitRepo(cfg.TargetDir); err != nil {
		return nil, fmt.Errorf("failed to init git repo: %w", err)
	}

	commitMsg := fmt.Sprintf("Inicialización con Asistente: %d módulos, %d sesiones calendarizadas", len(cfg.Modules), totalSessionsGenerated)
	commitHash, err := git.CommitFiles(cfg.TargetDir, nil, commitMsg, cfg.Author, cfg.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to create initial commit: %w", err)
	}

	return &CompendiumInfo{
		Path:       cfg.TargetDir,
		Meta:       meta,
		LastCommit: commitHash,
		IsClean:    true,
	}, nil
}
