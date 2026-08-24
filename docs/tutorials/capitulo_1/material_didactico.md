# Material Didáctico y Guión Maestro — Capítulo 1
## Título: Introducción y Paradigma: «Escribir sin miedo al orden»
**Subtítulo:** Presentación de la Interfaz Dual (Lienzo de Redacción AsciiDoc + Árbol del Compendio y Git)

---

## 1. Contexto Pedagógico y Filosofía de Diseño

### 1.1. El Problema del Autor / Educador Tradicional
En los editores y herramientas convencionales (Word, Notion, carpetas de archivos sueltas), el autor se enfrenta a una fricción cognitiva temprana:
- Debe decidir el número de sesión, la semana lectiva y la carpeta de destino **antes** de haber escrito una sola línea.
- Esta parálisis por organización previa frena la creatividad y desmotiva el volcado de ideas espontáneas.

### 1.2. La Solución de Antigravity Writer
Antigravity Writer implementa una **arquitectura desacoplada**:
1. **Lienzo Central de Escritura Fluida**: Un editor enriquecido basado en AsciiDoc/Tiptap donde redactar sin distracciones.
2. **Árbol del Compendio (Sidebar)**: Módulos y sesiones estructurados jerárquicamente, listos para ser reorganizados en cualquier momento.
3. **Bandeja de Ideas Flotantes (`unassigned/`)**: Espacio de *staging* para pensamientos huérfanos que aún no tienen semana fija.
4. **Control de Versiones Atómico (Git)**: Cada guardado genera un commit seguro e invisible, garantizando que nunca se pierda un cambio y permitiendo viajar en el tiempo.

---

## 2. Escaleta Audiovisual y Locución (Paso a Paso)

### Bloque 1: Apertura & El dilema del autor (00:00 – 00:30)
- **Visual:** Pantalla de bienvenida con el logotipo de Antigravity Writer sobre fondo oscuro. Transición a la interfaz.
- **Locución (Voz en off):**
  > "¿Alguna vez te has sentado a preparar un curso o una serie de lecciones y te has quedado bloqueado decidiendo en qué carpeta guardarlo o en qué semana encajará mejor? Los educadores y autores solemos pensar de forma orgánica, no lineal. Antigravity Writer nació con una premisa revolucionaria: permitirte escribir primero y organizar después, sin perder jamás la coherencia conceptual de tu temario."

### Bloque 2: Selección del Espacio de Trabajo (00:30 – 01:15)
- **Visual:** Interfaz de bienvenida (`WorkspaceSelector`). Muestra de compendios recientes, rutas locales y botones de acción.
- **Locución (Voz en off):**
  > "Al abrir la aplicación, nos recibe el Gestor de Espacios de Trabajo. Aquí puedes saltar instantáneamente entre diferentes cursos, compendios de catequesis o manuales técnicos. Todos tus proyectos son carpetas estándar en tu disco duro con archivos de texto plano legibles y universales. Tu conocimiento te pertenece al 100%."

### Bloque 3: Creación Rápida de un Compendio (01:15 – 02:00)
- **Visual:** Clic en «Nuevo Rápido». Formulario de metadatos (Título, Autor, Descripción). Clic en «Crear e Inicializar Git».
- **Locución (Voz en off):**
  > "Vamos a crear un nuevo compendio. Pulsamos en 'Nuevo Rápido', introducimos el título del curso, autor y descripción. Al pulsar 'Crear', la aplicación no solo genera la estructura de carpetas, sino que inicializa automáticamente un repositorio Git interno. A partir de este segundo, cada párrafo que escribas tendrá control de versiones automático e invisible."

### Bloque 4: Anatomía de la Interfaz Dual (02:00 – 03:00)
- **Visual:** Resaltado de la barra lateral izquierda (Árbol y Bandeja Flotante) y del lienzo central de redacción. Pistas hacia la barra superior de herramientas.
- **Locución (Voz en off):**
  > "Esta es la cabina de mandos. A la izquierda tenemos el Árbol del Compendio, con sus módulos, sesiones ordenadas y la Bandeja de Ideas Flotantes. En el centro, el Lienzo de Escritura Fluida, compatible con AsciiDoc. En la barra superior disponemos de herramientas de dictado por voz local con Whisper, grafos en tiempo real y matriz curricular."

### Bloque 5: Creación de Módulos y Sesiones (03:00 – 04:00)
- **Visual:** Clic en `+ Nuevo Módulo` (Módulo 2: Reactores de Fusión). Clic en `+ Añadir Sesión` (Sesión 2: Protocolos de Seguridad). El editor se abre al instante.
- **Locución (Voz en off):**
  > "Crear y reestructurar es inmediato. Añadimos un segundo módulo temático para profundizar en la materia y creamos una nueva sesión dentro de él. El árbol se actualiza en tiempo real reflejando la jerarquía pedagógica sin esperas."

### Bloque 6: Bloques Pedagógicos Estructurados (04:00 – 05:00)
- **Visual:** Inserción de una caja de «Consejo Pedagógico» (`[TIP]` / `[NOTE]`) con formato visual esmeralda y redacción de advertencias. Guardado con `Ctrl+S`.
- **Locución (Voz en off):**
  > "Al redactar material didáctico, la claridad visual es clave. Antigravity Writer incorpora bloques semánticos nativos de AsciiDoc. Con un solo clic podemos insertar una caja de Consejo Pedagógico, escribir la recomendación y guardar. El documento se sincroniza inmediatamente con el disco local generando un commit atómico."

### Bloque 7: Persistencia Atómica y Control de Versiones (05:00 – 05:45)
- **Visual:** Apertura del historial de versiones y visor de diferencias Git.
- **Locución (Voz en off):**
  > "Detrás de escena, nunca perderás un cambio. La aplicación rastrea cada guardado con un mensaje descriptivo automático. Si cometes un error o quieres recuperar una versión anterior de una sesión, puedes viajar en el tiempo con total tranquilidad."

### Bloque 8: Cierre y Transición al Capítulo 2 (05:45 – 06:15)
- **Visual:** Plano general de la interfaz con enfoque en el botón del micrófono en la barra superior.
- **Locución (Voz en off):**
  > "Ahora que conocemos el lienzo dual de trabajo, ¿qué pasa cuando la inspiración llega más rápido de lo que podemos teclear? En el próximo capítulo veremos el Motor de Voz Local con Whisper: dictado continuo, medidor de señal en tiempo real y captura rápida de pensamientos sin tocar el teclado. ¡Nos vemos en el Capítulo 2!"

---

## 3. Claves de Buenas Prácticas para el Autor
1. **Nombres descriptivos sin miedo a la posición final**: No te preocupes por si una sesión será la 2 o la 5; la herramienta permite reordenar con un clic.
2. **Uso de bloques didácticos desde el borrador**: Clasificar consejos, advertencias y objetivos ayuda tanto al estudiante como al extractor semántico.
3. **Guardado frecuente**: `Ctrl+S` / `Cmd+S` crea puntos de restauración limpios sin ensuciar tu flujo de trabajo.
