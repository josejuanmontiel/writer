# Antigravity Writer - Roadmap & TODO

> **Visión del Proyecto**: **Writer** es una herramienta de autoría para **crear compendios de conocimiento, cursos y formaciones (online y offline)**. Su objetivo es ayudar a personas con experiencia (maestros, formadores, mecánicos, ingenieros, divulgadores) a volcar, estructurar, validar y publicar su conocimiento mediante una base sólida local-first, gestión del tiempo/calendario, grafos de dependencias multinivel y generación de contenidos multiformato.

---

## 🎯 1. BLOQUE FUNCIONAL: Compendios de Conocimiento y Formaciones

### 💾 1.1. Persistencia Local-First con Git Nativo y Estructura de Proyecto
- [x] **Estructura de Archivos Estándar, Transparente y Modular**:
  ```
  mi-compendio/ (Git Repo)
  ├── .writer/              # Configuración del proyecto, plantillas y grafos
  │   ├── project.json      # Metadatos del curso/compendio, calendario y roles
  │   ├── graph-global.json # Grafo consolidado acumulado de todo el curso
  │   └── templates/        # Plantillas de sesión/capítulo
  ├── content/              # Contenido en Markdown con frontmatter YAML
  │   ├── modulo-1/
  │   │   ├── _index.md
  │   │   ├── sesion-01.md  # Lección con bloques estructurados
  │   │   └── ...
  │   ├── modulo-2/
  │   └── unassigned/       # 📥 Bandeja de temas/ideas flotantes (sin asignar a semana/clase)
  ├── journal/              # Bitácora / Diario de construcción pedagógica
  └── static/               # Audios (.wav/.mp3), diagramas e imágenes
  ```
- [x] **Motor Git Local (100% Offline-First con `go-git`)**:
  - Inicialización automática del repositorio `git init` al crear un compendio (0 CGO, pure Go).
  - Auto-commits locales tras guardar o crear sesiones para "deshacer infinito" y trazabilidad sin conexión.
  - Navegador temporal y recuperación de versiones históricas en la UI.
- [ ] **Colaboración Grupal y Sincronización Online**:
  - Capacidad de sincronizar el repositorio con GitHub/GitLab o servidor propio para co-autoría en equipo.

---

### 📔 1.2. Diario de Construcción y Generador de Sitio Web (`Hugo DevLog & Site`)
- [x] **Bitácora de Metacognición Pedagógica / Técnica**:
  - Espacio dedicado en cada proyecto (`content/journal/`) para que el autor documente reflexiones sobre la evolución del material (*"¿Por qué cambié este enfoque?"*, *"Qué anécdotas funcionan mejor"*).
  - Modal `NewJournalEntryModal` para redactar y vincular reflexiones a sesiones/módulos con fecha automática y commits en Git.
- [x] **Doble Publicación con Generador Estático (Hugo)**:
  - *Sitio Web del Curso*: Portada / Landing del compendio con módulos temáticos y lecciones.
  - *Blog / DevLog del Autor*: Publicación cronológica del proceso de construcción pedagógica.
  - Generación nativa de `hugo.toml` y `.github/workflows/hugo-pages.yml` para despliegue continuo en GitHub Pages en cada push.
- [x] **Dualidad Online/Offline en Publicación**:
  - Previsualizador web integrado multidispositivo (Escritorio / Móvil) 100% offline con `SitePreviewModal`.


---

### 🧙‍♂️ 1.3. Asistente Determinista de Estructuración y Calendario (`Compendium Outliner Wizard`)
*(Objetivo: Generar el esqueleto completo de archivos, calendario y temas SIN requerir IA inicialmente)*
- [x] **Bloque 1: Estructura Temporal y Calendario**:
  - Definición de horizontes temporales (Catequesis plurianual de 2 años / 60 sesiones, Curso escolar 30 semanas, Taller monográfico 10 semanas o Personalizado).
  - Configuración de duración por clase (45, 60, 90, 120 min) y fecha de inicio.
  - Cálculo determinista automático de semanas correlativas y fechas de cada sesión.
