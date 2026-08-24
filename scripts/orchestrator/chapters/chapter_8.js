/**
 * Coreografía Automatizada para el Capítulo 8:
 * «IdeaGraph 2.0 & Validador Curricular (Knowledge Linter)»
 */

export const chapter8Data = {
  chapterNumber: 8,
  title: "IdeaGraph 2.0 & Validador Curricular",
  scenes: [
    {
      id: "escena_01_apertura",
      title: "El mapa visual de tu mente",
      narration: "¿Cómo se ve el conocimiento cuando lo miras desde arriba? En Antigravity Writer, tu compendio no es solo un montón de texto: es un grafo vivo de ideas. Bienvenido a IdeaGraph 2.0, el visor conceptual donde puedes explorar, conectar y auditar toda la red de tu curso de forma interactiva.",
      action: async (page, durationMs, mcp) => {
        await page.keyboard.press('Escape');
        const graphBtn = await page.$('button[title*="IdeaGraph"], button[title*="Grafo"]');
        if (graphBtn) {
          await graphBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    },
    {
      id: "escena_02_navegacion_grafo",
      title: "Navegación por el Grafo y Tipos de Nodos",
      narration: "Podemos movernos por el lienzo con total libertad. Cada nodo representa un concepto y muestra el número de veces que ha sido citado. Al situarnos sobre un concepto central, como 'El Bautismo', el grafo ilumina de inmediato sus fundamentos previos y las lecciones futuras que se construyen sobre él.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(500, 350, { steps: 20 });
        await page.waitForTimeout(1500);
        await page.mouse.move(650, 400, { steps: 20 });
      }
    },
    {
      id: "escena_03_knowledge_linter",
      title: "El Knowledge Linter — Detectando Anomalías",
      narration: "El Validador Curricular actúa como un corrector ortográfico, pero para el sentido pedagógico de tu curso. Detecta dependencias circulares —donde dos conceptos se exigen mutuamente sin un punto de entrada claro— y nodos huérfanos que han quedado aislados, ayudándote a pulir la coherencia del temario.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(800, 250, { steps: 20 });
      }
    },
    {
      id: "escena_04_navegacion_bidireccional",
      title: "Navegación Bidireccional Grafo ↔ Editor",
      narration: "La conexión es total en ambos sentidos. Doble clic sobre cualquier nodo y el editor te llevará directamente a la sesión y párrafo exacto donde se definió. Modificas el texto, guardas, y el grafo refleja los cambios de inmediato.",
      action: async (page, durationMs, mcp) => {
        await page.keyboard.press('Escape');
        await page.mouse.move(600, 300, { steps: 20 });
      }
    },
    {
      id: "escena_05_cierre",
      title: "Cierre y Transición al Capítulo 9",
      narration: "Ya tenemos un curso sólido y bien conectado. Pero, ¿cómo adaptamos una misma lección maestra para impartirla a niños de ocho años, jóvenes o catecúmenos adultos? En el Capítulo 9 descubriremos la Derivación de Audiencias y Calidad de Contenido. ¡Vamos a verlo!",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(500, 50, { steps: 20 });
      }
    }
  ]
};
