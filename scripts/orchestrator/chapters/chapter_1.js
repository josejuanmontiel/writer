/**
 * Coreografía Automatizada para el Capítulo 1:
 * «Escribir sin miedo al orden — La Interfaz Dual de Antigravity Writer»
 */

export const chapter1Data = {
  chapterNumber: 1,
  title: "Introducción y Paradigma: «Escribir sin miedo al orden»",
  scenes: [
    {
      id: "escena_01_apertura",
      title: "Apertura & El dilema del autor",
      narration: "¿Alguna vez te has sentado a preparar un curso o una serie de lecciones y te has quedado bloqueado decidiendo en qué carpeta guardarlo o en qué semana encajará mejor? Los educadores solemos pensar de forma orgánica, no lineal. Antigravity Writer nació con una premisa revolucionaria: permitirte escribir primero y organizar después, sin perder jamás la coherencia conceptual de tu temario.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(100, 100);
        await page.waitForTimeout(500);
        await page.mouse.move(500, 300, { steps: 15 });
      }
    },
    {
      id: "escena_02_workspace",
      title: "Gestor de Espacios de Trabajo",
      narration: "Al abrir la aplicación, nos recibe el Gestor de Espacios de Trabajo. Aquí puedes saltar instantáneamente entre diferentes cursos, compendios de catequesis o manuales técnicos. Todos tus proyectos son carpetas estándar en tu disco duro con archivos de texto plano legibles y universales. Tu conocimiento te pertenece al cien por cien.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(250, 400, { steps: 15 });
        await page.waitForTimeout(800);
        await page.mouse.move(600, 400, { steps: 15 });
      }
    },
    {
      id: "escena_03_crear_compendio",
      title: "Creación Rápida de un Compendio",
      narration: "Vamos a crear un nuevo compendio. Pulsamos en 'Nuevo Rápido', introducimos el título del curso, autor y descripción. Al pulsar 'Crear', la aplicación no solo genera la estructura de carpetas, sino que inicializa automáticamente un repositorio Git interno. A partir de este segundo, cada párrafo que escribas tendrá control de versiones automático e invisible.",
      action: async (page, durationMs, mcp) => {
        const nuevoRapidoBtn = await page.$('button:has-text("Nuevo Rápido")') || await page.$('button:has-text("Nuevo")');
        if (nuevoRapidoBtn) {
          await nuevoRapidoBtn.click();
          await page.waitForTimeout(600);
        }

        const titleInput = await page.$('input[placeholder*="Título"], input[placeholder*="Nombre"]');
        if (titleInput) {
          await titleInput.click();
          await page.keyboard.type("Curso de Piloto de Antigravedad", { delay: 20 });
          await page.waitForTimeout(300);
        }

        const authorInput = await page.$('input[placeholder*="Autor"], input[placeholder*="Formador"]');
        if (authorInput) {
          await authorInput.click();
          await page.keyboard.type("Instructor Zero", { delay: 20 });
          await page.waitForTimeout(300);
        }

        const submitBtn = await page.$('button:has-text("Crear e Inicializar")') || await page.$('button:has-text("Crear")');
        if (submitBtn) {
          await submitBtn.click();
          await page.waitForTimeout(600);
        }

        await page.keyboard.press('Escape');
      }
    },
    {
      id: "escena_04_interfaz_dual",
      title: "Anatomía de la Interfaz Dual",
      narration: "Esta es la cabina de mandos. A la izquierda tenemos el Árbol del Compendio, con sus módulos, sesiones ordenadas y la Bandeja de Ideas Flotantes. En el centro, el Lienzo de Escritura Fluida, compatible con AsciiDoc. En la barra superior disponemos de herramientas de dictado por voz local con Whisper, grafos en tiempo real y matriz curricular.",
      action: async (page, durationMs, mcp) => {
        await page.keyboard.press('Escape');
        await page.mouse.move(150, 250, { steps: 15 });
        await page.waitForTimeout(800);
        await page.mouse.move(600, 350, { steps: 15 });
        await page.waitForTimeout(800);
        await page.mouse.move(600, 30, { steps: 15 });
      }
    },
    {
      id: "escena_05_crear_modulos",
      title: "Creación Dinámica de Módulos y Sesiones",
      narration: "Crear y reestructurar es inmediato. Añadimos un segundo módulo temático para profundizar en la materia y creamos una nueva sesión dentro de él. El árbol se actualiza en tiempo real reflejando la jerarquía pedagógica sin esperas.",
      action: async (page, durationMs, mcp) => {
        const addModuleBtn = await page.$('button[title*="Módulo"], button:has-text("Módulo")');
        if (addModuleBtn) {
          await addModuleBtn.click();
          await page.waitForTimeout(500);

          const moduleTitleInput = await page.$('input[placeholder*="Título"], input[placeholder*="Nombre"]');
          if (moduleTitleInput) {
            await moduleTitleInput.type("Módulo 2: Reactores de Fusión", { delay: 20 });
            await page.waitForTimeout(300);
          }

          const createBtn = await page.$('button:has-text("Crear Módulo"), button:has-text("Guardar"), button:has-text("Añadir")');
          if (createBtn) {
            await createBtn.click();
            await page.waitForTimeout(500);
          }
        }
        await page.keyboard.press('Escape');
        await page.mouse.move(150, 450, { steps: 15 });
      }
    },
    {
      id: "escena_06_bloques_pedagogicos",
      title: "Bloques Pedagógicos Estructurados",
      narration: "Al redactar material didáctico, la claridad visual es clave. Antigravity Writer incorpora bloques semánticos nativos de AsciiDoc. Con un solo clic podemos insertar una caja de Consejo Pedagógico, escribir la recomendación y guardar. El documento se sincroniza inmediatamente con el disco local generando un commit atómico.",
      action: async (page, durationMs, mcp) => {
        await page.keyboard.press('Escape');
        const consejoBtn = await page.$('button[title*="Consejo"], button:has-text("Consejo")');
        if (consejoBtn) {
          try {
            await consejoBtn.click({ force: true });
            await page.waitForTimeout(500);
          } catch (e) {}
        }

        try {
          const editorEl = await page.$('.ProseMirror, textarea, [contenteditable="true"]');
          if (editorEl) {
            await editorEl.click();
            await page.keyboard.type(" No tocar el nucleo sin guantes termicos.", { delay: 15 });
          }
        } catch (e) {}
      }
    },
    {
      id: "escena_07_persistencia_git",
      title: "Persistencia Atómica y Control de Versiones",
      narration: "Detrás de escena, nunca perderás un cambio. La aplicación rastrea cada guardado con un mensaje descriptivo automático. Si cometes un error o quieres recuperar una versión anterior de una sesión, puedes viajar en el tiempo con total tranquilidad.",
      action: async (page, durationMs, mcp) => {
        const saveBtn = await page.$('button:has-text("Guardar"), button[title*="Guardar"]');
        if (saveBtn) {
          try {
            await saveBtn.click({ force: true });
            await page.waitForTimeout(600);
          } catch (e) {}
        }
        await page.mouse.move(500, 500, { steps: 15 });
      }
    },
    {
      id: "escena_08_cierre",
      title: "Cierre y Transición al Capítulo 2",
      narration: "Ahora que conocemos el lienzo dual de trabajo, ¿qué pasa cuando la inspiración llega más rápido de lo que podemos teclear? En el próximo capítulo veremos el Motor de Voz Local con Whisper: dictado continuo, medidor de señal en tiempo real y captura rápida de pensamientos sin tocar el teclado. ¡Nos vemos en el Capítulo 2!",
      action: async (page, durationMs, mcp) => {
        const micBtn = await page.$('button[title*="Dictado"], button[title*="Micrófono"], button[title*="Microfono"]');
        if (micBtn) {
          try {
            const box = await micBtn.boundingBox();
            if (box) {
              await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
            }
          } catch (e) {}
        }
      }
    }
  ]
};
