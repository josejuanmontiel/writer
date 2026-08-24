# Material Didáctico y Guión Maestro — Capítulo 8
## Título: IdeaGraph 2.0 & Validador Curricular (`Knowledge Linter`)
**Subtítulo:** Visualización interactiva 2D con ReactFlow, detección de ciclos conceptuales, nodos huérfanos y navegación bidireccional Grafo ↔ Editor

---

## 1. Contexto Pedagógico y Filosofía de Diseño

### 1.1. Ver la Red Neuronal de tu Conocimiento
Cuando un temario alcanza 50 o 100 conceptos interconectados, la representación lineal en tablas o listas de carpetas ya no basta para entender la estructura profunda de la materia.
- ¿Hay conceptos aislados que nadie conecta con el resto del temario (*nodos huérfanos*)?
- ¿Existen dependencias circulares donde el concepto A requiere a B y B requiere a A (*ciclos imposibles*)?

### 1.2. La Solución de Antigravity Writer
**IdeaGraph 2.0 (`IdeaGraph.jsx`)**:
1. **Lienzo Interactivo de Fuerza Dirigida**: Visualización basada en `ReactFlow` y algoritmos de física `d3-force` que agrupa nodos por afinidad temática.
2. **Nodos Semánticos Enriquecidos**: Cada concepto muestra su tipo ontológico (Sacramento, Doctrina, Mecánica, Matemáticas) y un contador de menciones en el compendio.
3. **Validador Curricular Integrado (*Knowledge Linter*)**:
   - Panel de diagnóstico que detecta:
     - 🔴 **Ciclos Conceptuales**: Dependencias circulares que impiden aprender.
     - 🟠 **Nodos Huérfanos**: Conceptos mencionados una sola vez sin conexión con el tronco del curso.
     - 🟡 **Caminos Críticos**: La columna vertebral de conceptos indispensables para aprobar el curso.
4. **Navegación Bidireccional Grafo ↔ Editor**: Al hacer doble clic en cualquier nodo o arista, el editor abre directamente la sesión exacta donde se define.

---

## 2. Escaleta Audiovisual y Locución (Paso a Paso)

### Bloque 1: Apertura — El mapa visual de tu mente (00:00 – 00:35)
- **Visual:** Clic en el botón con icono de red en la cabecera. La pantalla se transforma en un lienzo oscuro interactivo con nodos luminosos y flechas conectadas que flotan suavemente: `IdeaGraph 2.0`.
- **Locución (Voz en off):**
  > "¿Cómo se ve el conocimiento cuando lo miras desde arriba? En Antigravity Writer, tu compendio no es solo un montón de texto: es un grafo vivo de ideas. Bienvenido a IdeaGraph 2.0, el visor conceptual donde puedes explorar, conectar y auditar toda la red de tu curso de forma interactiva."

### Bloque 2: Navegación por el Grafo y Tipos de Nodos (00:35 – 01:25)
- **Visual:** El usuario hace zoom y pan con el ratón. Los nodos tienen códigos de color temáticos: azul para *Fundamentos*, esmeralda para *Sacramentos / Aplicaciones*, ámbar para *Dinámicas*. Al pasar el ratón por un nodo, se iluminan sus aristas de entrada (prerrequisitos) y de salida (temas que dependen de él).
- **Locución (Voz en off):**
  > "Podemos movernos por el lienzo con total libertad. Cada nodo representa un concepto y muestra el número de veces que ha sido citado. Al situarnos sobre un concepto central, como 'El Bautismo', el grafo ilumina de inmediato sus fundamentos previos y las lecciones futuras que se construyen sobre él."

### Bloque 3: El Knowledge Linter — Detectando Anomalías (01:25 – 02:25)
- **Visual:** Clic en la pestaña lateral *"Auditoría / Linter"*. El sistema lista 2 advertencias:
  1. *Nodo Huérfano: 'Historia de las Catacumbas' (sin conexiones salientes).*
  2. *Advertencia de Ciclo: 'Fe' $\leftrightarrow$ 'Gracia'.*
  Al pulsar sobre el aviso de ciclo, el grafo hace zoom automático y resalta las dos flechas en rojo pulsante.
- **Locución (Voz en off):**
  > "El Validador Curricular actúa como un corrector ortográfico, pero para el sentido pedagógico de tu curso. Detecta dependencias circulares —donde dos conceptos se exigen mutuamente sin un punto de entrada claro— y nodos huérfanos que han quedado aislados, ayudándote a pulir la coherencia del temario."

### Bloque 4: Navegación Bidireccional Grafo ↔ Editor (02:25 – 03:15)
- **Visual:** Doble clic en el nodo *'Pecado Original'*. La vista vuelve al editor abriendo instantáneamente el archivo `content/modulo-1/sesion-02.adoc` con la palabra resaltada en el texto.
- **Locución (Voz en off):**
  > "La conexión es total en ambos sentidos. Doble clic sobre cualquier nodo y el editor te llevará directamente a la sesión y párrafo exacto donde se definió. Modificas el texto, guardas, y el grafo refleja los cambios de inmediato."

### Bloque 5: Cierre y Transición al Capítulo 9 (03:15 – 03:45)
- **Visual:** Vista dividida del editor (*Dual Pane View*) con dos columnas: una versión para adultos y una versión simplificada para niños.
- **Locución (Voz en off):**
  > "Ya tenemos un curso sólido y bien conectado. Pero, ¿cómo adaptamos una misma lección maestra para impartirla a niños de 8 años, jóvenes o catecúmenos adultos? En el Capítulo 9 descubriremos la **Derivación de Audiencias y Calidad de Contenido**. ¡Vamos a verlo!"

---

## 3. Claves de Buenas Prácticas para el Autor
1. **Identifica tu Camino Crítico**: Los nodos más grandes con más flechas salientes son los temas donde tus alumnos no pueden faltar a clase.
2. **Conecta los nodos huérfanos**: Si una anécdota o concepto está aislado en el grafo, enlázalo con un concepto central o evalúa si realmente aporta valor al curso.
3. **Usa el Linter antes de imprimir el temario**: Asegúrate de tener 0 ciclos conceptuales antes de comenzar las clases.
