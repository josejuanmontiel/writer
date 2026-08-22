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

const (
	WriterDir       = ".writer"
	ProjectFile     = ".writer/project.json"
	GraphGlobalFile = ".writer/graph-global.json"
	TemplatesDir    = ".writer/templates"
	ContentDir      = "content"
	JournalDir      = "journal"
	StaticDir       = "static"
	UnassignedDir   = "content/unassigned"
)

const defaultGitignore = `# Antigravity Writer gitignore
.DS_Store
Thumbs.db
*.tmp
temp/
static/cache/
`

// Plantilla de Demostración Completa (Showcase de todas las herramientas del editor)
const showcaseCompendiumSessionAdocTemplate = `= %s: Guía y Demostración del Editor
:author: %s
:date: %s
:doctype: book

[TIP]
.💡 Consejo Pedagógico
Bienvenido a Antigravity Writer. Este documento de ejemplo muestra todas las capacidades del editor visual y su persistencia en AsciiDoc.

== ✍️ 1. Tipografía y Estilos de Carácter
Puedes combinar múltiples estilos: *texto en negrita*, _texto en cursiva_, [.underline]#texto subrayado#, [.line-through]#texto tachado#, [.highlight]#resaltado fluorescente# y ` + "`" + `código inline` + "`" + `.

== 🧩 2. Bloques Pedagógicos y Advertencias
Los bloques facilitan destacar información crucial tanto para alumnos como para instructores:

[NOTE]
.📌 Nota Conceptual
Un punto clave o concepto teórico fundamental a recordar durante la explicación.

[WARNING]
.⚠️ Atención y Seguridad
Advertencia técnica de taller o normas preventivas antes de realizar una práctica.

[IMPORTANT]
.❗ Requisito Imprescindible
Requisito obligatorio o comprobación crítica de la sesión.

[INSTRUCTOR]
.👨‍🏫 Solo Instructor (Profesor)
Notas pedagógicas exclusivas para el docente: tiempos sugeridos, soluciones de ejercicios y dinámicas de grupo.

== 📋 3. Listas y Checklists de Taller
Listas numeradas para procedimientos paso a paso:
1. Primer paso: Preparación del entorno.
2. Segundo paso: Ejecución de la práctica guiada.
3. Tercer paso: Puesta en común de resultados.

Checklist de tareas interactivas para seguimiento de clase:
* [x] Repasar los conceptos previos
* [ ] Completar el ejercicio práctico en parejas
* [ ] Entregar el devlog de la sesión

== 📊 4. Tablas Estructuradas
|===
| Módulo | Tipo de Práctica | Duración
| Módulo 1: Fundamentos | Guiada en clase | 45 min
| Módulo 2: Taller | Práctica de laboratorio | 90 min
| Módulo 3: Proyecto Final | Desarrollo en equipo | 120 min
|===

== 💻 5. Bloques de Código Fuente
[source,python]
----
def calcular_rendimiento(potencia, consumo):
    """Calcula la eficiencia energética del sistema."""
    return (potencia / consumo) * 100
----

== 💬 6. Citas y Separadores
[quote]
____
La mejor forma de aprender es construir y documentar el proceso paso a paso.
____

'''

== 🚀 Siguientes Pasos
¡Empieza a escribir o utiliza el micrófono para dictar tus propias lecciones!
`

// Plantilla limpia y sin ruido para nuevos módulos y nuevas sesiones creadas por el usuario
const cleanSessionAdocTemplate = `= %s
:author: %s
:date: %s

== 🎯 Objetivos de la Sesión
* 

== ✍️ Desarrollo

`

const defaultModuleIndexAdocTemplate = `= %s
:doctype: part

== Descripción del Módulo
%s
`

// Plantilla de Portada / Landing Page del Curso en content/_index.adoc
const courseLandingAdocTemplate = `= %s
:author: %s
:date: %s
:doctype: book

[TIP]
.Bienvenido al Compendio Formativo
%s

== 📚 Módulos del Curso
Explora los módulos temáticos y lecciones prácticas disponibles en este compendio.

== 📔 Bitácora del Autor (DevLog)
Sigue el proceso de creación y reflexiones pedagógicas del autor en la sección de diario.
`

