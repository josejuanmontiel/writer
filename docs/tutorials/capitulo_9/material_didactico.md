# Material Didáctico y Guión Maestro — Capítulo 9
## Título: Derivación de Audiencias & Calidad de Contenido
**Subtítulo:** Single-Source Authoring, adaptación por edades (niños, jóvenes, adultos), calculadora de ritmo de clase y métricas de legibilidad

---

## 1. Contexto Pedagógico y Filosofía de Diseño

### 1.1. El Reto de las Múltiples Audiencias (Multi-Audience)
Un catequista, profesor o formador técnico a menudo tiene que impartir el mismo cuerpo doctrinal o técnico a públicos radicalmente distintos:
- Niños de 7 a 9 años (requieren lenguaje visual, metáforas cotidianas y actividades lúdicas).
- Adolescentes de 14 a 16 años (preguntas desafiantes, debates morales, dinámicas grupales).
- Adultos o futuros formadores (profundidad teológica, citas bíblicas o fórmulas técnicas).
Mantener 3 versiones separadas de cada documento en archivos Word independientes genera pesadillas de sincronización: si corriges un error doctrinal en una versión, las otras dos quedan desfasadas.

### 1.2. La Solución de Antigravity Writer
Antigravity Writer implementa **Autoría de Fuente Única (*Single-Source Authoring*) & Derivación Inteligente**:
1. **Asistente de Derivación (`AudienceDerivationModal`)**:
   - A partir de la sesión maestra, genera adaptaciones de tono, vocabulario y dinámicas para públicos específicos con un clic.
2. **Vista Dual Sincronizada (`DualPaneView`)**:
   - Permite trabajar con la versión maestra del formador a la izquierda y la ficha del alumno o versión simplificada a la derecha, con scroll y navegación coordinada.
3. **Bloques Condicionales de Rol**:
   - `[INSTRUCTOR]`: Notas exclusivas para el docente/catequista.
   - `[NOTE]`: Ficha descargable del estudiante.
4. **Calculadora de Ritmo de Sesión (`Session Pacing Calculator`)**:
   - Estima con precisión el desglose de minutos: tiempo de lectura + explicación teórica + debate + dinámica práctica, asegurando clases equilibradas de 45 a 60 minutos.

---

## 2. Escaleta Audiovisual y Locución (Paso a Paso)

### Bloque 1: Apertura — Una fuente, múltiples públicos (00:00 – 00:35)
- **Visual:** Vista del editor principal. Clic en el botón *"Derivar Audiencia"* en la barra de herramientas. Se abre el modal `AudienceDerivationModal`.
- **Locución (Voz en off):**
  > "¿Tienes que impartir el mismo tema a un grupo de niños de Primera Comunión y a un grupo de jóvenes de Confirmación? Duplicar documentos a mano es una trampa de tiempo y errores. En Antigravity Writer aplicamos el principio de Fuente Única: redactas tu sesión maestra y la derivas a cualquier público en cuestión de segundos."

### Bloque 2: Configuración de la Audiencia y Tono (00:35 – 01:30)
- **Visual:** En el modal de derivación se selecciona el público objetivo: *"Niños (7-9 años)"*, tono *"Lúdico / Metafórico"* y formato *"Ficha de actividades con dibujos"*. Clic en *"Generar Derivación"*.
- **Locución (Voz en off):**
  > "Seleccionamos la audiencia deseada: niños, adolescentes o adultos. El asistente transforma el vocabulario complejo en analogías sencillas y propone dinámicas adaptadas a la madurez de los alumnos, respetando estrictamente los conceptos ontológicos del temario."

### Bloque 3: La Vista Dual Sincronizada (Dual Pane View) (01:30 – 02:25)
- **Visual:** Se activa `DualPaneView`. La pantalla se divide en dos paneles: a la izquierda, la sesión original para el formador; a la derecha, la versión adaptada para los niños. Al hacer scroll en la izquierda, la derecha acompaña de forma suave.
- **Locución (Voz en off):**
  > "Con la Vista Dual podemos comparar y editar ambas versiones en paralelo. A la izquierda tienes tu guía completa de formador con citas y notas técnicas; a la derecha, la ficha lista para imprimir o compartir con tus estudiantes."

### Bloque 4: La Calculadora de Ritmo y Calidad (02:25 – 03:20)
- **Visual:** Clic en el botón con icono de reloj (*Content Quality & Pacing*). Se despliega el panel de auditoría de tiempo:
  - *Lectura:* 8 min
  - *Explicación del Formador:* 15 min
  - *Dinámica Grupal:* 18 min
  - *Compromiso:* 4 min
  - **Total:** 45 min 🟢 *(Pacing Badge: Equilibrado)*
- **Locución (Voz en off):**
  > "¿Cuánto durará realmente tu clase? La Calculadora de Ritmo analiza la densidad de palabras y los bloques de dinámica, estimando con precisión si la sesión se ajusta a los 45 minutos programados o si corres el riesgo de quedarte sin tiempo."

### Bloque 5: Cierre y Transición al Capítulo 10 (03:20 – 03:50)
- **Visual:** Vista de la barra lateral con el botón de creación de compendios plurianuales (*Compendium Wizard*) y el modal de sincronización Git Remota.
- **Locución (Voz en off):**
  > "Hemos dominado la redacción, los grafos y la adaptación de audiencias. En nuestro gran episodio final, el Capítulo 10, descubriremos el **Compendium Wizard, Prompt Studio y la Sincronización Git Colaborativa**. ¡Vamos al gran cierre!"

---

## 3. Claves de Buenas Prácticas para el Autor
1. **Nunca dupliques archivos manualmente**: Usa siempre la vista dual y la derivación para mantener un único punto de verdad.
2. **Revisa el reloj de ritmo**: Si una sesión supera los 60 minutos en la calculadora, usa la herramienta *Selection-to-Floating-Idea* para podar el material sobrante.
3. **Aprovecha los bloques condicionales**: Las etiquetas `[INSTRUCTOR]` te permiten tener tus notas privadas en el mismo archivo sin que aparezcan en la ficha del alumno.
