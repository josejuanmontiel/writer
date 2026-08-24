/**
 * Coreografía Automatizada para el Capítulo 7:
 * «Matriz de Coherencia Curricular (Heatmap)»
 */

export const chapter7Data = {
  chapterNumber: 7,
  title: "Matriz de Coherencia Curricular",
  scenes: [
    {
      id: "escena_01_apertura",
      title: "La radiografía completa de tu curso",
      narration: "¿Cómo podemos estar cien por cien seguros de que nuestro curso está pedagógicamente blindado antes de publicarlo o impartirlo? En Antigravity Writer disponemos de la Matriz de Coherencia Curricular: una auténtica radiografía de todo tu temario que te muestra qué se enseña, cuándo se refuerza y dónde existen posibles lagunas.",
      action: async (page, durationMs, mcp) => {
        await page.keyboard.press('Escape');
        const matrixBtn = await page.$('button[title*="Matriz"], button[title*="Coherencia"]');
        if (matrixBtn) {
          await matrixBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    },
    {
      id: "escena_02_anatomia_matriz",
      title: "Anatomía de la Matriz y Simbología",
      narration: "En el eje horizontal encontramos todas las sesiones en orden cronológico; en el eje vertical, todos los conceptos extraídos. La estrella dorada marca el momento exacto en que un concepto nace y se explica formalmente. Los círculos verdes reflejan las clases posteriores donde vuelves a reforzarlo, asegurando una curva de aprendizaje continua.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(400, 300, { steps: 20 });
        await page.waitForTimeout(1500);
        await page.mouse.move(700, 400, { steps: 20 });
      }
    },
    {
      id: "escena_03_deteccion_alertas",
      title: "Detección de Alertas de Uso Prematuro",
      narration: "Observa esta alerta: en la Sesión 3 hemos utilizado un término avanzado sin haberlo explicado previamente. La matriz detecta este salto pedagógico de forma automática y nos avisa antes de que un alumno quede descolocado en el aula.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(500, 350, { steps: 15 });
      }
    },
    {
      id: "escena_04_correccion_en_1_clic",
      title: "Corrección en 1 Clic desde la Matriz",
      narration: "Desde la propia matriz podemos saltar a la sesión afectada, añadir una breve explicación previa o reordenar el temario. En cuanto guardas, la matriz recalcula la coherencia y la alerta desaparece, certificando la solidez de tu curso.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(600, 450, { steps: 15 });
      }
    },
    {
      id: "escena_05_cierre",
      title: "Cierre y Transición al Capítulo 8",
      narration: "Hemos visto la vista tabular cronológica. Pero, ¿cómo interactuamos directamente con los nodos y flechas de forma visual en dos dimensiones? En el Capítulo 8 descubriremos IdeaGraph 2.0 y el Validador Curricular Linter. ¡Nos vemos en el siguiente episodio!",
      action: async (page, durationMs, mcp) => {
        await page.keyboard.press('Escape');
        await page.mouse.move(600, 40, { steps: 20 });
      }
    }
  ]
};