// Plantilla del Índice del Diario de Construcción en content/journal/_index.adoc
const journalIndexAdocTemplate = `= 📔 Diario de Construcción y Bitácora Pedagógica
:author: %s
:doctype: section

Espacio de reflexión pública sobre la evolución, decisiones metodológicas y anécdotas en la creación del compendio.
`

// Plantilla de una entrada individual de DevLog
const journalEntryAdocTemplate = `= 📝 %s
:author: %s
:date: %s
:type: devlog
%s

== 💡 Reflexión Pedagógica y Metodológica
Describe el motivo de las decisiones tomadas, cambios de enfoque o aprendizajes de la sesión.

== 🎯 Impacto en el Compendio
* Puntos clave incorporados o modificados.
* Observaciones para futuras sesiones o talleres.
`

// Configuración de Hugo (hugo.toml)
const defaultHugoConfigTemplate = `baseURL = "https://example.org/"
languageCode = "es-es"
title = "%s"
theme = "paper"

[params]
  author = "%s"
  description = "%s"
  devlog_enabled = true

[markup]
  [markup.asciidocExt]
    backend = "html5"
    safeMode = "safe"
    [markup.asciidocExt.attributes]
      icons = "font"
      sectanchors = "true"
      sectlinks = "true"

[menu]
  [[menu.main]]
    name = "Inicio"
    url = "/"
    weight = 1
  [[menu.main]]
    name = "Módulos"
    url = "/modulo-1/"
    weight = 2
  [[menu.main]]
    name = "Diario (DevLog)"
    url = "/journal/"
    weight = 3
`

// GitHub Actions Workflow (.github/workflows/hugo-pages.yml)
const defaultHugoGitHubWorkflow = `name: Desplegar Compendio y DevLog con Hugo

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repositorio
        uses: actions/checkout@v4
        with:
          submodules: recursive
          fetch-depth: 0

      - name: Instalar AsciiDoctor
        run: sudo apt-get update && sudo apt-get install -y asciidoctor

      - name: Configurar Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: 'latest'
          extended: true

      - name: Compilar Sitio Web
        run: hugo --minify

      - name: Subir Artefacto de Pages
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Desplegar en GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`


