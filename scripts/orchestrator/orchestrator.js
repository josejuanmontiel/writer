import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { generateSpeechForScene } from './tts_engine.js';
import { MCPClient } from './mcp_client.js';
import { muxVideoAndAudio } from './muxer.js';

import { chapter1Data } from './chapters/chapter_1.js';
import { chapter2Data } from './chapters/chapter_2.js';
import { chapter3Data } from './chapters/chapter_3.js';
import { chapter4Data } from './chapters/chapter_4.js';
import { chapter5Data } from './chapters/chapter_5.js';
import { chapter6Data } from './chapters/chapter_6.js';
import { chapter7Data } from './chapters/chapter_7.js';
import { chapter8Data } from './chapters/chapter_8.js';
import { chapter9Data } from './chapters/chapter_9.js';
import { chapter10Data } from './chapters/chapter_10.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

const CHAPTER_REGISTRY = {
  1: chapter1Data,
  2: chapter2Data,
  3: chapter3Data,
  4: chapter4Data,
  5: chapter5Data,
  6: chapter6Data,
  7: chapter7Data,
  8: chapter8Data,
  9: chapter9Data,
  10: chapter10Data
};

/**
 * Inyecta mocks seguros de Wails si se ejecuta en navegador independiente fuera del runtime Go Wails
 */
async function injectWailsMocks(page) {
  await page.addInitScript(() => {
    if (!window.go) {
      window.go = {
        main: {
          App: new Proxy({}, {
            get: function(target, prop) {
              return function(...args) {
                console.log(`[Wails Mock Proxy] App.${prop} called with:`, args);
                if (prop === 'GetConfig') {
                  return Promise.resolve(JSON.stringify({ workspaces: [], current_workspace: "" }));
                }
                if (prop === 'GetAudioDevices') {
                  return Promise.resolve(["Default Microphone"]);
                }
                if (prop === 'GetAvailableWhisperModels') {
                  return Promise.resolve(["tiny", "base", "small"]);
                }
                if (prop === 'GetDownloadedWhisperModels') {
                  return Promise.resolve(["tiny", "base"]);
                }
                if (prop === 'GetDiagramSteps') {
                  return Promise.resolve(JSON.stringify([]));
                }
                if (prop === 'GetInitialSessionState') {
                  return Promise.resolve({ status: "idle", progress: 0 });
                }
                if (prop === 'SelectFolderDialog') {
                  return Promise.resolve("/home/jose/cursos/Curso de Piloto de Antigravedad");
                }
                if (prop === 'GetActiveCompendium') {
                  return Promise.resolve({ name: "Curso de Piloto de Antigravedad", path: "/home/jose/workspace" });
                }
                if (prop === 'GetRecentCompendiums') {
                  return Promise.resolve([{ name: "Curso de Piloto de Antigravedad", path: "/home/jose/workspace" }]);
                }
                if (prop === 'GetCompendiumTree') {
                  return Promise.resolve({
                    name: "Curso de Piloto de Antigravedad",
                    path: "/home/jose/workspace",
                    modules: [
                      {
                        name: "modulo-1",
                        title: "Módulo 1: Fundamentos",
                        files: [
                          { name: "sesion-01.adoc", title: "Sesión 1: Motores de Antigravedad", path: "content/modulo-1/sesion-01.adoc" }
                        ]
                      }
                    ],
                    unassigned: [
                      { name: "dinamica-perdon.adoc", title: "Dinámica del Perdón", path: "content/unassigned/dinamica-perdon.adoc", readiness: "ready" },
                      { name: "liturgia-eucaristica.adoc", title: "Liturgia Eucarística", path: "content/unassigned/liturgia-eucaristica.adoc", readiness: "blocked" }
                    ]
                  });
                }
                if (prop === 'ReadCompendiumFile') {
                  return Promise.resolve("= Sesión 1: Motores de Antigravedad\n\nBienvenidos al curso de pilotaje de naves con motores de antigravedad.");
                }
                return Promise.resolve({});
              };
            }
          })
        }
      };

      const genericMock = {
        get: function(target, prop) {
          return function(...args) {
            if (prop.startsWith('EventsOn') || prop.startsWith('EventsOnce')) {
              return () => {};
            }
            return Promise.resolve({});
          };
        }
      };

      window.wails = new Proxy({}, genericMock);
      window.runtime = new Proxy({}, genericMock);
    }
  });
}