- [x] **Bloque 2: Estructura de Contenidos y Roles**:
  - Módulos temáticos configurables con número de sesiones por bloque.
  - Plantilla pedagógica normalizada (Objetivos, Dinámica rompehielos, Desarrollo, Actividad práctica y Compromiso).
  - Bloques de rol dual: `[INSTRUCTOR]` (*Notas del Formador / Catequista*) y `[NOTE]` (*Ficha del Alumno*).
- [x] **Generador del Esqueleto en Disco**:
  - Creación determinista del árbol completo de módulos, archivos `_index.adoc` y cada `sesion-XX.adoc` en disco.
  - Inicialización automática de repositorio Git con commit inicial descriptivo y configuración Hugo.


---

### 🧩 1.4. Gestión Progresiva de Grafos por Capítulo y Temas Flotantes (`Progressive Graph & Staging`)
*(Facilita escribir primero y organizar después, manteniendo la coherencia conceptual)*
- [x] **Activación de Contexto al Iniciar Capítulo/Tema**:
  - Al abrir un capítulo, el editor carga los conceptos previos ya existentes en el "Grafo del Año" como sugerencias de autocompletado y referencia rápida.
  - Extracción y actualización del **Grafo Local del Capítulo** mientras se escribe.
- [x] **Fusión Continua con el Grafo Global del Año/Curso**:
  - A medida que se añade un nuevo tema (ej. Tema 2), sus nodos y aristas se fusionan automáticamente con el grafo global acumulado, preservando IDs de conceptos compartidos.
- [x] **Bandeja de "Temas e Ideas Flotantes" (`Unassigned / Staging Buffer`)**:
  - Permitir al autor volcar temas, reflexiones o lecciones sueltas sin necesidad de colocarlos de inmediato en una clase/semana fija.
  - Los temas flotantes generan sus propios nodos y aristas en el grafo de trabajo.
- [x] **Asistente de Reubicación y Ordenación por Dependencias**:
  - El sistema analiza las conexiones del grafo de un tema flotante y sugiere su ubicación temporal ideal en el calendario (ej: *"Este tema 'La Confesión' requiere 'Pecado' (explicado en Clase 3) y es prerrequisito de 'Comunión' (Clase 8) $\rightarrow$ Sugerencia: ubicar en Clase 4 o 5"*).
- [x] **Suite de Tests de Catequesis en Cada Build (GLiNER2 Validation)**:
  - Pruebas reales de extracción de entidades y relaciones sobre textos doctrinales (Iniciación Cristiana, Sacramentos, Credo, Mandamientos) integradas en `make test` y GitHub Actions.
- [ ] **📖 Sistema de Documentación Global y Manual Interactivo**:
  - Documentación global escrita (`docs/MANUAL_DE_USUARIO.md`, `docs/ARQUITECTURA_GRAFOS.md`) y visor/modal interactivo de ayuda integrado en la UI con buscador y ejemplos pedagógicos.
- [ ] **✂️ Extraer Selección a Tema Flotante (`Selection-to-Floating-Idea`)**:
  - Acción en editor para convertir fragmentos seleccionados en notas flotantes automáticas en `content/unassigned/`, dejando un bloque de enlace en el texto origen.
- [ ] **🎙️ Captura Rápida por Dictado (`Quick Voice Braindump`)**:
  - Acceso directo y atajo de teclado para grabar y transcribir notas efímeras de voz instantáneas en la bandeja flotante con extracción semántica.
- [ ] **🏷️ Semáforo de Madurez en la Bandeja Flotante (`Readiness Badges`)**:
  - Indicadores visuales automáticos en las ideas flotantes: 🟢 Listo para ubicar, 🟡 Bloqueado por prerrequisito previo, 🟣 Concepto raíz.
- [ ] **🔀 Opción Doble en Asistente: "Nueva Sesión" vs "Incrustar en Sesión Existente"**:
  - Capacidad en el Asistente de Reubicación para fusionar una nota flotante directamente como subsección o nota dentro de una sesión ya planificada.
- [ ] **⚡ Extracción en Background No Invasiva (`Debounced Auto-Extraction`)**:
  - Extracción automática no bloqueante tras pausas en la redacción con notificación sutil de nuevos conceptos detectados.
