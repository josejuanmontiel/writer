/**
 * Coreografía Automatizada para el Capítulo 4:
 * «Bandeja de Ideas Flotantes & Semáforos de Madurez»
 */

export const chapter4Data = {
  chapterNumber: 4,
  title: "Bandeja de Ideas Flotantes & Semáforos de Madurez",
  scenes: [
    {
      id: "escena_01_apertura",
      title: "Capturar sin interrumpir el flujo",
      narration: "¿Cuántas ideas brillantes se pierden porque en el momento en que se te ocurren no sabes exactamente dónde colocarlas? En Antigravity Writer dispones de la Bandeja de Ideas Flotantes: un espacio seguro donde volcar dinámicas, reflexiones o lecciones enteras sin la presión de asignarles una fecha inmediata.",
      action: async (page, durationMs, mcp) => {
        await page.keyboard.press('Escape');
        await page.mouse.move(150, 450, { steps: 20 });
      }
    },
    {
      id: "escena_02_crear_idea_flotante",
      title: "Creación de una Idea Flotante por Texto o Dictado",
      narration: "Pulsamos el botón de añadir idea flotante o grabamos una nota rápida por voz. Escribimos la actividad libremente. El sistema la guarda en la carpeta content/unassigned y el motor GLiNER2 extrae de inmediato sus conceptos clave.",
      action: async (page, durationMs, mcp) => {
        const addFloatingBtn = await page.$('button[title*="flotante"], button[title*="Flotante"], button:has-text("+")');
        if (addFloatingBtn) {
          await addFloatingBtn.click();
          await page.waitForTimeout(800);
          await page.keyboard.press('Escape');
        }
        await page.mouse.move(150, 500, { steps: 20 });
      }
    },
    {
      id: "escena_03_semaforos_madurez",
      title: "Los Semáforos de Madurez (Readiness Badges)",
      narration: "Observa los semáforos de madurez en cada idea. La insignia verde nos indica que todos los conceptos previos necesarios para esta lección ya han sido explicados en clases anteriores. La insignia amarilla nos alerta: la idea requiere conocimientos que tus alumnos aún no han recibido. Y la insignia morada marca conceptos autónomos o introductorios.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(180, 480, { steps: 20 });
        await page.waitForTimeout(1500);
        await page.mouse.move(180, 520, { steps: 20 });
      }
    },
    {
      id: "escena_04_inspeccion_dependencias",
      title: "Inspección de Dependencias Faltantes",
      narration: "Al hacer clic sobre una idea bloqueada, el sistema nos muestra con exactitud qué eslabones conceptuales nos faltan por construir en el temario. De esta forma, nunca improvisarás una clase que tus estudiantes no estén preparados para entender.",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(180, 500, { steps: 20 });
        await page.waitForTimeout(1000);
      }
    },
    {
      id: "escena_05_cierre",
      title: "Cierre y Transición al Capítulo 5",
      narration: "Pero, ¿qué sucede si mientras redactas una clase te das cuenta de que te has desviado del tema principal con una digresión interesante? En el Capítulo 5 veremos cómo podar párrafos y convertirlos en ideas flotantes con un solo clic. ¡Nos vemos allí!",
      action: async (page, durationMs, mcp) => {
        await page.mouse.move(600, 300, { steps: 25 });
      }
    }
  ]
};
