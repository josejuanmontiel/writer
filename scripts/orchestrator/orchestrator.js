import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { generateSpeechForScene } from './tts_engine.js';
import { MCPClient } from './mcp_client.js';
import { muxVideoAndAudio } from './muxer.js';
import { chapter1Data } from './chapters/chapter_1.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

const CHAPTER_REGISTRY = {
  1: chapter1Data
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
                  return Promise.resolve("/home/jose/workspace");
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
                    unassigned: []
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

  // Limpiar directorios previos para garantizar que no haya archivos residuales de ejecuciones antiguas
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

  const page = await context.newPage();
  const video = page.video();
  await injectWailsMocks(page);

  console.log(`   🌐 Abriendo aplicación en ${appUrl}...`);
  await page.goto(appUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Ejecutar coreografía escena por escena en orden estricto
  for (let i = 0; i < chapterData.scenes.length; i++) {
    const scene = chapterData.scenes[i];
    const sceneTimeline = timeline[i];

    console.log(`   ▶️ Grabando Escena ${i + 1}: ${scene.title} [${(sceneTimeline.durationMs / 1000).toFixed(2)}s]`);
    await scene.action(page, sceneTimeline.durationMs, mcp);
  }

  // Pequeña pausa final antes de cerrar
  await page.waitForTimeout(1000);

  // Cerrar página y contexto para que Playwright finalice el archivo de vídeo .webm
  await page.close();
  await context.close();
  await browser.close();

  // Obtener la ruta exacta del vídeo generado en esta sesión
  const rawVideoPath = await video.path();
  console.log(`   ✅ Vídeo crudo grabado: ${rawVideoPath}`);

  // 3. MUXING FINAL CON FFMPEG + GENERACIÓN SRT
  console.log(`\n🎞️ [FASE 3/3] Muxeando audio sincronizado, vídeo 1080p y subtítulos SRT...`);
  const finalMp4Path = path.join(outputDir, `capitulo_${chapterNum}_masterclass.mp4`);
  const finalSrtPath = path.join(outputDir, `capitulo_${chapterNum}_subtitulos.srt`);

  const muxResult = muxVideoAndAudio({
    rawVideoPath,
    audioFiles,
    timeline,
    outputPath: finalMp4Path,
    srtPath: finalSrtPath
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
  let targetChapter = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--chapter' && args[i + 1]) {
      targetChapter = parseInt(args[i + 1], 10);
    }
  }

  try {
    await processChapter(targetChapter);
  } catch (err) {
    console.error('❌ Error en la ejecución del orquestador:', err);
    process.exit(1);
  }
}

main();
