# Material Didáctico y Guión Maestro — Capítulo 2
## Título: Motor de Voz Local & Dictado con Whisper
**Subtítulo:** Privacidad total en CPU/GPU, VU Meter en tiempo real, captura rápida de pensamientos y modo Text-to-Text (TTT)

---

## 1. Contexto Pedagógico y Filosofía de Diseño

### 1.1. La Voz como Canal de Mayor Ancho de Banda Cognitivo
Muchos docentes, catequistas y formadores transmiten sus mejores ideas cuando hablan de forma espontánea frente a sus alumnos o en el taller, pero se bloquean al intentar escribir formalmente en un teclado.
- El habla permite un flujo de pensamiento de 150-180 palabras por minuto, frente a las 40-50 palabras por minuto al teclear.
- Sin embargo, las soluciones en la nube (Google Cloud Speech, Whisper API) requieren conexión continua, generan costes recurrentes y exponen datos privados.

### 1.2. La Solución de Antigravity Writer
Antigravity Writer incorpora un motor de inferencia local basado en **Whisper.cpp (CGO / GGML)**:
1. **100% Offline y Privado**: El audio nunca sale de tu ordenador.
2. **Selector Dinámico de Modelos**: Permite alternar entre `tiny` (ultrarrápido para notas efímeras), `base` (balance ideal) y `small` (máxima precisión).
3. **VU Meter Activo en Tiempo Real**: Un monitor visual de nivel de entrada que previene grabaciones mudas o saturadas antes de empezar.
4. **Modo Dual Voz / TTT (Text-to-Text)**: Alterna entre dictado vocal y comandos directos de texto con un clic.

---

## 2. Escaleta Audiovisual y Locución (Paso a Paso)

### Bloque 1: Apertura — Hablar a la velocidad del pensamiento (00:00 – 00:35)
- **Visual:** Primer plano del botón circular del micrófono en la barra superior. El botón emite un brillo suave.
- **Locución (Voz en off):**
  > "¿Cuántas veces has tenido una explicación brillante en mente y al sentarte a escribirla en el teclado has perdido la frescura de la idea? La voz es nuestro canal de comunicación más natural. En este capítulo veremos cómo Antigravity Writer utiliza inteligencia artificial local para transformar tu voz en texto estructurado sin depender de internet ni enviar tus datos a la nube."

### Bloque 2: Configuración del Dispositivo y Modelos Whisper (00:35 – 01:20)
- **Visual:** Clic en el icono de engranaje (Configuración). Apertura del panel de modelos y dispositivos de audio. Selección del modelo `base.bin` y selector de micrófono.
- **Locución (Voz en off):**
  > "Desde el panel de configuración, podemos seleccionar qué modelo de Whisper utilizar según la potencia de nuestro equipo. El modelo 'Tiny' ofrece respuesta instantánea para equipos modestos, mientras que 'Base' y 'Small' proporcionan una precisión extraordinaria en terminología técnica y pedagógica. La descarga se gestiona en un solo clic."

### Bloque 3: El VU Meter en Acción — Cero Grabaciones Fallidas (01:20 – 02:00)
- **Visual:** Se pulsa el botón de Test de Micrófono. Las barras del VU Meter oscilan en color verde y amarillo respondiendo a la voz.
- **Locución (Voz en off):**
  > "Uno de los problemas más frustrantes al dictar es hablar durante minutos y descubrir que el micrófono estaba silenciado. Antigravity Writer incluye un medidor de volumen o VU Meter en tiempo real. Al pulsar sobre el test, puedes verificar visualmente la señal antes de empezar a grabar."

### Bloque 4: Dictado en Vivo sobre el Editor (02:00 – 03:00)
- **Visual:** El cursor se sitúa en una sesión vacía. Se pulsa el botón del micrófono (o atajo de teclado). El botón cambia a rojo pulsante. Se dicta un párrafo sobre el tema: *"Hoy explicaremos los tres sacramentos de iniciación cristiana..."*. Al detener la grabación, el texto aparece transcrito con puntuación limpia.
- **Locución (Voz en off):**
  > "Hacemos clic en el micrófono y comenzamos a hablar libremente. No hace falta dictar signos de puntuación como en los sistemas antiguos; el motor local interpreta las pausas e inserta mayúsculas, comas y puntos de forma natural. Al finalizar, el texto aparece en el lienzo de redacción listo para ser enriquecido."

### Bloque 5: Modo TTT (Text-to-Text) — Para entornos silenciosos (03:00 – 03:45)
- **Visual:** Clic en el botón `TTT` junto al micrófono. Se despliega una caja de entrada rápida de texto. Se escribe una instrucción breve y se inserta al instante.
- **Locución (Voz en off):**
  > "¿Estás en una biblioteca o prefieres no hablar? El modo TTT o Text-to-Text te permite usar los mismos flujos de captura rápida mediante texto directo, manteniendo la misma agilidad."

### Bloque 6: Cierre y Transición al Capítulo 3 (03:45 – 04:15)
- **Visual:** El texto transcrito se resalta y aparece una notificación: *"3 conceptos detectados por GLiNER2"*.
- **Locución (Voz en off):**
  > "Ya tenemos nuestras palabras en pantalla. Pero, ¿cómo sabe la aplicación qué conceptos hemos enseñado y cómo se relacionan entre sí? En el Capítulo 3 descubriremos el **Motor Semántico Local GLiNER2** y la extracción automática de grafos de conocimiento. ¡Continuemos!"

---

## 3. Claves de Buenas Prácticas para el Autor
1. **Habla de forma continua y natural**: No hables como un robot; Whisper funciona mucho mejor con frases completas que con palabras sueltas.
2. **Comprueba el VU Meter al iniciar la jornada**: Una rápida mirada a las barras verdes te asegura que el dispositivo de audio correcto está seleccionado.
3. **Usa el modelo Base para el día a día**: Ofrece el equilibrio óptimo entre consumo de memoria RAM (menos de 500 MB) y velocidad de transcripción.