// CreateCompendium initializes the complete directory structure and git repository
func CreateCompendium(targetDir string, meta ProjectMeta) (*CompendiumInfo, error) {
	if targetDir == "" {
		return nil, fmt.Errorf("target directory cannot be empty")
	}

	// Create directories for Hugo structure + Writer internal configs
	dirs := []string{
		filepath.Join(targetDir, WriterDir),
		filepath.Join(targetDir, TemplatesDir),
		filepath.Join(targetDir, ContentDir, "modulo-1"),
		filepath.Join(targetDir, ContentDir, "journal"),
		filepath.Join(targetDir, ContentDir, "unassigned"),
		filepath.Join(targetDir, StaticDir),
		filepath.Join(targetDir, ".github", "workflows"),
	}

	for _, d := range dirs {
		if err := os.MkdirAll(d, 0755); err != nil {
			return nil, fmt.Errorf("failed to create directory %s: %w", d, err)
		}
	}

	now := time.Now()
	meta.CreatedAt = now
	meta.UpdatedAt = now
	if meta.Version == "" {
		meta.Version = "1.0.0"
	}
	if meta.Name == "" {
		meta.Name = filepath.Base(targetDir)
	}

	// 1. Write project.json
	metaBytes, err := json.MarshalIndent(meta, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("failed to serialize project meta: %w", err)
	}
	if err := os.WriteFile(filepath.Join(targetDir, ProjectFile), metaBytes, 0644); err != nil {
		return nil, fmt.Errorf("failed to write project.json: %w", err)
	}

	// 2. Write graph-global.json (empty graph)
	initialGraph := map[string]interface{}{
		"version":    "1.0",
		"updated_at": now.Format(time.RFC3339),
		"nodes":      []interface{}{},
		"edges":      []interface{}{},
	}
	graphBytes, _ := json.MarshalIndent(initialGraph, "", "  ")
	os.WriteFile(filepath.Join(targetDir, GraphGlobalFile), graphBytes, 0644)

	// 3. Write default lesson template in AsciiDoc
	templatePath := filepath.Join(targetDir, TemplatesDir, "sesion-default.adoc")
	tplContent := fmt.Sprintf(cleanSessionAdocTemplate, "Plantilla de Sesión", meta.Author, now.Format("2006-01-02"))
	os.WriteFile(templatePath, []byte(tplContent), 0644)

	// 4. Write Hugo config (hugo.toml) and GitHub Actions workflow
	hugoConfig := fmt.Sprintf(defaultHugoConfigTemplate, meta.Name, meta.Author, meta.Description)
	os.WriteFile(filepath.Join(targetDir, "hugo.toml"), []byte(hugoConfig), 0644)

	workflowPath := filepath.Join(targetDir, ".github", "workflows", "hugo-pages.yml")
	os.WriteFile(workflowPath, []byte(defaultHugoGitHubWorkflow), 0644)

	// 5. Write Course Landing Page (content/_index.adoc)
	courseLanding := fmt.Sprintf(courseLandingAdocTemplate, meta.Name, meta.Author, now.Format("2006-01-02"), meta.Description)
	os.WriteFile(filepath.Join(targetDir, ContentDir, "_index.adoc"), []byte(courseLanding), 0644)

	// 6. Write Module 1 files (content/modulo-1/)
	moduleIndex := fmt.Sprintf(defaultModuleIndexAdocTemplate, "Módulo 1: Fundamentos", "Introducción a los conceptos clave y fundamentos prácticos del compendio.")
	os.WriteFile(filepath.Join(targetDir, ContentDir, "modulo-1", "_index.adoc"), []byte(moduleIndex), 0644)

	firstSession := fmt.Sprintf(showcaseCompendiumSessionAdocTemplate, meta.Name, meta.Author, now.Format("2006-01-02"))
	os.WriteFile(filepath.Join(targetDir, ContentDir, "modulo-1", "sesion-01.adoc"), []byte(firstSession), 0644)

	// 7. Write Journal DevLog files (content/journal/)
	journalIndex := fmt.Sprintf(journalIndexAdocTemplate, meta.Author)
	os.WriteFile(filepath.Join(targetDir, ContentDir, "journal", "_index.adoc"), []byte(journalIndex), 0644)

	initialDevlog := fmt.Sprintf(journalEntryAdocTemplate, "Inicio del Compendio y Enfoque Pedagógico", meta.Author, now.Format("2006-01-02"), "")
	devlogFileName := fmt.Sprintf("%s-inicio-del-compendio.adoc", now.Format("2006-01-02"))
	os.WriteFile(filepath.Join(targetDir, ContentDir, "journal", devlogFileName), []byte(initialDevlog), 0644)

	// 8. Write .gitignore
	os.WriteFile(filepath.Join(targetDir, ".gitignore"), []byte(defaultGitignore), 0644)

	// 9. Initialize Git repository and make initial commit
	if _, err := git.InitRepo(targetDir); err != nil {
		return nil, fmt.Errorf("failed to init git repository: %w", err)
	}

	commitHash, err := git.CommitFiles(targetDir, nil, "Initial commit: Compendio inicializado con Hugo, DevLog y AsciiDoc", meta.Author, meta.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to make initial commit: %w", err)
	}

	return &CompendiumInfo{
		Path:       targetDir,
		Meta:       meta,
		LastCommit: commitHash,
		IsClean:    true,
	}, nil
}

// OpenCompendium validates and loads an existing compendium from disk
func OpenCompendium(targetDir string) (*CompendiumInfo, error) {
	projPath := filepath.Join(targetDir, ProjectFile)
	data, err := os.ReadFile(projPath)
	if err != nil {
		return nil, fmt.Errorf("not a valid Antigravity Writer compendium (.writer/project.json missing): %w", err)
	}

	var meta ProjectMeta
	if err := json.Unmarshal(data, &meta); err != nil {
		return nil, fmt.Errorf("invalid project.json file: %w", err)
	}

	// Ensure git repo is initialized if it wasn't
	git.InitRepo(targetDir)

	history, _ := git.GetFileHistory(targetDir, "", 1)
	lastCommit := ""
	if len(history) > 0 {
		lastCommit = history[0].ShortHash
	}

	statuses, _ := git.GetStatus(targetDir)

	return &CompendiumInfo{
		Path:       targetDir,
		Meta:       meta,
		LastCommit: lastCommit,
		IsClean:    len(statuses) == 0,
	}, nil
}