- [ ] **📊 Matriz de Coherencia Curricular (`Curriculum Coherence Heatmap`)**:
  - Vista tabular que mapea la introducción (★), refuerzo (●) y alertas de uso prematuro (⚠️) de conceptos a lo largo de las sesiones del compendio.

---

### 🕸️ 1.5. Grafo de Dependencias y Validador Curricular (`IdeaGraph 2.0 & Linter`)
- [ ] **Evolución del Grafo Conceptual y Tipos de Relaciones**:
  - Modelar relaciones pedagógicas y técnicas:
    - `prerrequisito_de` (ej: *Sistema Eléctrico* $\rightarrow$ *Alternador*, o *Bautismo* $\rightarrow$ *Comunión*).
    - `profundiza_en` (ej: *Año 1* introduce $\rightarrow$ *Año 2* profundiza).
    - `relacionado_con` (asociaciones transversales).
- [ ] **Validador de Coherencia y Lagunas (Knowledge / Curriculum Linter)**:
  - Detección automática de inconsistencias: alertar si en una sesión avanzada se introduce un concepto cuyos prerrequisitos no han sido cubiertos en sesiones anteriores.
- [ ] **Navegación Bidireccional Grafo ↔ Editor**:
  - Clicar en un nodo del grafo abre o resalta la sesión/sección correspondiente.
- [ ] **Filtrado por Capas y Niveles**:
  - Visualización del grafo por año, nivel de dificultad, módulo temático o estado (asignado vs flotante).

---

### 👥 1.6. Redacción Dual y Multi-Audiencia (`Single-Source Authoring`)
- [ ] **Vista Dual / Sincronizada (Profesor/Experto ↔ Alumno/Aprendiz)**:
  - Panel dividido: redactar el material maestro y sincronizar la versión didáctica/simplificada.
- [ ] **Bloques Condicionales en el Editor**:
  - Etiquetas contextuales: `[Solo Instructor]`, `[Ficha Alumno]`, `[Notas de Taller]`.
- [ ] **Asistente de Derivación (IA Opcional)**:
  - Adaptación asistida de tono y formato según público (edad infantil, operario en prácticas, nivel avanzado).

---

### 🔍 1.7. Herramientas Avanzadas de Calidad de Contenido
- [ ] **Glosario de Términos y Verificador de Vocabulario por Nivel**:
  - Detección automática de términos nuevos y verificación de en qué sesión se definen por primera vez.
- [ ] **Calculadora de Ritmo de Sesión (`Session Pacing Calculator`)**:
  - Estimación de tiempos de clase (lectura + explicación + dinámicas + audio) para asegurar sesiones de 45-60 min equilibradas.
- [ ] **Matriz de Recursos y Materiales (Checklist Acumulado)**:
  - Extracción automática de la "lista de compras/herramientas" necesarias para todo el curso o taller.
- [ ] **Notas de Voz al Margen (Voice Memos por Sección)**:
  - Grabación de audios cortos de consejos prácticos para otros formadores adjuntos a párrafos concretos.

---

### 🎙️ 1.8. Captura de Voz a Estructura ("Vuelca tu Experiencia Hablando")
- [ ] **Dictado Libre de Sesión Completa**:
  - Grabación continua de la explicación verbal de un tema sin preocuparse del formato.
- [ ] **Estructurador Inteligente de Transcripción (IA Opcional)**:
  - El LLM clasifica el audio transcrito y rellena automáticamente los apartados de la plantilla.

---

### 📦 1.9. Producción Multimedia y Publicación Multiformato
- [ ] **Audio de la Lección / Cápsula**:
  - Grabación propia del autor o síntesis vocal de alta calidad (Kokoro TTS) para escucha autónoma.
- [ ] **Generador de Guiones para Vídeo / YouTube / Presentaciones**:
  - Escaletas automáticas con marcas de tiempo a partir del contenido de cada lección.
- [ ] **Integración con Canva / Diapositivas**:
  - Exportación de esquemas clave a presentaciones vía Canva API.
