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

## 🛠️ 7. Control de Versiones Git y Línea Temporal

- Cada compendio es un repositorio Git local (`pure Go` con `go-git`, sin necesidad de instalar Git externamente).
- Cada autoguardado genera un commit silencioso con autor y fecha.
- El botón **Línea Temporal (Timeline)** permite inspeccionar versiones anteriores y restaurar cualquier estado pasado sin perder datos.
