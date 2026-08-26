/**
 * Coreografía Automatizada para el Capítulo 10:
 * «Compendium Wizard, Prompt Studio y Git Sync»
 */

export const chapter10Data = {
  chapterNumber: 10,
  title: "Compendium Wizard, Prompt Studio y Git Sync",
  scenes: [
    {
      id: "escena_01_apertura",
      title: "La suite completa de producción educativa",
      narration: "Bienvenidos al capítulo final de nuestra masterclass. Hoy conectaremos todas las piezas del rompecabezas: desde cómo generar un curso completo de dos años en diez segundos, hasta cómo crear presentaciones, vídeos y sincronizar tu trabajo en equipo con Git.",
      action: async (page, durationMs, mcp) => {
        // Clic en selector de workspace y wizard
        const workspaceBtn = await page.$('button:has(.lucide-compass), button:has(.lucide-edit-3)');
        if (workspaceBtn) {
          await workspaceBtn.click();
          await page.waitForTimeout(400);
        }
        const wizardOption = await page.$('button:has-text("Wizard"), button:has-text("Asistente")');
        if (wizardOption) {
          await wizardOption.click();
          await page.waitForTimeout(800);
        }
      }
    },
    {
      id: "escena_02_asistente_plurianual",
      title: "El Asistente de Calendario Plurianual",
      narration: "Con el Compendium Wizard no necesitas configurar carpetas a mano. Defines el horizonte temporal —por ejemplo, un curso escolar o un plan bienal de catequesis— y el sistema calcula de forma determinista todas las semanas, fechas y archivos base con plantillas pedagógicas estandarizadas.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(500, 350, { steps: 20 });
        await page.waitForTimeout(800);
      }
    },
    {
      id: "escena_03_prompt_studio",
      title: "Prompt Studio — Diapositivas, Vídeos y Cápsulas",
      narration: "En el Prompt Studio transformamos cualquier lección en múltiples formatos con un clic. ¿Necesitas diapositivas para la clase? Genera el esquema para Canva. ¿Quieres publicar un resumen en vídeo? Obtén una escaleta cronometrada. Puedes usar tu propia API key o simplemente copiar el prompt listo para Gemini Web.",
      action: async (page, durationMs, mcp) => {
        // Abrir Prompt Studio desde el menú de herramientas
        const toolsBtn = await page.$('button:has-text("Herramientas"), button[title*="Herramientas"]');
        if (toolsBtn) {
          await toolsBtn.click({ force: true });
          await page.waitForTimeout(400);
        }
        const studioBtn = await page.$('button:has-text("Prompt Studio"), button:has-text("Studio")');
        if (studioBtn) {
          await studioBtn.click({ force: true });
          await page.waitForTimeout(800);
        }
        await page.mouse.move(500, 400, { steps: 15 });
      }
    },
    {
      id: "escena_04_git_sync_remoto",
      title: "Sincronización Git Remota y Colaboración",
      narration: "Todo tu trabajo vive en un repositorio Git local. Con el módulo de sincronización remota, puedes conectar tu compendio con GitHub o el servidor de tu centro educativo. Con un solo clic en 'Push', tus compañeros de equipo reciben las últimas sesiones y tu material queda respaldado de forma segura.",
      action: async (page, durationMs, mcp) => {
        const gitBtn = await page.$('button[title*="Git"], button[title*="Sync"], button:has-text("Git")');
        if (gitBtn) {
          await gitBtn.click({ force: true });
          await page.waitForTimeout(800);
        }
        await page.mouse.move(500, 350, { steps: 15 });
      }
    },
    {
      id: "escena_05_conclusion_masterclass",
      title: "Conclusión y Cierre de la Masterclass",
      narration: "Has completado la formación integral de Antigravity Writer. Ahora cuentas con el poder de escribir libremente, extraer conocimiento en grafos locales, auditar la coherencia curricular de tus cursos y producir contenido multiformato sin fricción. ¡Empieza hoy mismo a crear tu próximo gran compendio!",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(500, 300, { steps: 20 });
        await page.waitForTimeout(500);
      }
    }
  ]
};
