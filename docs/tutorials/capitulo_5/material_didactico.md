# Material Didáctico y Guión Maestro — Capítulo 5
## Título: Extracción de Selección a Idea Flotante (`Selection-to-Floating-Idea`)
**Subtítulo:** Cómo podar lecciones sobrecargadas, modularizar contenido y mantener referencias cruzadas limpias en AsciiDoc

---

## 1. Contexto Pedagógico y Filosofía de Diseño

### 1.1. El Síndrome de la Lección "Monolítica"
Es muy común que al redactar la sesión de una clase el autor se emocione profundizando en un subtema lateral fascinante. El resultado:
- Una sesión de 45 minutos que acaba durando 2 horas en el papel.
- Pérdida del foco didáctico principal y saturación cognitiva para el alumno.
- Miedo del autor a borrar el texto porque *"es contenido valioso que no quiere perder"*.

### 1.2. La Solución de Antigravity Writer
Antigravity Writer implementa la función **Selection-to-Floating-Idea** (Extracción Quirúrgica):
1. **Poda Atómica en 1 Clic**: Selecciona cualquier bloque de texto dentro del editor y pulsa el botón de extraer.
2. **Creación Automática de Archivo**: El texto seleccionado se traslada intacto a un nuevo archivo en `content/unassigned/<nombre-sugerido>.adoc`.
3. **Incrustación de Referencia Cruzada (`xref`)**: En el documento original se inserta un bloque de nota limpio enlazando a la idea extraída:
   ```asciidoc
   [NOTE]
   ====
   📌 Idea complementaria: xref:../unassigned/detalle-tecnico.adoc[Detalle Técnico]
   ====
   ```
4. **Cero Pérdida de Información**: El temario principal recupera su ritmo ágil y el conocimiento lateral queda guardado en la bandeja de ideas esperando su momento.

---

## 2. Escaleta Audiovisual y Locución (Paso a Paso)

### Bloque 1: Apertura — El dilema de podar sin perder valor (00:00 – 00:35)
- **Visual:** Vista de una sesión con mucho texto. Se resalta un párrafo intermedio que trata sobre una digresión doctrinal o técnica avanzada.
- **Locución (Voz en off):**
  > "¿Alguna vez has escrito una explicación brillante pero te has dado cuenta de que se desvía del objetivo central de la clase de hoy? En un procesador convencional, o la borras con dolor o sobrecargas a tus alumnos. En Antigravity Writer puedes 'podar' esa sección en un segundo y convertirla en una idea flotante independiente."

### Bloque 2: Selección y Activación de la Herramienta (00:35 – 01:20)
- **Visual:** El ratón selecciona los 3 párrafos de la digresión. Aparece en la barra flotante del editor el botón de tijeras / chispa: *"Convertir en Idea Flotante"*. Clic en el botón.
- **Locución (Voz en off):**
  > "Basta con seleccionar el texto que queremos modularizar. En la barra de herramientas del editor pulsamos el botón 'Convertir en Idea Flotante'. La aplicación nos solicita un título breve para la nueva nota o nos sugiere uno automáticamente a partir de los conceptos detectados."

### Bloque 3: El Resultado en el Editor y en el Árbol (01:20 – 02:15)
- **Visual:** En el editor principal, el texto seleccionado es sustituido por una caja de nota formal de AsciiDoc (`[NOTE] 📌 Idea complementaria: xref:...`). En la barra lateral izquierda, aparece la nueva idea en la sección `content/unassigned/`.
- **Locución (Voz en off):**
  > "Observa lo que acaba de ocurrir: en el lugar del texto extraído, el editor ha insertado una referencia cruzada elegante. Tu sesión recupera su duración perfecta de 45 minutos, y en la barra lateral dispones de tu nueva idea flotante con su propio semáforo de madurez listo para ser analizado."

### Bloque 4: Trazabilidad y Sincronización del Grafo (02:15 – 03:00)
- **Visual:** Clic sobre el enlace `xref`. Se abre la nueva idea flotante en una pestaña secundaria o vista dividida. El grafo se actualiza mostrando la relación entre ambos documentos.
- **Locución (Voz en off):**
  > "Al hacer clic sobre la referencia, podemos abrir la idea en cualquier momento. El motor de grafos entiende que ambos documentos están conectados, manteniendo la trazabilidad pedagógica completa sin sobrecargar la sesión principal."

### Bloque 5: Cierre y Transición al Capítulo 6 (03:00 – 03:30)
- **Visual:** Plano de la bandeja flotante con varias ideas acumuladas. El cursor apunta al icono de brújula 🧭 (*Asistente de Reubicación*).
- **Locución (Voz en off):**
  > "Ya sabemos cómo capturar ideas libres y cómo podar nuestras clases. Pero, ¿cómo decidimos cuál es la semana exacta del calendario en la que debemos enseñar cada idea? En el Capítulo 6 descubriremos el **Asistente de Reubicación por Dependencias**. ¡Nos vemos allí!"

---

## 3. Claves de Buenas Prácticas para el Autor
1. **Mantén el foco de cada sesión en 1-2 objetivos**: Si un párrafo no contribuye directamente al objetivo de la clase, extráelo a la bandeja flotante.
2. **Confía en las referencias `xref`**: Te permiten tener lecturas opcionales o material para alumnos avanzados sin complicar la clase estándar.
3. **Revisa las ideas extraídas con el asistente**: En los próximos capítulos verás cómo el asistente te ayuda a convertirlas en sesiones completas o subtemas.
