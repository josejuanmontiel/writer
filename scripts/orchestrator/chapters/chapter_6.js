/**
 * Coreografía Automatizada para el Capítulo 6:
 * «Asistente de Reubicación por Dependencias (Icono 🧭)»
 */

export const chapter6Data = {
  chapterNumber: 6,
  title: "Asistente de Reubicación por Dependencias",
  scenes: [
    {
      id: "escena_01_apertura",
      title: "De la idea suelta al calendario perfecto",
      narration: "Has acumulado una docena de ideas en tu bandeja flotante. Ha llegado el momento de darles un hogar definitivo en el curso. ¿Cómo saber cuál es el lugar pedagógicamente perfecto para cada una? Antigravity Writer cuenta con una brújula inteligente: el Asistente de Reubicación por Dependencias.",
      action: async (page, durationMs, mcp) => {
        await page.keyboard.press('Escape');
        await page.mouse.move(180, 450, { steps: 20 });
      }
    },
    {
      id: "escena_02_diagnostico_grafo",
      title: "Apertura del Asistente y Diagnóstico del Grafo",
      narration: "Al abrir el asistente, el sistema analiza el grafo completo. Revisa cuándo se explicaron los conceptos de base —en este caso 'El Pan y el Vino' en la Sesión 4 y 'La Última Cena' en la Sesión 6— y nos indica con un noventa y cinco por ciento de confianza que la ubicación óptima es a partir de la Sesión 7.",
      action: async (page, durationMs, mcp) => {
        const compassBtn = await page.$('button[title*="Reubicación"], button[title*="Reubicar"], button[title*="brújula"]');
        if (compassBtn) {
          await compassBtn.click();
          await page.waitForTimeout(1000);
          await page.keyboard.press('Escape');
        }
      }
    },
    {
      id: "escena_03_promover_nueva_sesion",
      title: "Opción A — Promover como Nueva Sesión",
      narration: "Si la idea es suficientemente extensa e importante, elegimos 'Promover como Nueva Sesión'. El asistente mueve el archivo al módulo correspondiente, renombra la lección de forma correlativa y actualiza el repositorio Git automáticamente.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(500, 350, { steps: 20 });
      }
    },
    {
      id: "escena_04_incrustar_sesion_existente",
      title: "Opción B — Incrustar en Sesión Existente",
      narration: "Si la idea es una dinámica corta o una anécdota, no necesitamos crear una clase entera. Seleccionamos 'Incrustar en Sesión Existente'. La aplicación añade el texto al final de la sesión elegida como una subsección o un bloque destacado, manteniendo tu temario limpio y ordenado.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(500, 450, { steps: 20 });
      }
    },
    {
      id: "escena_05_cierre",
      title: "Cierre y Transición al Capítulo 7",
      narration: "Ahora que nuestras lecciones e ideas están organizadas en el calendario, ¿cómo auditamos todo el curso de un vistazo para asegurar que no hay fugas ni conceptos usados antes de tiempo? En el Capítulo 7 veremos la Matriz de Coherencia Curricular y su Mapa de Calor. ¡Acompáñanos!",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(650, 40, { steps: 20 });
      }
    }
  ]
};