// GetFileTree returns the category-based file tree for the compendium UI
func GetFileTree(targetDir string) ([]FileNode, error) {
	categories := []struct {
		Name string
		Path string
	}{
		{Name: "Contenido del Curso", Path: ContentDir},
		{Name: "Bandeja de Ideas Flotantes", Path: UnassignedDir},
		{Name: "Diario Pedagógico (Journal)", Path: JournalDir},
		{Name: "Plantillas", Path: TemplatesDir},
		{Name: "Recursos Multimedia", Path: StaticDir},
	}

	var rootNodes []FileNode

	for _, cat := range categories {
		fullPath := filepath.Join(targetDir, cat.Path)
		if _, err := os.Stat(fullPath); os.IsNotExist(err) {
			continue
		}

		node, err := buildNode(targetDir, cat.Path, cat.Name)
		if err == nil {
			rootNodes = append(rootNodes, node)
		}
	}

	return rootNodes, nil
}

func buildNode(baseDir string, relPath string, displayName string) (FileNode, error) {
	fullPath := filepath.Join(baseDir, relPath)
	fi, err := os.Stat(fullPath)
	if err != nil {
		return FileNode{}, err
	}

	nodeName := displayName
	if nodeName == "" {
		nodeName = fi.Name()
	}

	node := FileNode{
		Name:         nodeName,
		RelativePath: filepath.ToSlash(relPath),
		IsDir:        fi.IsDir(),
		Size:         fi.Size(),
		ModTime:      fi.ModTime(),
	}

	if fi.IsDir() {
		entries, err := os.ReadDir(fullPath)
		if err == nil {
			for _, entry := range entries {
				if strings.HasPrefix(entry.Name(), ".") {
					continue
				}
				childRel := filepath.Join(relPath, entry.Name())
				childNode, childErr := buildNode(baseDir, childRel, "")
				if childErr == nil {
					node.Children = append(node.Children, childNode)
				}
			}
		}
	}

	return node, nil
}

// ReadFile reads the full text of a relative path file in the compendium
func ReadFile(targetDir, relativePath string) (string, error) {
	fullPath := filepath.Join(targetDir, filepath.Clean(relativePath))
	// Prevent path traversal
	if !strings.HasPrefix(filepath.Clean(fullPath), filepath.Clean(targetDir)) {
		return "", fmt.Errorf("access denied: path outside project directory")
	}

	data, err := os.ReadFile(fullPath)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}
	return string(data), nil
}

// SaveLessonFile writes content to a file and creates a git commit for time-travel
func SaveLessonFile(targetDir, relativePath, content, commitMsg, authorName, authorEmail string) error {
	fullPath := filepath.Join(targetDir, filepath.Clean(relativePath))
	if !strings.HasPrefix(filepath.Clean(fullPath), filepath.Clean(targetDir)) {
		return fmt.Errorf("access denied: path outside project directory")
	}

	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	if commitMsg == "" {
		commitMsg = fmt.Sprintf("Guardar %s", filepath.Base(relativePath))
	}

	cleanRel := filepath.ToSlash(filepath.Clean(relativePath))
	_, err := git.CommitFiles(targetDir, []string{cleanRel}, commitMsg, authorName, authorEmail)
	if err != nil {
		// Log commit error but allow file save to succeed
		fmt.Printf("Warning: auto-commit for %s failed: %v\n", cleanRel, err)
	}

	return nil
}