- [ ] **Exportación a Documentos Maquetados**:
  - Generación de PDF/DOCX con estilos diferenciados (Manual del Profesor vs Cuaderno del Alumno).

---

## ⚙️ 2. BLOQUE TÉCNICO: Infraestructura y Motores

### 🎙️ Audio, Transcripción (STT) y Síntesis (TTS)
- [ ] **Modo "Live" (Streaming STT)**: Segmentación de grabación nativa en fragmentos para transcripción casi en tiempo real.
- [ ] **Detección de Silencios (VAD)**: Lógica nativa en Go para procesar audio automáticamente al pausar el habla.
- [ ] **Integración Kokoro TTS (Puerto 8880)**: Generación local de voz con selector de voces e idiomas.
- [ ] **Visualización de Ondas (Waveform)**: Componente visual interactivo durante la grabación.
- [ ] **Conexión STT Cloud (Opcional)**: Soporte para Groq Whisper y Deepgram para entornos sin aceleración hardware.

### 🧠 Modelos de Lenguaje (LLM) y Extracción de Grafos
- [ ] **Inferencia LLM Local con Hugot / ONNX**: Integración de modelos compactos (ej. Qwen 0.5B/1.5B) para funcionamiento 100% offline.
- [ ] **Sistema RAG Inicial**: Búsqueda semántica en el compendio local para responder preguntas y relacionar conceptos.
- [ ] **Refinado y Extracción con GLiNER / LLM**:
  - Inclusión del grafo histórico en el prompt para mantener coherencia de entidades y relaciones.
  - Post-procesamiento: puntuación natural, corrección gramatical y eliminación de muletillas.
- [ ] **Conexión LLM Cloud**: Integración con Google Gemini API y Groq para procesamiento cloud de baja latencia.

### ✍️ Editor TipTap y Persistencia
- [ ] **Persistencia en Markdown/JSON**: Guardado estándar en el sistema de archivos sobre la estructura Git local.
- [ ] **Atajos de Teclado**: `Ctrl+D` (dictar), `Ctrl+S` (guardar), `Ctrl+G` (abrir grafo), `Ctrl+J` (abrir diario).
- [ ] **Gestión de Documentos UI**: Panel de navegación tipo árbol con drag & drop de capítulos y estados de sesión.

### 🔌 Conectividad Externa y Protocolos
- [ ] **Servidor MCP (Model Context Protocol)**: Ampliar herramientas expuestas (`get_outline`, `update_node`, `insert_chapter_section`, `get_journal`).
- [ ] **OAuth y Cliente Canva**: Flujo completo de autenticación y subida de esquemas visuales.

---

## 🛠️ 3. Historial de Hitos Completados ✅
- [x] **Arquitectura Multi-OS (Linux, Windows, macOS)**: Eliminación de dependencias externas en enlazado estático de audio (`malgo`) y tokenizadores.
- [x] **Captura de Audio Nativa en Go**: Soporte transparente para ALSA/PulseAudio/PipeWire y WASAPI/DirectSound.
- [x] **Whisper Local Integrado**: Inferencia local con GGML/whisper.cpp y descarga automática de modelos (`tiny`, `base`).
- [x] **Servidor MCP Básico**: Endpoint SSE en puerto 3000 con herramientas `insert_text` y `get_editor_content`.
- [x] **Extractor de Entidades y Relaciones**: Soporte para GLiNER local/ONNX y visualizador `ReactFlow` interactivo con persistencia de pasos.
- [x] **Motor Git Integrado y Estructura de Compendios (Punto 1.1)**: Motor `go-git` pure Go multiplataforma (0 CGO, one-download), auto-commits locales, árbol de carpetas normalizado (`.writer`, `content`, `journal`, `static`) y timeline de deshacer infinito en la UI.
- [x] **Gestión Progresiva de Grafos y Staging de Temas Flotantes (Punto 1.4)**: Activación de contexto conceptual previo al abrir sesiones, fusión idempotente con el Grafo Global del curso, bandeja de ideas flotantes (`content/unassigned/`), asistente de reubicación temporal inteligente basado en dependencias y suite completa de tests reales de catequesis ejecutados en cada build con GLiNER2.
