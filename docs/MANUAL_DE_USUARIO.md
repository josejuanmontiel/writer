# 📖 Manual de Usuario y Guía Pedagógica — Antigravity Writer

Antigravity Writer es un entorno de autoría estructurada e inteligencia semántica local diseñado para educadores, catequistas, profesores y autores técnicos. Su propósito fundamental es:

> **«Facilitar escribir primero y organizar después, manteniendo siempre la coherencia conceptual»**

---

## 🧭 1. Flujo de Trabajo y Filosofía de Uso

1. **Escritura Libre y Fluida**: Redacta tus sesiones o ideas sin preocuparte en un primer momento por la semana o el orden exacto del temario.
2. **Extracción Semántica Automática**: El motor local **GLiNER2** detecta de manera instantánea entidades ontológicas (conceptos teológicos, técnicos o pedagógicos) y sus relaciones.
3. **Fusión Progresiva de Grafos**: Cada sesión genera su propio subgrafo, que se fusiona automáticamente en un **Grafo Global del Curso**.
4. **Bandeja de Ideas Flotantes (`content/unassigned/`)**: Guarda pensamientos, actividades y lecciones independientes hasta que estén maduras.
5. **Asistente de Reubicación por Dependencias**: Analiza los prerrequisitos de tus notas flotantes y te sugiere en qué semana o módulo encajan mejor.
6. **Matriz de Coherencia Curricular**: Un mapa de calor que verifica que ningún concepto avanzado se enseñe antes de sus fundamentos.

---

## 🎙️ 2. Motor de Audio y Dictado por Voz (Whisper Local)

Antigravity Writer incluye transcripción de audio completamente local mediante modelos GGML/Whisper.cpp (sin enviar audio a la nube).

- **Activar Dictado**: Haz clic en el botón circular del micrófono en la barra superior o pulsa `Espacio` con el atajo configurado.
- **Medidor de Volumen en Tiempo Real (VU Meter)**: Un indicador visual de barras te muestra si el micrófono está recibiendo señal adecuada antes y durante la grabación.
- **Selector de Dispositivos y Modelos**: Desde el panel de *Configuración*, puedes alternar entre modelos (`tiny`, `base`, `small`) y probar tu micrófono con el test interactivo.
- **Modo Solo Texto (TTT - Text-to-Text)**: Si prefieres escribir en lugar de hablar, pulsa el botón `TTT` para enviar instrucciones directas al editor o al analizador.

---

## 🧠 3. Extracción de Grafos e Inteligencia Semántica (GLiNER2)

El extractor **GLiNER2** opera localmente mediante **ONNX Runtime**, analizando el texto en español para identificar:
- **Conceptos Teológicos / Pedagógicos**: ej. *El Bautismo*, *Gracia Santificante*, *Pecado Original*, *La Eucaristía*.
- **Relaciones Estructurales y de Dependencia**:
  - `prerrequisito_de` (ej. *El Bautismo* es requisito de *La Primera Comunión*).
  - `profundiza_en` (ej. *Módulo 2* amplía conceptos del *Módulo 1*).
  - `asociado_con` (asociaciones doctrinales o prácticas).

### Sincronización Local vs Global
- Al redactar, el editor ofrece el botón **"Sincronizar Grafo Local"**.
- El subgrafo se guarda en `.writer/graphs/<archivo>.json` y se consolida de forma idempotente en `.writer/graph-global.json`.

---

## 🧩 4. Gestión de Ideas Flotantes y Asistente de Reubicación

### Bandeja Flotante (`content/unassigned/`)
En la barra lateral izquierda, bajo la categoría **"Bandeja de Ideas Flotantes"**:
- **Crear Idea**: Pulsa el botón `+` para añadir una reflexión sin fecha asignada.
- **Captura Rápida por Dictado**: Pulsa el botón de micrófono en la cabecera para grabar un borrador de voz instantáneo.
- **Semáforo de Madurez (`Readiness Badges`)**:
  - 🟢 **Listo**: Todos los conceptos previos que requiere esta idea ya han sido enseñados en sesiones anteriores.
  - 🟡 **Bloqueado**: La idea menciona conceptos que aún no tienen una clase previa de fundamentación.
  - 🟣 **Raíz / Introductorio**: La idea es un punto de partida autónomo.

