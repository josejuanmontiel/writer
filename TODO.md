# Antigravity Writer - TODO

## Llm local con hugot
- La idea es descargar Qwen 0.3b para que tengamos opcion de cerebro locals sin necesidad de internet y usando hugot para la inferencia.

## Sistema de RAG inicial
- La idea es integrarle la capacidad de realizar busquedas ... ¿internet? ¿Documentoslocales?  y que se le pueda pasar al modelo pequeño para preguntarle por el.

## 🎙️ Audio y STT
- [ ] **Modo "Live" (Prioridad Alta)**: Probar la partición de la grabación nativa en fragmentos más pequeños para simular transcripción en tiempo real.
- [ ] **Detección de Silencios (VAD)**: Implementar lógica (vía Go o parámetros de Whisper) para detectar cuándo el usuario deja de hablar y procesar el fragmento automáticamente.
- [ ] **Investigación WebSocket**: Comprobar si el contenedor Docker actual de `Faster-Whisper` tiene expuesto algún endpoint WebSocket (wss://) que permita el streaming real de bytes.
- [ ] **Integración Kokoro (TTS)**: Implementar la lectura de textos mediante el servicio local en el puerto `8880`.
- [ ] **Selección de Voces**: Permitir elegir diferentes voces de Kokoro según el personaje o contexto.
- [ ] **Visualización de Ondas**: Añadir un componente visual (Waveform) mientras se graba para mayor feedback.

## ✍️ Editor y Lógica
- [ ] **Refinado con LLM (Qwen/Gemini)**: Utilizar un modelo local como **Qwen** (o Gemini) para post-procesar el texto dictado:
    - Corregir gramática y ortografía en tiempo real.
    - Añadir puntuación narrativa natural (diálogos, exclamaciones).
    - Eliminar muletillas de voz ("ehh", "mmm").
- [ ] **Filtro Gemini**: Conectar con la API de Gemini para el modo "Ficción" (puntuación narrativa, estilo).
- [ ] **Auto-formateo Técnico**: Mejorar la detección de términos técnicos en el modo "Técnico".
- [ ] **Persistencia**: Guardado automático de documentos en formato Markdown o JSON.
- [ ] **Exportación**: Botón para exportar a PDF o DOCX.

## 🎨 UI/UX
- [ ] **Atajos de Teclado**: Implementar `Ctrl+D` para dictar, `Ctrl+S` para guardar, etc.
- [ ] **Gestión de Documentos**: Barra lateral para navegar entre diferentes escritos.
- [ ] **Personalización**: Temas de color y selección de tipografía para el editor.

## ⚙️ Sistema
- [ ] **Detección Automática de Servicios**: Comprobar si Whisper y Kokoro están activos al arrancar.
- [ ] **Configuración de Puertos**: Permitir cambiar los puertos de los servicios desde la UI.
## 🌐 Alternativas Cloud (Gratuitas/Freemium)
- [ ] **STT (Voz a Texto)**:
    - [Deepgram](https://console.deepgram.com/signup): Muy rápido, capa gratuita generosa ($200 de crédito inicial).
    - [Groq Whisper](https://groq.com/): Extremadamente rápido e inicialmente gratuito.
- [ ] **LLM (Análisis de Diagramas)**:
    - [Groq](https://console.groq.com/): Ideal para el JSON del diagrama (latencia casi cero).
    - [Together AI](https://www.together.ai/): Muchos modelos open source con capa gratuita inicial.
    - [Google Gemini API](https://aistudio.google.com/): Gratuito para uso moderado (útil para el modo Ficción).

---

TODO ... Diagrama de fuerzas...
Mejorar el promt para pasarle el diagrama actual antes del parrafo y asi que relacion con lo que ya hay...

El pasado lunes, Elena Rodríguez, Directora de Operaciones de TechNova Solutions, anunció en la sede de Madrid la adquisición de la startup finlandesa Nordic AI. Según el acuerdo valorado en 45 millones de euros, el fundador de Nordic AI, Lukas Virtanen, se unirá al comité ejecutivo de TechNova. Esta operación fue supervisada por el Banco Santander, que actuó como asesor financiero principal, asegurando que la integración tecnológica comience el próximo mes de junio en sus oficinas de Helsinki.

Simultáneamente, la firma de abogados Garrigues coordinó la auditoría legal en colaboración con Sarah Jenkins, consultora senior de Global Compliance. Durante la rueda de prensa, Jenkins confirmó que la propiedad intelectual de los algoritmos de Nordic AI será transferida a la nueva división de I+D en Barcelona. Como parte de este movimiento estratégico, la ingeniera jefa Sofía Al-Mansoori liderará el equipo de desarrollo, reportando directamente a Elena Rodríguez, con el objetivo de lanzar el primer prototipo de IA generativa para el sector bancario europeo antes de finales de año."
