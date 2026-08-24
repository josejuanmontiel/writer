# Material Didáctico y Guión Maestro — Capítulo 3
## Título: Extracción Semántica & Grafos con GLiNER2
**Subtítulo:** Detección local de entidades ontológicas, relaciones de prerrequisito y sincronización idempotente Local vs Global

---

## 1. Contexto Pedagógico y Filosofía de Diseño

### 1.1. El Reto de la Coherencia Conceptual
Cuando un autor escribe un temario extenso (20 a 60 lecciones), es casi imposible recordar con exactitud en qué clase se explicó por primera vez un concepto complejo o qué prerrequisitos necesita el alumno para comprenderlo.
- Los editores habituales tratan el texto como una secuencia plana de caracteres ciegos.
- No existe noción de ontología, dependencia ni jerarquía de conocimiento.

### 1.2. La Solución de Antigravity Writer
Antigravity Writer integra **GLiNER2** corriendo localmente sobre **ONNX Runtime**:
1. **Extracción Cero-Latencia y No Invasiva**: El motor analiza el texto en español en segundo plano sin interrumpir el tecleo del autor.
2. **Identificación de Relaciones Pedagógicas**:
   - `prerrequisito_de` (ej. *El Bautismo* es requisito de *La Confirmación* o *Ley de Ohm* es requisito de *Circuitos RLC*).
   - `profundiza_en` (ampliación de materias previas).
   - `asociado_con` (vínculos contextuales).
3. **Sincronización Dual (Local vs Global)**:
   - Cada lección guarda su propio subgrafo `.writer/graphs/<archivo>.json`.
   - Se consolida de forma idempotente en el Grafo Global del Curso (`.writer/graph-global.json`).

---

## 2. Escaleta Audiovisual y Locución (Paso a Paso)

### Bloque 1: Apertura — Texto con Significado (00:00 – 00:35)
- **Visual:** Vista del editor con un párrafo de lección técnica o pedagógica. Clic en el botón "Sincronizar Grafo Local" con icono de red neuronal.
- **Locución (Voz en off):**
  > "¿Cómo sabe un buen profesor si sus lecciones están bien conectadas entre sí? En la mayoría de procesadores de texto, las palabras son solo letras mudas. En Antigravity Writer, cada párrafo que escribes cobra vida gracias a nuestro motor semántico local GLiNER2, capaz de extraer conceptos y dependencias en tiempo real."

### Bloque 2: Cómo GLiNER2 analiza el texto (00:35 – 01:25)
- **Visual:** Se resalta el texto escrito. Se abre el visor lateral de conceptos detectados. Aparecen etiquetas ontológicas como: `[Concepto: Gracia Santificante]`, `[Prerrequisito: Bautismo]`, `[Relación: profundiza_en]`.
- **Locución (Voz en off):**
  > "A través de modelos optimizados en ONNX Runtime, GLiNER2 escanea el lenguaje natural y reconoce entidades clave y sus relaciones lógicas. Detecta si estás introduciendo un concepto nuevo o profundizando en uno anterior, clasificando las relaciones con precisión pedagógica."

### Bloque 3: Sincronización Local vs Grafo Global del Compendio (01:25 – 02:20)
- **Visual:** Animación esquemática mostrando cómo el archivo `sesion-01.adoc` genera su subgrafo individual y se fusiona automáticamente con el archivo central `graph-global.json`.
- **Locución (Voz en off):**
  > "Cada sesión mantiene su propio subgrafo local. Al guardar o pulsar sincronizar, estos nodos se fusionan de forma limpia e idempotente con el Grafo Global de todo el curso. Si modificas una definición en una sesión, el mapa global se actualiza sin duplicar información."

### Bloque 4: Autocompletado Semántico y Contexto Activo (02:20 – 03:15)
- **Visual:** Al redactar en una nueva sesión y empezar a teclear las primeras letras de un concepto previo, el editor sugiere el concepto existente en el grafo global con su insignia de definición previa.
- **Locución (Voz en off):**
  > "Al abrir cualquier sesión posterior, el editor ya conoce los conceptos que enseñaste semanas atrás. Te ofrece autocompletado conceptual y te avisa si estás reutilizando términos fundamentales, manteniendo un hilo conductor perfecto a lo largo de los meses."

### Bloque 5: Cierre y Transición al Capítulo 4 (03:15 – 03:45)
- **Visual:** El cursor se desplaza hacia la barra lateral izquierda, enfocando la sección *"Bandeja de Ideas Flotantes"*.
- **Locución (Voz en off):**
  > "Ahora que nuestro compendio entiende el significado de lo que escribimos, ¿qué hacemos con esas ideas sueltas que aún no sabemos en qué clase encajan? En el Capítulo 4 descubriremos la **Bandeja de Ideas Flotantes y los Semáforos de Madurez**. ¡Vamos a verlo!"

---

## 3. Claves de Buenas Prácticas para el Autor
1. **Deja que el motor trabaje en segundo plano**: La extracción automática tras pausas de redacción (*debounced extraction*) te ahorra pulsar botones constantemente.
2. **Revisa las relaciones sugeridas**: Puedes confirmar o matizar si una relación es un prerrequisito estricto o solo una asociación temática.
3. **Aprovecha el grafo acumulativo**: Cuanto más escribas en el compendio, más inteligente y rico será el contexto de sugerencias que la app te ofrece.