// CreateFile creates a new AsciiDoc or markdown file from an initial content or template and commits it
func CreateFile(targetDir, relativePath, initialContent, commitMsg, authorName, authorEmail string) error {
	fullPath := filepath.Join(targetDir, filepath.Clean(relativePath))
	if !strings.HasPrefix(filepath.Clean(fullPath), filepath.Clean(targetDir)) {
		return fmt.Errorf("access denied: path outside project directory")
	}

	if _, err := os.Stat(fullPath); err == nil {
		return fmt.Errorf("file already exists: %s", relativePath)
	}

	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	if initialContent == "" {
		title := strings.TrimSuffix(filepath.Base(relativePath), filepath.Ext(relativePath))
		initialContent = fmt.Sprintf(cleanSessionAdocTemplate, title, authorName, time.Now().Format("2006-01-02"))
	}

	if err := os.WriteFile(fullPath, []byte(initialContent), 0644); err != nil {
		return fmt.Errorf("failed to write new file: %w", err)
	}

	if commitMsg == "" {
		commitMsg = fmt.Sprintf("Crear archivo: %s", relativePath)
	}

	cleanRel := filepath.ToSlash(filepath.Clean(relativePath))
	_, _ = git.CommitFiles(targetDir, []string{cleanRel}, commitMsg, authorName, authorEmail)

	return nil
}

// UpdateFileTitleAndRename updates the main title heading in an AsciiDoc file and optionally renames the file
func UpdateFileTitleAndRename(targetDir, oldRelPath, newRelPath, newTitle, authorName, authorEmail string) (string, error) {
	oldFullPath := filepath.Join(targetDir, filepath.Clean(oldRelPath))
	if !strings.HasPrefix(filepath.Clean(oldFullPath), filepath.Clean(targetDir)) {
		return "", fmt.Errorf("access denied: path outside project directory")
	}

	data, err := os.ReadFile(oldFullPath)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	content := string(data)
	if newTitle != "" {
		lines := strings.Split(content, "\n")
		replaced := false
		for i, line := range lines {
			lineTrim := strings.TrimSpace(line)
			if strings.HasPrefix(lineTrim, "= ") && !strings.HasPrefix(lineTrim, "== ") {
				lines[i] = "= " + newTitle
				replaced = true
				break
			}
		}
		if !replaced {
			lines = append([]string{"= " + newTitle, ""}, lines...)
		}
		content = strings.Join(lines, "\n")
	}

	finalRelPath := oldRelPath
	if newRelPath != "" && newRelPath != oldRelPath {
		finalRelPath = newRelPath
		newFullPath := filepath.Join(targetDir, filepath.Clean(newRelPath))
		if !strings.HasPrefix(filepath.Clean(newFullPath), filepath.Clean(targetDir)) {
			return "", fmt.Errorf("access denied: new path outside project directory")
		}

		if err := os.MkdirAll(filepath.Dir(newFullPath), 0755); err != nil {
			return "", fmt.Errorf("failed to create target directory: %w", err)
		}

		if err := os.WriteFile(newFullPath, []byte(content), 0644); err != nil {
			return "", fmt.Errorf("failed to write new file: %w", err)
		}

		_ = os.Remove(oldFullPath)

		commitMsg := fmt.Sprintf("Renombrar y actualizar: %s", filepath.Base(finalRelPath))
		_, _ = git.CommitFiles(targetDir, []string{filepath.ToSlash(oldRelPath), filepath.ToSlash(finalRelPath)}, commitMsg, authorName, authorEmail)
	} else {
		if err := os.WriteFile(oldFullPath, []byte(content), 0644); err != nil {
			return "", fmt.Errorf("failed to write updated file: %w", err)
		}

		commitMsg := fmt.Sprintf("Actualizar título de lección: %s", newTitle)
		_, _ = git.CommitFiles(targetDir, []string{filepath.ToSlash(oldRelPath)}, commitMsg, authorName, authorEmail)
	}

	return finalRelPath, nil
}