/**
 * Ejecuta la producción completa de un capítulo
 */
async function processChapter(chapterNum, options = {}) {
  const chapterData = CHAPTER_REGISTRY[chapterNum];
  if (!chapterData) {
    console.error(`❌ El Capítulo ${chapterNum} aún no tiene coreografía registrada.`);
    return false;
  }

  const outputDir = path.join(ROOT_DIR, `docs/tutorials/capitulo_${chapterNum}/output`);
  const audioDir = path.join(outputDir, 'audio_clips');
  const rawVideoDir = path.join(outputDir, 'raw_video');

  // Limpiar directorios previos
  if (fs.existsSync(rawVideoDir)) {
    fs.rmSync(rawVideoDir, { recursive: true, force: true });
  }
  fs.mkdirSync(audioDir, { recursive: true });
  fs.mkdirSync(rawVideoDir, { recursive: true });

  console.log(`\n======================================================`);
  console.log(`🎬 INICIANDO PRODUCCIÓN AUTOMATIZADA — CAPÍTULO ${chapterNum}`);
  console.log(`📌 Título: ${chapterData.title}`);
  console.log(`======================================================\n`);

  // 1. GENERACIÓN DE AUDIOS (KOKORO TTS / FALLBACK)
  console.log(`🎙️ [FASE 1/3] Sintetizando locuciones y calculando duraciones milimétricas...`);
  const audioFiles = [];
  const timeline = [];
  let currentAccumulatedMs = 0;

  for (let i = 0; i < chapterData.scenes.length; i++) {
    const scene = chapterData.scenes[i];
    const audioPath = path.join(audioDir, `scene_${String(i + 1).padStart(2, '0')}.mp3`);

    console.log(`   [Escena ${i + 1}/${chapterData.scenes.length}] "${scene.title}"`);
    const audioResult = await generateSpeechForScene(scene.narration, audioPath, options.voice || 'em_alex');
    console.log(`   └─ Audio generado (${audioResult.engine}): ${(audioResult.durationMs / 1000).toFixed(2)}s`);

    audioFiles.push(audioResult.outputPath);

    timeline.push({
      id: scene.id,
      index: i + 1,
      title: scene.title,
      narration: scene.narration,
      startMs: currentAccumulatedMs,
      endMs: currentAccumulatedMs + audioResult.durationMs,
      durationMs: audioResult.durationMs
    });

    currentAccumulatedMs += audioResult.durationMs;
  }

  const timelinePath = path.join(outputDir, 'timeline.json');
  fs.writeFileSync(timelinePath, JSON.stringify(timeline, null, 2), 'utf8');
  console.log(`\n⏱️ Timeline total del capítulo: ${(currentAccumulatedMs / 1000).toFixed(2)} segundos (${timeline.length} escenas)\n`);

  // 2. NAVEGACIÓN Y GRABACIÓN CON PLAYWRIGHT + MCP
  console.log(`🎥 [FASE 2/3] Lanzando navegador Playwright y grabando pantalla...`);
  const appUrl = options.url || 'http://localhost:5173';
  const mcp = new MCPClient(options.mcpUrl || 'http://localhost:3000');
  await mcp.connect();

  const browser = await chromium.launch({
    headless: options.headless !== false
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    recordVideo: {
      dir: rawVideoDir,
      size: { width: 1366, height: 768 }
    }
  });

  const pageCreatedTime = Date.now();
  const page = await context.newPage();
  const video = page.video();
  await injectWailsMocks(page);

  console.log(`   🌐 Abriendo aplicación en ${appUrl}...`);
  await page.goto(appUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Momento exacto en que comienza la primera escena de la masterclass
  const chapterStartTime = Date.now();
  const startOffsetSec = (chapterStartTime - pageCreatedTime) / 1000;

async function dismissAnyModal(page) {
  try {
    const closeButtons = await page.$$('button:has(svg.lucide-x), button[aria-label="Cerrar"], button:has-text("Cerrar")');
    for (const btn of closeButtons) {
      if (await btn.isVisible()) {
        await btn.click({ force: true }).catch(() => {});
      }
    }
  } catch (e) {}
  try {
    await page.keyboard.press('Escape');
  } catch (e) {}
}

  // Ejecutar coreografía con Absolute Wall-Clock Scheduler (cero deriva acumulativa)
  for (let i = 0; i < chapterData.scenes.length; i++) {
    const scene = chapterData.scenes[i];
    const sceneTimeline = timeline[i];
    const targetEndTime = chapterStartTime + sceneTimeline.endMs;

    console.log(`   ▶️ Grabando Escena ${i + 1}: ${scene.title} [${(sceneTimeline.durationMs / 1000).toFixed(2)}s]`);
    try {
      await scene.action(page, sceneTimeline.durationMs, mcp);
    } catch (actionErr) {
      console.warn(`   ⚠️ Advertencia en acción de Escena ${i + 1}: ${actionErr.message}`);
    }

    // Esperar exactamente hasta la marca de tiempo objetivo de la escena
    const waitNeeded = targetEndTime - Date.now();
    if (waitNeeded > 0) {
      await page.waitForTimeout(waitNeeded);
    }
  }

  // Cerrar página y contexto para que Playwright finalice el archivo de vídeo .webm
  await page.close();
  await context.close();
  await browser.close();

  // Obtener la ruta exacta del vídeo generado en esta sesión
  const rawVideoPath = await video.path();
  console.log(`   ✅ Vídeo crudo grabado: ${rawVideoPath}`);

  // 3. MUXING FINAL CON FFMPEG + GENERACIÓN SRT
  console.log(`\n🎞️ [FASE 3/3] Muxeando audio sincronizado con volumen +80% / -14 LUFS, vídeo 1080p y subtítulos SRT...`);
  const finalMp4Path = path.join(outputDir, `capitulo_${chapterNum}_masterclass.mp4`);
  const finalSrtPath = path.join(outputDir, `capitulo_${chapterNum}_subtitulos.srt`);

  const muxResult = muxVideoAndAudio({
    rawVideoPath,
    audioFiles,
    timeline,
    outputPath: finalMp4Path,
    srtPath: finalSrtPath,
    startOffsetSec
  });

  console.log(`\n======================================================`);
  console.log(`🎉 CAPÍTULO ${chapterNum} COMPLETADO CON ÉXITO!`);
  console.log(`📹 Vídeo Final: ${muxResult.videoOutput} (${muxResult.durationSeconds.toFixed(2)}s)`);
  console.log(`🎵 Audio Master: ${muxResult.audioOutput}`);
  console.log(`💬 Subtítulos: ${muxResult.srtOutput}`);
  console.log(`======================================================\n`);

  return true;
}

// CLI Runner
async function main() {
  const args = process.argv.slice(2);
  let runAll = false;
  let targetChapter = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--all') {
      runAll = true;
    } else if (args[i] === '--chapter' && args[i + 1]) {
      targetChapter = parseInt(args[i + 1], 10);
    }
  }

  try {
    if (runAll) {
      console.log(`🚀 LANZANDO PRODUCCIÓN COMPLETA DE LOS 10 CAPÍTULOS...`);
      for (let ch = 1; ch <= 10; ch++) {
        await processChapter(ch);
      }
      console.log(`\n🏆 ¡LOS 10 CAPÍTULOS DE LA MASTERCLASS HAN SIDO PRODUCIDOS CON ÉXITO!`);
    } else {
      await processChapter(targetChapter);
    }
  } catch (err) {
    console.error('❌ Error en la ejecución del orquestador:', err);
    process.exit(1);
  }
}

main();
