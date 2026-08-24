/**
 * Coreografía Automatizada para el Capítulo 2:
 * «Motor de Voz Local & Dictado con Whisper»
 */

export const chapter2Data = {
  chapterNumber: 2,
  title: "Motor de Voz Local & Dictado con Whisper",
  scenes: [
    {
      id: "escena_01_apertura",
      title: "Hablar a la velocidad del pensamiento",
      narration: "¿Cuántas veces has tenido una explicación brillante en mente y al sentarte a escribirla en el teclado has perdido la frescura de la idea? La voz es nuestro canal de comunicación más natural. En este capítulo veremos cómo Antigravity Writer utiliza inteligencia artificial local para transformar tu voz en texto estructurado sin depender de internet ni enviar tus datos a la nube.",
      action: async (page, durationMs, mcp) => {
        const micBtn = await page.$('button[title*="Dictado"], button[title*="Micrófono"], button[title*="Microfono"]');
        if (micBtn) {
          const box = await micBtn.boundingBox();
          if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
        }
      }
    },
    {
      id: "escena_02_configuracion_modelos",
      title: "Configuración del Dispositivo y Modelos Whisper",
      narration: "Desde el panel de configuración, podemos seleccionar qué modelo de Whisper utilizar según la potencia de nuestro equipo. El modelo 'Tiny' ofrece respuesta instantánea para equipos modestos, mientras que 'Base' y 'Small' proporcionan una precisión extraordinaria en terminología técnica y pedagógica. La descarga se gestiona en un solo clic.",
      action: async (page, durationMs, mcp) => {
        const settingsBtn = await page.$('button[title*="Configuración"], button[title*="Ajustes"], button[title*="Modelos"]');
        if (settingsBtn) {
          await settingsBtn.click({ force: true });
          await page.waitForTimeout(800);
        }
        await page.mouse.move(500, 400, { steps: 15 });
        await page.waitForTimeout(500);

        // Cerrar modal haciendo clic en la X
        const closeBtn = await page.$('button:has(svg.lucide-x)');
        if (closeBtn) {
          await closeBtn.click({ force: true });
          await page.waitForTimeout(400);
        }
      }
    },
    {
      id: "escena_03_vu_meter",
      title: "El VU Meter en Acción — Cero Grabaciones Fallidas",
      narration: "Uno de los problemas más frustrantes al dictar es hablar durante minutos y descubrir que el micrófono estaba silenciado. Antigravity Writer incluye un medidor de volumen o VU Meter en tiempo real. Al pulsar sobre el test, puedes verificar visualmente la señal antes de empezar a grabar.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(700, 40, { steps: 15 });
      }
    },
    {
      id: "escena_04_dictado_en_vivo",
      title: "Dictado en Vivo sobre el Editor",
      narration: "Hacemos clic en el micrófono y comenzamos a hablar libremente. No hace falta dictar signos de puntuación como en los sistemas antiguos; el motor local interpreta las pausas e inserta mayúsculas, comas y puntos de forma natural. Al finalizar, el texto aparece en el lienzo de redacción listo para ser enriquecido.",
      action: async (page, durationMs, mcp) => {
        try {
          const editorEl = await page.$('.ProseMirror, textarea, [contenteditable="true"]');
          if (editorEl) {
            await editorEl.click({ force: true });
            await page.keyboard.type(" Hoy explicaremos los tres sacramentos de iniciacion cristiana.", { delay: 20 });
          }
        } catch (e) {}
      }
    },
    {
      id: "escena_05_modo_ttt",
      title: "Modo TTT (Text-to-Text) — Para entornos silenciosos",
      narration: "¿Estás en una biblioteca o prefieres no hablar? El modo TTT o Text-to-Text te permite usar los mismos flujos de captura rápida mediante texto directo, manteniendo la misma agilidad.",
      action: async (page, durationMs, mcp) => {
        const tttBtn = await page.$('button:has-text("TTT"), button[title*="TTT"]');
        if (tttBtn) {
          try {
            await tttBtn.click({ force: true });
            await page.waitForTimeout(500);
            const closeBtn = await page.$('button:has(svg.lucide-x)');
            if (closeBtn) await closeBtn.click({ force: true });
          } catch (e) {}
        }
      }
    },
    {
      id: "escena_06_cierre",
      title: "Cierre y Transición al Capítulo 3",
      narration: "Ya tenemos nuestras palabras en pantalla. Pero, ¿cómo sabe la aplicación qué conceptos hemos enseñado y cómo se relacionan entre sí? En el Capítulo 3 descubriremos el Motor Semántico Local GLiNER2 y la extracción automática de grafos de conocimiento. ¡Continuemos!",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(500, 300, { steps: 15 });
      }
    }
  ]
};