// DeleteCompendiumFile removes a single file and commits the deletion to Git
func DeleteCompendiumFile(targetDir, relPath, authorName, authorEmail string) error {
	fullPath := filepath.Join(targetDir, filepath.Clean(relPath))
	if !strings.HasPrefix(filepath.Clean(fullPath), filepath.Clean(targetDir)) {
		return fmt.Errorf("access denied: path outside project directory")
	}

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return fmt.Errorf("el archivo no existe: %s", relPath)
	}

	if err := os.Remove(fullPath); err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	commitMsg := fmt.Sprintf("Eliminar archivo: %s", filepath.Base(relPath))
	cleanRel := filepath.ToSlash(filepath.Clean(relPath))
	_, err := git.CommitFiles(targetDir, []string{cleanRel}, commitMsg, authorName, authorEmail)
	if err != nil {
		fmt.Printf("Warning: commit for delete file %s failed: %v\n", cleanRel, err)
	}

	return nil
}


// CreateModule creates a new module directory in content/ with _index.adoc and sesion-01.adoc
func CreateModule(targetDir, moduleSlug, title, description, authorName, authorEmail string) error {
	if moduleSlug == "" {
		return fmt.Errorf("el identificador del módulo no puede estar vacío")
	}

	cleanSlug := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(moduleSlug), " ", "-"))
	moduleDir := filepath.Join(targetDir, ContentDir, cleanSlug)

	if _, err := os.Stat(moduleDir); err == nil {
		return fmt.Errorf("el módulo ya existe: %s", cleanSlug)
	}

	if err := os.MkdirAll(moduleDir, 0755); err != nil {
		return fmt.Errorf("failed to create module directory: %w", err)
	}

	if title == "" {
		title = cleanSlug
	}
	if description == "" {
		description = "Descripción y objetivos de aprendizaje del módulo."
	}

	// 1. Create _index.adoc
	indexContent := fmt.Sprintf(defaultModuleIndexAdocTemplate, title, description)
	if err := os.WriteFile(filepath.Join(moduleDir, "_index.adoc"), []byte(indexContent), 0644); err != nil {
		return err
	}

	// 2. Create first session sesion-01.adoc con plantilla limpia
	firstSessionTitle := fmt.Sprintf("%s - Sesión 1", title)
	sessionContent := fmt.Sprintf(cleanSessionAdocTemplate, firstSessionTitle, authorName, time.Now().Format("2006-01-02"))
	if err := os.WriteFile(filepath.Join(moduleDir, "sesion-01.adoc"), []byte(sessionContent), 0644); err != nil {
		return err
	}

	commitMsg := fmt.Sprintf("Crear módulo: %s", title)
	relIndex := filepath.ToSlash(filepath.Join(ContentDir, cleanSlug, "_index.adoc"))
	relSession := filepath.ToSlash(filepath.Join(ContentDir, cleanSlug, "sesion-01.adoc"))

	_, err := git.CommitFiles(targetDir, []string{relIndex, relSession}, commitMsg, authorName, authorEmail)
	if err != nil {
		fmt.Printf("Warning: commit for module %s failed: %v\n", cleanSlug, err)
	}

	return nil
}

// GetModules returns all module folders in content/
func GetModules(targetDir string) ([]ModuleInfo, error) {
	contentDirPath := filepath.Join(targetDir, ContentDir)
	entries, err := os.ReadDir(contentDirPath)
	if err != nil {
		return []ModuleInfo{}, nil
	}

	var modules []ModuleInfo
	for _, entry := range entries {
		if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") || entry.Name() == "unassigned" || entry.Name() == "journal" {
			continue
		}

		slug := entry.Name()
		title := slug
		description := ""

		// Try reading _index.adoc or _index.md
		indexPath := filepath.Join(contentDirPath, slug, "_index.adoc")
		if _, statErr := os.Stat(indexPath); statErr != nil {
			indexPath = filepath.Join(contentDirPath, slug, "_index.md")
		}

		if data, err := os.ReadFile(indexPath); err == nil {
			lines := strings.Split(string(data), "\n")
			for _, line := range lines {
				lineTrim := strings.TrimSpace(line)
				if strings.HasPrefix(lineTrim, "= ") {
					title = strings.TrimPrefix(lineTrim, "= ")
					break
				} else if strings.HasPrefix(lineTrim, "# ") {
					title = strings.TrimPrefix(lineTrim, "# ")
					break
				} else if strings.HasPrefix(lineTrim, "title:") {
					title = strings.Trim(strings.TrimPrefix(lineTrim, "title:"), ` "'`)
					break
				}
			}
		}

		modules = append(modules, ModuleInfo{
			Slug:        slug,
			Title:       title,
			Path:        filepath.ToSlash(filepath.Join(ContentDir, slug)),
			Description: description,
		})
	}

	return modules, nil
}

