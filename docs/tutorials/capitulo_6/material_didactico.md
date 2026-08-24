# Material Didáctico y Guión Maestro — Capítulo 6
## Título: Asistente de Reubicación por Dependencias (Icono 🧭)
**Subtítulo:** El motor pedagógico de ordenación curricular y la decisión dual: Nueva Sesión vs Incrustar en Sesión Existente

---

## 1. Contexto Pedagógico y Filosofía de Diseño

### 1.1. El Problema de la Planificación del Calendario
Cuando tienes 15 o 20 ideas flotantes acumuladas en tu bandeja, integrarlas en el temario anual suele ser una tarea pesada y propensa a errores humanos:
- ¿Esta idea debe ir en la semana 4 o en la semana 12?
- Si la pongo en la semana 4, ¿habrán aprendido ya los conceptos de base que requiere?
- ¿Merece la pena crear una sesión entera para esta idea, o es mejor añadirla como un subtema al final de una clase existente?

### 1.2. La Solución de Antigravity Writer
El **Asistente de Reubicación por Dependencias (`PlacementAssistantModal`)**:
1. **Análisis Topológico del Grafo**: Evalúa todos los prerrequisitos de la idea y localiza la última sesión donde se introdujo el último concepto necesario ($S_{min}$).
2. **Cálculo de Confianza Pedagógica**: Sugiere el módulo y la semana óptima con un porcentaje de compatibilidad curricular.
3. **Acción Dual Determinista**:
   - **Promover como Nueva Sesión**: Mueve el archivo a `content/modulo-X/sesion-YY.adoc` y actualiza la numeración del compendio.
   - **Incrustar en Sesión Existente**: Fusiona el contenido dentro de la clase recomendada como una subsección (`=== Subtema`) o como bloque de nota (`[NOTE]`).

---

## 2. Escaleta Audiovisual y Locución (Paso a Paso)

### Bloque 1: Apertura — De la idea suelta al calendario perfecto (00:00 – 00:35)
- **Visual:** Vista de la bandeja flotante. El ratón pasa por encima del botón con icono de brújula 🧭 (*Asistente de Reubicación*).
- **Locución (Voz en off):**
  > "Has acumulado una docena de ideas en tu bandeja flotante. Ha llegado el momento de darles un hogar definitivo en el curso. ¿Cómo saber cuál es el lugar pedagógicamente perfecto para cada una? Antigravity Writer cuenta con una brújula inteligente: el Asistente de Reubicación por Dependencias."

### Bloque 2: Apertura del Asistente y Diagnóstico del Grafo (00:35 – 01:30)
- **Visual:** Clic en el icono de brújula 🧭 sobre una idea flotante: `content/unassigned/liturgia-eucaristica.adoc`. Se abre el modal `PlacementAssistantModal`. Se muestran los conceptos extraídos y la línea temporal del curso.
- **Locución (Voz en off):**
  > "Al abrir el asistente, el sistema analiza el grafo completo. Revisa cuándo se explicaron los conceptos de base —en este caso 'El Pan y el Vino' en la Sesión 4 y 'La Última Cena' en la Sesión 6— y nos indica con un 95% de confianza que la ubicación óptima es a partir de la Sesión 7."

### Bloque 3: Opción A — Promover como Nueva Sesión (01:30 – 02:25)
- **Visual:** En el asistente se selecciona la pestaña *"Promover como Nueva Sesión"*. Se elige el Módulo 2 y se pulsa *"Crear Sesión 07"*. La idea desaparece de la bandeja flotante y aparece en el árbol como `sesion-07.adoc`.
- **Locución (Voz en off):**
  > "Si la idea es suficientemente extensa e importante, elegimos 'Promover como Nueva Sesión'. El asistente mueve el archivo al módulo correspondiente, renombra la lección de forma correlativa y actualiza el repositorio Git automáticamente."

### Bloque 4: Opción B — Incrustar en Sesión Existente (02:25 – 03:20)
- **Visual:** Se selecciona otra idea más corta: `anecdota-san-pedro.adoc`. En el asistente se selecciona *"Incrustar en Sesión Existente"*. Se elige la Sesión 3 y la modalidad *"Añadir como Bloque de Nota [NOTE]"*. Se previsualiza la fusión y se confirma. Al abrir la Sesión 3, la nota aparece perfectamente maquetada al final del documento.
- **Locución (Voz en off):**
  > "Si la idea es una dinámica corta o una anécdota, no necesitamos crear una clase entera. Seleccionamos 'Incrustar en Sesión Existente'. La aplicación añade el texto al final de la sesión elegida como una subsección o un bloque destacado, manteniendo tu temario limpio y ordenado."

### Bloque 5: Cierre y Transición al Capítulo 7 (03:20 – 03:50)
- **Visual:** Vista de la barra superior. El cursor enfoca el icono de cuadrícula / matriz (*Matriz de Coherencia Curricular*).
- **Locución (Voz en off):**
  > "Ahora que nuestras lecciones e ideas están organizadas en el calendario, ¿cómo auditamos todo el curso de un vistazo para asegurar que no hay fugas ni conceptos usados antes de tiempo? En el Capítulo 7 veremos la **Matriz de Coherencia Curricular y su Mapa de Calor**. ¡Acompáñanos!"

---

## 3. Claves de Buenas Prácticas para el Autor
1. **Confía en la sugerencia mínima ($S_{min}$)**: El asistente nunca te recomendará una semana anterior a la introducción de los prerrequisitos.
2. **Usa la opción de incrustar para dinámicas pequeñas**: Evita crear sesiones de 10 minutos; enriquece las clases existentes con subsecciones.
3. **Comprueba el resumen del commit Git**: Cada reubicación genera un commit descriptivo que te permite revertir la operación si cambias de opinión.