### Asistente de Reubicación por Dependencias (Icono Brújula 🧭)
Al pulsar sobre una idea flotante:
1. El sistema evalúa el grafo completo del curso.
2. Identifica sesiones previas que aportan prerrequisitos y sesiones futuras que se beneficiarán de esta idea.
3. Sugiere la semana o módulo óptimo con un porcentaje de confianza pedagógica.
4. **Acción Dual**:
   - **Promover como Nueva Sesión**: Convierte la idea en un archivo `sesion-XX.adoc` en el módulo elegido.
   - **Incrustar en Sesión Existente**: Añade el contenido como subsección (`=== Subtema`) o como bloque de nota (`[NOTE]`) al final de la sesión recomendada.

---

## ✂️ 5. Extracción de Selección en el Editor (*Selection-to-Floating-Idea*)

Si mientras redactas una sesión descubres que un párrafo se desvía del tema central:
1. Selecciona el texto con el ratón.
2. Pulsa el botón **"Convertir en Idea Flotante"** (icono tijeras / chispa) en la barra del editor.
3. El texto se moverá a un nuevo archivo en `content/unassigned/` y en su lugar quedará un enlace de referencia:
   ```asciidoc
   [NOTE]
   ====
   📌 Idea complementaria: xref:../unassigned/pecado-original.adoc[Pecado Original]
   ====
   ```

---

## 📊 6. Matriz de Coherencia Curricular (Mapa de Calor)

Accesible desde la barra superior (icono de rejilla / matriz):
- **Eje Horizontal (Columnas)**: Todas las sesiones del curso en orden cronológico.
- **Eje Vertical (Filas)**: Todos los conceptos y doctrinas extraídos en el compendio.
- **Simbología**:
  - ★ **Introducción**: Primera vez que se explica formalmente el concepto.
  - ● **Refuerzo / Mención**: Sesiones posteriores que consolidan el concepto.
  - ⚠️ **Uso Prematuro**: Alerta pedagógica: la sesión utiliza un concepto sin que haya sido introducido previamente.

---

## 🕸️ 7. IdeaGraph 2.0 y Validador Curricular (Knowledge Linter)

El visor **IdeaGraph 2.0** te permite explorar, editar e inspeccionar de forma visual todo el mapa conceptual y las dependencias de tu curso.

### Tipos de Nodos y Relaciones
- **Nodos Semánticos**: Cada concepto aparece clasificado por tipo (ej. *Sacramento*, *Doctrina*, *Moral*, *Biblia*, *Liturgia*) con su contador de menciones en el compendio.
- **Relaciones Tipadas**:
  - `prerrequisito_de` (flecha ámbar sólida): Requisito previo indispensable.
  - `profundiza_en` (flecha púrpura discontinua): Ampliación pedagógica de un concepto introducido antes.
  - `asociado_con` (flecha cian tenue): Conexión doctrinal transversal.

### Inspector de Nodos y Navegación Bidireccional
- Al hacer clic sobre cualquier nodo del grafo, se abre un **Panel Inspector** lateral con:
  - Definición y metadatos del concepto.
  - Lista de todas las sesiones donde se menciona, con botón directo para **abrir el archivo en el editor**.
  - Observaciones y advertencias específicas del Linter.

### Auditoría Automática del Curriculum Linter
Pulsando sobre la cápsula de **Salud Curricular** en la barra superior del grafo:
- Se despliega el panel de auditoría automática que detecta:
  - 🔴 **Dependencias Circulares**: Bucles cerrados de requisitos (A $\rightarrow$ B $\rightarrow$ A).
  - 🔴 **Prerrequisitos Ausentes**: Conceptos necesarios que no se explican en ninguna clase planificada.
  - 🟡 **Uso Prematuro**: Conceptos avanzados introducidos antes de que se impartan sus fundamentos.
  - ℹ️ **Conceptos Aislados / Huérfanos**: Entidades sin conexiones explícitas.