// UpdateModule updates the title and description in _index.adoc and commits the change
func UpdateModule(targetDir, moduleSlug, newTitle, newDescription, authorName, authorEmail string) error {
	if moduleSlug == "" {
		return fmt.Errorf("el identificador del módulo no puede estar vacío")
	}

	cleanSlug := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(moduleSlug), " ", "-"))
	moduleDir := filepath.Join(targetDir, ContentDir, cleanSlug)

	if _, err := os.Stat(moduleDir); os.IsNotExist(err) {
		return fmt.Errorf("el módulo no existe: %s", cleanSlug)
	}

	if newTitle == "" {
		newTitle = cleanSlug
	}

	// Update _index.adoc
	indexContent := fmt.Sprintf(defaultModuleIndexAdocTemplate, newTitle, newDescription)
	indexPath := filepath.Join(moduleDir, "_index.adoc")
	if err := os.WriteFile(indexPath, []byte(indexContent), 0644); err != nil {
		return fmt.Errorf("failed to write _index.adoc: %w", err)
	}

	commitMsg := fmt.Sprintf("Actualizar módulo: %s", newTitle)
	relIndex := filepath.ToSlash(filepath.Join(ContentDir, cleanSlug, "_index.adoc"))
	_, err := git.CommitFiles(targetDir, []string{relIndex}, commitMsg, authorName, authorEmail)
	if err != nil {
		fmt.Printf("Warning: commit for update module %s failed: %v\n", cleanSlug, err)
	}

	return nil
}

// DeleteModule removes the module directory in content/ and commits the deletion
func DeleteModule(targetDir, moduleSlug, authorName, authorEmail string) error {
	if moduleSlug == "" {
		return fmt.Errorf("el identificador del módulo no puede estar vacío")
	}

	cleanSlug := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(moduleSlug), " ", "-"))
	if cleanSlug == "unassigned" {
		return fmt.Errorf("no se puede eliminar la bandeja de ideas flotantes")
	}

	moduleDir := filepath.Join(targetDir, ContentDir, cleanSlug)
	if _, err := os.Stat(moduleDir); os.IsNotExist(err) {
		return fmt.Errorf("el módulo no existe: %s", cleanSlug)
	}

	if err := os.RemoveAll(moduleDir); err != nil {
		return fmt.Errorf("failed to remove module directory: %w", err)
	}

	commitMsg := fmt.Sprintf("Eliminar módulo: %s", cleanSlug)
	relModule := filepath.ToSlash(filepath.Join(ContentDir, cleanSlug))
	_, err := git.CommitFiles(targetDir, []string{relModule}, commitMsg, authorName, authorEmail)
	if err != nil {
		fmt.Printf("Warning: commit for delete module %s failed: %v\n", cleanSlug, err)
	}

	return nil
}

