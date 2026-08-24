/**
 * Coreografía Automatizada para el Capítulo 5:
 * «Extracción de Selección a Idea Flotante (Selection-to-Floating-Idea)»
 */

export const chapter5Data = {
  chapterNumber: 5,
  title: "Extracción de Selección a Idea Flotante",
  scenes: [
    {
      id: "escena_01_apertura",
      title: "El dilema de podar sin perder valor",
      narration: "¿Alguna vez has escrito una explicación brillante pero te has dado cuenta de que se desvía del objetivo central de la clase de hoy? En un procesador convencional, o la borras con dolor o sobrecargas a tus alumnos. En Antigravity Writer puedes podar esa sección en un segundo y convertirla en una idea flotante independiente.",
      action: async (page, durationMs, mcp) => {
        await page.keyboard.press('Escape');
        await page.mouse.move(600, 300, { steps: 20 });
      }
    },
    {
      id: "escena_02_seleccion_extraccion",
      title: "Selección y Activación de la Herramienta",
      narration: "Basta con seleccionar el texto que queremos modularizar. En la barra de herramientas del editor pulsamos el botón 'Convertir en Idea Flotante'. La aplicación nos solicita un título breve para la nueva nota o nos sugiere uno automáticamente a partir de los conceptos detectados.",
      action: async (page, durationMs, mcp) => {
        const scissorsBtn = await page.$('button[title*="Idea Flotante"], button[title*="extraer"], button[title*="Extraer"]');
        if (scissorsBtn) {
          await scissorsBtn.click();
          await page.waitForTimeout(800);
          await page.keyboard.press('Escape');
        }
      }
    },
    {
      id: "escena_03_resultado_editor",
      title: "El Resultado en el Editor y en el Árbol",
      narration: "Observa lo que acaba de ocurrir: en el lugar del texto extraído, el editor ha insertado una referencia cruzada elegante. Tu sesión recupera su duración perfecta de 45 minutos, y en la barra lateral dispones de tu nueva idea flotante con su propio semáforo de madurez listo para ser analizado.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(600, 400, { steps: 20 });
        await page.waitForTimeout(1500);
        await page.mouse.move(150, 480, { steps: 20 });
      }
    },
    {
      id: "escena_04_trazabilidad_grafo",
      title: "Trazabilidad y Sincronización del Grafo",
      narration: "Al hacer clic sobre la referencia, podemos abrir la idea en cualquier momento. El motor de grafos entiende que ambos documentos están conectados, manteniendo la trazabilidad pedagógica completa sin sobrecargar la sesión principal.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(600, 300, { steps: 20 });
      }
    },
    {
      id: "escena_05_cierre",
      title: "Cierre y Transición al Capítulo 6",
      narration: "Ya sabemos cómo capturar ideas libres y cómo podar nuestras clases. Pero, ¿cómo decidimos cuál es la semana exacta del calendario en la que debemos enseñar cada idea? En el Capítulo 6 descubriremos el Asistente de Reubicación por Dependencias. ¡Nos vemos allí!",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(180, 450, { steps: 20 });
      }
    }
  ]
};
