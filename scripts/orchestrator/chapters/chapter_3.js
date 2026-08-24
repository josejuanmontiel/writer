/**
 * Coreografía Automatizada para el Capítulo 3:
 * «Extracción Semántica & Grafos con GLiNER2»
 */

export const chapter3Data = {
  chapterNumber: 3,
  title: "Extracción Semántica & Grafos con GLiNER2",
  scenes: [
    {
      id: "escena_01_apertura",
      title: "Texto con Significado",
      narration: "¿Cómo sabe un buen profesor si sus lecciones están bien conectadas entre sí? En la mayoría de procesadores de texto, las palabras son solo letras mudas. En Antigravity Writer, cada párrafo que escribes cobra vida gracias a nuestro motor semántico local GLiNER2, capaz de extraer conceptos y dependencias en tiempo real.",
      action: async (page, durationMs, mcp) => {
        await page.keyboard.press('Escape');
        await page.mouse.move(500, 300, { steps: 20 });
      }
    },
    {
      id: "escena_02_analisis_gliner2",
      title: "Cómo GLiNER2 analiza el texto",
      narration: "A través de modelos optimizados en ONNX Runtime, GLiNER2 escanea el lenguaje natural y reconoce entidades clave y sus relaciones lógicas. Detecta si estás introduciendo un concepto nuevo o profundizando en uno anterior, clasificando las relaciones con precisión pedagógica.",
      action: async (page, durationMs, mcp) => {
        const syncBtn = await page.$('button[title*="Grafo"], button:has-text("Sincronizar")');
        if (syncBtn) {
          await syncBtn.click();
          await page.waitForTimeout(800);
        }
        await page.mouse.move(600, 350, { steps: 20 });
      }
    },
    {
      id: "escena_03_sincronizacion_grafos",
      title: "Sincronización Local vs Grafo Global del Compendio",
      narration: "Cada sesión mantiene su propio subgrafo local. Al guardar o pulsar sincronizar, estos nodos se fusionan de forma limpia e idempotente con el Grafo Global de todo el curso. Si modificas una definición en una sesión, el mapa global se actualiza sin duplicar información.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(200, 200, { steps: 25 });
        await page.waitForTimeout(1000);
        await page.mouse.move(600, 200, { steps: 25 });
      }
    },
    {
      id: "escena_04_autocompletado_contexto",
      title: "Autocompletado Semántico y Contexto Activo",
      narration: "Al abrir cualquier sesión posterior, el editor ya conoce los conceptos que enseñaste semanas atrás. Te ofrece autocompletado conceptual y te avisa si estás reutilizando términos fundamentales, manteniendo un hilo conductor perfecto a lo largo de los meses.",
      action: async (page, durationMs, mcp) => {
        const editorEl = await page.$('.ProseMirror, textarea, [contenteditable="true"]');
        if (editorEl) {
          await editorEl.click();
          await page.keyboard.type(" Bautismo es requisito para Confirmacion.", { delay: 25 });
        }
      }
    },
    {
      id: "escena_05_cierre",
      title: "Cierre y Transición al Capítulo 4",
      narration: "Ahora que nuestro compendio entiende el significado de lo que escribimos, ¿qué hacemos con esas ideas sueltas que aún no sabemos en qué clase encajan? En el Capítulo 4 descubriremos la Bandeja de Ideas Flotantes y los Semáforos de Madurez. ¡Vamos a verlo!",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(150, 400, { steps: 20 });
      }
    }
  ]
};