// CreateJournalEntry creates a new DevLog entry in content/journal/
func CreateJournalEntry(targetDir, title, slug, relatedSession, authorName, authorEmail string) (string, error) {
	if title == "" {
		return "", fmt.Errorf("el título de la entrada no puede estar vacío")
	}

	now := time.Now()
	dateStr := now.Format("2006-01-02")

	cleanSlug := slug
	if cleanSlug == "" {
		cleanSlug = strings.ToLower(strings.ReplaceAll(strings.TrimSpace(title), " ", "-"))
		cleanSlug = strings.Map(func(r rune) rune {
			if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
				return r
			}
			return -1
		}, cleanSlug)
	}

	if cleanSlug == "" {
		cleanSlug = "reflexion"
	}

	fileName := fmt.Sprintf("%s-%s.adoc", dateStr, cleanSlug)
	journalDir := filepath.Join(targetDir, ContentDir, "journal")
	if err := os.MkdirAll(journalDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create journal directory: %w", err)
	}

	filePath := filepath.Join(journalDir, fileName)
	if _, err := os.Stat(filePath); err == nil {
		// If exists, append timestamp
		fileName = fmt.Sprintf("%s-%s-%d.adoc", dateStr, cleanSlug, now.Unix())
		filePath = filepath.Join(journalDir, fileName)
	}

	relatedMeta := ""
	if relatedSession != "" {
		relatedMeta = fmt.Sprintf(":related_session: %s\n", relatedSession)
	}

	content := fmt.Sprintf(journalEntryAdocTemplate, title, authorName, dateStr, relatedMeta)
	if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
		return "", fmt.Errorf("failed to write journal entry: %w", err)
	}

	relPath := filepath.ToSlash(filepath.Join(ContentDir, "journal", fileName))
	commitMsg := fmt.Sprintf("DevLog: %s", title)
	_, _ = git.CommitFiles(targetDir, []string{relPath}, commitMsg, authorName, authorEmail)

	return relPath, nil
}

// GetJournalEntries returns all DevLog entries from content/journal/ sorted by date (newest first)
func GetJournalEntries(targetDir string) ([]JournalEntryInfo, error) {
	journalDir := filepath.Join(targetDir, ContentDir, "journal")
	entries, err := os.ReadDir(journalDir)
	if err != nil {
		return []JournalEntryInfo{}, nil
	}

	var results []JournalEntryInfo
	for _, entry := range entries {
		if entry.IsDir() || strings.HasPrefix(entry.Name(), ".") || entry.Name() == "_index.adoc" || entry.Name() == "_index.md" {
			continue
		}

		if !strings.HasSuffix(entry.Name(), ".adoc") && !strings.HasSuffix(entry.Name(), ".md") {
			continue
		}

		filePath := filepath.Join(journalDir, entry.Name())
		info, statErr := entry.Info()
		modTime := time.Now()
		if statErr == nil {
			modTime = info.ModTime()
		}

		title := strings.TrimSuffix(entry.Name(), filepath.Ext(entry.Name()))
		dateStr := ""
		relatedSession := ""
		summary := ""

		if data, err := os.ReadFile(filePath); err == nil {
			lines := strings.Split(string(data), "\n")
			for _, line := range lines {
				lineTrim := strings.TrimSpace(line)
				if strings.HasPrefix(lineTrim, "= 📝 ") {
					title = strings.TrimPrefix(lineTrim, "= 📝 ")
				} else if strings.HasPrefix(lineTrim, "= ") && !strings.HasPrefix(lineTrim, "== ") {
					title = strings.TrimPrefix(lineTrim, "= ")
				} else if strings.HasPrefix(lineTrim, ":date:") {
					dateStr = strings.TrimSpace(strings.TrimPrefix(lineTrim, ":date:"))
				} else if strings.HasPrefix(lineTrim, ":related_session:") {
					relatedSession = strings.TrimSpace(strings.TrimPrefix(lineTrim, ":related_session:"))
				} else if summary == "" && lineTrim != "" && !strings.HasPrefix(lineTrim, ":") && !strings.HasPrefix(lineTrim, "=") && !strings.HasPrefix(lineTrim, "[") {
					summary = lineTrim
				}
			}
		}

		if dateStr == "" {
			// Extract date from filename if present (YYYY-MM-DD-...)
			parts := strings.Split(entry.Name(), "-")
			if len(parts) >= 3 && len(parts[0]) == 4 {
				dateStr = fmt.Sprintf("%s-%s-%s", parts[0], parts[1], parts[2])
			} else {
				dateStr = modTime.Format("2006-01-02")
			}
		}

		relPath := filepath.ToSlash(filepath.Join(ContentDir, "journal", entry.Name()))
		results = append(results, JournalEntryInfo{
			Slug:           strings.TrimSuffix(entry.Name(), filepath.Ext(entry.Name())),
			Title:          title,
			Path:           relPath,
			Date:           dateStr,
			RelatedSession: relatedSession,
			Summary:        summary,
			ModTime:        modTime,
		})
	}

	return results, nil
}