- Cada aviso incluye una **Sugerencia de Solución** y un enlace para saltar a la sesión afectada.

---

---

## 👥 8. Redacción Dual y Multi-Audiencia (`Single-Source Authoring`)

Antigravity Writer permite escribir **una única lección maestra** y generar automáticamente múltiples versiones según quién la vaya a leer:

### Bloques Condicionales Semánticos
En la barra de herramientas del editor puedes insertar bloques específicos por rol:
- `[INSTRUCTOR]` (👨‍🏫 **Solo Formador / Catequista**): Pautas metodológicas, soluciones de preguntas y tiempos estimados.
- `[STUDENT]` (🧑‍🎓 **Ficha Alumno**): Preguntas de reflexión, ejercicios y compromisos semanales.
- `[WORKSHOP]` (🛠️ **Taller Práctico**): Experimentos y dinámicas grupales activas.
- `[SIMPLIFIED]` (🧒 **Infantil / Fácil Lectura**): Lenguaje adaptado y actividades de dibujo.

### Vista Dual Sincronizada (Split Screen)
El modo **Vista Dual** divide la pantalla en dos paneles:
- **Panel Izquierdo**: Editor maestro con todos los bloques y notas.
- **Panel Derecho**: Previsualizador en tiempo real filtrado para la audiencia elegida (*Ficha Alumno*, *Guía Profesor*, *Infantil*, *Taller*), ocultando automáticamente el contenido privado de los profesores.

### Asistente de Derivación Multi-Audiencia
Pulsando el botón **Asistente de Derivación**:
- Puedes generar un nuevo archivo derivado (ej. `sesion-01-ficha-alumno.adoc` o `sesion-01-infantil.adoc`) listo para imprimir o compartir con los alumnos sin revelar las soluciones del catequista.

---

## 🔍 9. Herramientas Avanzadas de Calidad de Contenido

Accesible desde el icono de reloj `⏱️` en la barra superior o en el editor:

### ⏱️ Calculadora de Ritmo de Sesión (`Session Pacing Calculator`)
- Estima la duración real de clase desglosada por:
  - **Lectura / Exposición verbal**: Basada en ~130 palabras por minuto.
  - **Explicación Doctrinal**: ~2.5 minutos adicionales por cada concepto clave extraído.
  - **Actividades del Alumno**: ~8-10 minutos por bloque `[STUDENT]`.
  - **Talleres y Dinámicas**: ~15 minutos por bloque `[WORKSHOP]`.
- Muestra el balance respecto al objetivo fijado (ej. 45 min, 50 min, 60 min) y emite recomendaciones pedagógicas si la clase es muy corta o sobrecargada.

### 📖 Glosario Automático de Términos
- Escanea todo el curso y compila las definiciones teológicas y técnicas (`Término:: Definición` o en negrita), indicando la sesión donde se define por primera vez.
- Permite generar el archivo `content/glosario.adoc` con un solo clic.

### 🛒 Matriz de Recursos y Materiales (Shopping List)
- Agrupa todas las listas de materiales (`[ ] 1 vela`, `[ ] Cartulinas`, `[ ] Proyector`) de todas las sesiones en un checklist centralizado con barra de progreso y botón de copiado.

### 🎙️ Notas de Voz al Margen (`Voice Memos`)
- Permite a los formadores grabar audios cortos de consejos prácticos para otros catequistas adjuntos a sesiones específicas.

---

## 🛠️ 10. Control de Versiones Git y Línea Temporal

- Cada compendio es un repositorio Git local (`pure Go` con `go-git`, sin necesidad de instalar Git externamente).
- Cada autoguardado genera un commit silencioso con autor y fecha.
- El botón **Línea Temporal (Timeline)** permite inspeccionar versiones anteriores y restaurar cualquier estado pasado sin perder datos.



