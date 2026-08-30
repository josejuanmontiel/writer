import { test, expect } from '@playwright/test';

test.describe('Antigravity Writer - Web Browser E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Configurar API Key de Gemini en localStorage antes de cada test para asegurar conexión
    const apiKey = process.env.GEMINI_API_KEY || '';
    await page.addInitScript((key) => {
      const cfg = {
        last_compendium_path: 'eco-de-vida-memorias',
        last_opened_file: 'recuerdos/infancia-pueblo.adoc',
        profile: 'memoirs',
        llm: {
          provider: 'gemini',
          url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
          api_key: key,
          model: 'gemini-3.6-flash',
          temperature: 0.3
        }
      };
      localStorage.setItem('antigravity_writer_config', JSON.stringify(cfg));
      localStorage.setItem('antigravity_profile', 'memoirs');
    }, apiKey);

    await page.goto('/');
  });

  test('1. Debe cargar la aplicación web y mostrar el entorno con el compendio semilla', async ({ page }) => {
    // Verificar que el header está presente
    await expect(page.locator('header')).toBeVisible();

    // Verificar selector de perfiles (Memorias, Manuales, Ficción)
    await expect(page.getByRole('button', { name: 'Memorias' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manuales' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ficción' })).toBeVisible();

    // Verificar botón de descarga ZIP en modo web
    await expect(page.getByRole('button', { name: /Descargar ZIP|Exportar ZIP/i })).toBeVisible();

    // Verificar que el editor TipTap está listo
    await expect(page.locator('.tiptap')).toBeVisible();
  });

  test('2. Debe permitir cambiar de perfil dinámicamente adaptando botones y vistas', async ({ page }) => {
    // 1. Cambiar a Manuales
    await page.getByRole('button', { name: 'Manuales' }).click();
    await expect(page.locator('header').getByRole('button', { name: 'Grafo 2.0' })).toBeVisible();
    // El botón 'Evocar Recuerdo' no debe estar en Manuales
    await expect(page.getByRole('button', { name: /Evocar Recuerdo/i })).not.toBeVisible();

    // 2. Cambiar a Ficción
    await page.getByRole('button', { name: 'Ficción' }).click();
    await expect(page.getByRole('button', { name: 'Ficción' })).toHaveClass(/bg-purple-600/);

    // 3. Volver a Memorias (Eco de Vida)
    await page.getByRole('button', { name: 'Memorias' }).click();
    await expect(page.getByRole('button', { name: /Evocar Recuerdo/i })).toBeVisible();
    await expect(page.locator('header').getByRole('button', { name: 'Árbol' })).toBeVisible();
  });

  test('3. Flujo E2E Completo: Activador de Recuerdos ("Eco de Vida") con Gemini API', async ({ page }) => {
    // Asegurar que estamos en perfil Memorias
    await page.getByRole('button', { name: 'Memorias' }).click();

    // Abrir el Activador de Recuerdos
    const evokerBtn = page.getByRole('button', { name: /Evocar Recuerdo/i });
    await expect(evokerBtn).toBeVisible();
    await evokerBtn.click();

    // Verificar que el modal de Recuerdos se ha abierto
    await expect(page.getByText('Activador de Recuerdos & Memorias')).toBeVisible();
    await expect(page.getByText('Eco de Vida')).toBeVisible();

    // Seleccionar el tema "Infancia y el Pueblo Natal"
    const childhoodTheme = page.getByRole('button', { name: /Infancia y el Pueblo Natal/i });
    await expect(childhoodTheme).toBeVisible();
    await childhoodTheme.click();

    // Esperar a que Gemini genere las preguntas evocadoras y el prompt visual
    await expect(page.getByText('PREGUNTAS SUGERIDAS:')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('PROMPT DE IMAGEN NOSTÁLGICA')).toBeVisible();

    // Rellenar el recuerdo personal
    const textarea = page.locator('textarea');
    await textarea.fill('Recuerdo el olor a leña de las mañanas de invierno y cómo mi abuela horneaba galletas de canela.');

    // Guardar el recuerdo en el capítulo activo
    const saveMemoryBtn = page.getByRole('button', { name: /Guardar Recuerdo en el Capítulo/i });
    await expect(saveMemoryBtn).toBeVisible();
    await saveMemoryBtn.click();

    // Verificar que el modal se cierra y el texto aparece en el editor TipTap
    await expect(page.getByText('Activador de Recuerdos & Memorias')).not.toBeVisible();
    await expect(page.locator('.tiptap')).toContainText('galletas de canela');
  });

  test('4. Debe persistir los cambios en IndexedDB y permitir navegación entre archivos', async ({ page }) => {
    // Escribir un texto identificativo en el editor
    const editor = page.locator('.tiptap');
    await editor.click();
    await page.keyboard.type(' Test de Persistencia Web IndexedDB.');

    // Hacer clic en Guardar
    const saveBtn = page.getByRole('button', { name: /Guardar/i }).first();
    await saveBtn.click();

    // Recargar la página
    await page.reload();

    // Comprobar que el contenido persiste tras el reload
    await expect(page.locator('.tiptap')).toContainText('Test de Persistencia Web IndexedDB');
  });

  test('5. Debe permitir la descarga del compendio en formato ZIP', async ({ page }) => {
    // Escuchar el evento de descarga del navegador
    const downloadPromise = page.waitForEvent('download');
    
    const zipBtn = page.getByRole('button', { name: /Descargar ZIP/i });
    await zipBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/i);
  });

  test('6. Debe abrir el Modo Kiosco / Tablet para Mayores (Senior UI) y mostrar interfaz accesible', async ({ page }) => {
    await page.getByRole('button', { name: 'Memorias' }).click();

    const kioskBtn = page.getByRole('button', { name: /Modo Kiosco \/ Tablet/i });
    await expect(kioskBtn).toBeVisible();
    await kioskBtn.click();

    // Comprobar elementos de accesibilidad del Modo Kiosco
    await expect(page.getByText('Modo Mayor & Tablet')).toBeVisible();
    await expect(page.getByText('¿De qué momento te gustaría hablar hoy?')).toBeVisible();

    // Seleccionar tema "Mi Pueblo y la Infancia"
    await page.getByRole('button', { name: /Mi Pueblo y la Infancia/i }).click();

    // Comprobar tarjeta de Julián y postal ilustrada
    await expect(page.getByText('Julián (Tu Acompañante)')).toBeVisible();
    await expect(page.getByText('Postal Ilustrada de Tu Época')).toBeVisible();
    await expect(page.getByRole('button', { name: /Toca para Hablar|Detener y Escuchar/i })).toBeVisible();

    // Salir del modo kiosco
    await page.getByRole('button', { name: /Salir del Modo Kiosco/i }).click();
    await expect(page.getByText('Modo Mayor & Tablet')).not.toBeVisible();
  });

  test('7. Debe gestionar Fichas de Personajes y Arcos Argumentales en el perfil de Ficción', async ({ page }) => {
    // Cambiar a perfil Ficción
    await page.getByRole('button', { name: 'Ficción' }).click();

    // Abrir Personajes & Arcos
    const charBtn = page.getByRole('button', { name: /Personajes & Arcos/i });
    await expect(charBtn).toBeVisible();
    await charBtn.click();

    // Comprobar modal de Dramatis Personae
    await expect(page.getByText('Dramatis Personae & Arcos Argumentales')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mateo Valdés' })).toBeVisible();

    // Insertar ficha de personaje en el editor
    const insertBtn = page.getByRole('button', { name: /Insertar Ficha en el Manuscrito/i });
    await expect(insertBtn).toBeVisible();
    await insertBtn.click();

    // Comprobar que el modal se cierra y el texto aparece en el editor
    await expect(page.getByText('Dramatis Personae & Arcos Argumentales')).not.toBeVisible();
    await expect(page.locator('.tiptap')).toContainText('Mateo Valdés');
  });

  test('8. Debe validar la configuración del manifiesto PWA para instalación en tablet/móvil', async ({ page }) => {
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.status()).toBe(200);

    const manifest = await manifestResponse.json();
    expect(manifest.name).toContain('Antigravity Writer');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

});

