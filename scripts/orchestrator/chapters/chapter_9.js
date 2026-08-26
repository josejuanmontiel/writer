/**
 * Coreografía Automatizada para el Capítulo 9:
 * «Derivación de Audiencias & Calidad de Contenido»
 */

export const chapter9Data = {
  chapterNumber: 9,
  title: "Derivación de Audiencias & Calidad de Contenido",
  scenes: [
    {
      id: "escena_01_apertura",
      title: "Una fuente, múltiples públicos",
      narration: "¿Tienes que impartir el mismo tema a un grupo de niños de Primera Comunión y a un grupo de jóvenes de Confirmación? Duplicar documentos a mano es una trampa de tiempo y errores. En Antigravity Writer aplicamos el principio de Fuente Única: redactas tu sesión maestra y la derivas a cualquier público en cuestión de segundos.",
      action: async (page, durationMs, mcp) => {
        // Clic en pestaña Vista Dual
        const dualTab = await page.$('button:has-text("Vista Dual")');
        if (dualTab) {
          await dualTab.click({ force: true });
          await page.waitForTimeout(800);
        }
        await page.mouse.move(500, 300, { steps: 15 });
      }
    },
    {
      id: "escena_02_configuracion_audiencia",
      title: "Configuración de la Audiencia y Tono",
      narration: "Seleccionamos la audiencia deseada: niños, adolescentes o adultos. El asistente transforma el vocabulario complejo en analogías sencillas y propone dinámicas adaptadas a la madurez de los alumnos, respetando estrictamente los conceptos ontológicos del temario.",
      action: async (page, durationMs, mcp) => {
        const audienceBtn = await page.$('button:has-text("Audiencia"), button[title*="Audiencia"], button[title*="Derivar"]');
        if (audienceBtn) {
          await audienceBtn.click({ force: true });
          await page.waitForTimeout(800);
        }
        await page.mouse.move(500, 350, { steps: 15 });
      }
    },
    {
      id: "escena_03_vista_dual",
      title: "La Vista Dual Sincronizada (Dual Pane View)",
      narration: "Con la Vista Dual podemos comparar y editar ambas versiones en paralelo. A la izquierda tienes tu guía completa de formador con citas y notas técnicas; a la derecha, la ficha lista para imprimir o compartir con tus estudiantes.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(300, 300, { steps: 15 });
        await page.waitForTimeout(600);
        await page.mouse.move(700, 300, { steps: 15 });
      }
    },
    {
      id: "escena_04_calculadora_ritmo",
      title: "La Calculadora de Ritmo y Calidad",
      narration: "¿Cuánto durará realmente tu clase? La Calculadora de Ritmo analiza la densidad de palabras y los bloques de dinámica, estimando con precisión si la sesión se ajusta a los cuarenta y cinco minutos programados o si corres el riesgo de quedarte sin tiempo.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(600, 450, { steps: 15 });
        await page.waitForTimeout(500);
      }
    },
    {
      id: "escena_05_cierre",
      title: "Cierre y Transición al Capítulo 10",
      narration: "Hemos dominado la redacción, los grafos y la adaptación de audiencias. En nuestro gran episodio final, el Capítulo 10, descubriremos el Compendium Wizard, Prompt Studio y la Sincronización Git Colaborativa. ¡Vamos al gran cierre!",
      action: async (page, durationMs, mcp) => {
        const escrituraTab = await page.$('button:has-text("Escritura")');
        if (escrituraTab) {
          await escrituraTab.click({ force: true });
          await page.waitForTimeout(500);
        }
        await page.mouse.move(150, 600, { steps: 15 });
      }
    }
  ]
};
