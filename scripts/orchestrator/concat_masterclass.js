import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

const CHAPTERS_META = [
  { num: 1, title: "Introducción y Paradigma: «Escribir sin miedo al orden»" },
  { num: 2, title: "Motor de Voz Local & Dictado con Whisper" },
  { num: 3, title: "Extracción Semántica & Grafos con GLiNER2" },
  { num: 4, title: "Bandeja de Ideas Flotantes & Semáforos de Madurez" },
  { num: 5, title: "Extracción de Selección a Idea Flotante (Selection-to-Floating-Idea)" },
  { num: 6, title: "Asistente de Reubicación por Dependencias (Icono 🧭)" },
  { num: 7, title: "Matriz de Coherencia Curricular (Heatmap)" },
  { num: 8, title: "IdeaGraph 2.0 & Validador Curricular" },
  { num: 9, title: "Derivación de Audiencias & Calidad de Contenido" },
  { num: 10, title: "Compendium Wizard, Prompt Studio y Git Sync" }
];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function msToSrtTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.round(ms % 1000);

  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
}

function parseSrtTime(timeStr) {
  const [hms, ms] = timeStr.trim().split(',');
  const [h, m, s] = hms.split(':').map(Number);
  return (h * 3600 + m * 60 + s) * 1000 + Number(ms);
}

function buildUnifiedMasterclass() {
  console.log(`======================================================`);
  console.log(`🎬 UNIFICANDO LOS 10 CAPÍTULOS EN LA MASTERCLASS COMPLETA`);
  console.log(`======================================================\n`);

  const tutorialsDir = path.join(ROOT_DIR, 'docs/tutorials');
  const concatListPath = path.join(tutorialsDir, 'masterclass_video_concat.txt');
  const finalVideoPath = path.join(tutorialsDir, 'masterclass_completa_antigravity_writer.mp4');
  const finalSrtPath = path.join(tutorialsDir, 'masterclass_completa_subtitulos.srt');
  const youtubeDescPath = path.join(tutorialsDir, 'YOUTUBE_DESCRIPCION.md');

  const videoListLines = [];
  const chaptersTimecodes = [];
  let currentAccumulatedSeconds = 0;
  let fullUnifiedSrt = '';
  let globalSubtitleIndex = 1;

  for (const ch of CHAPTERS_META) {
    const chOutputDir = path.join(tutorialsDir, `capitulo_${ch.num}/output`);
    const mp4Path = path.join(chOutputDir, `capitulo_${ch.num}_masterclass.mp4`);
    const srtPath = path.join(chOutputDir, `capitulo_${ch.num}_subtitulos.srt`);

    if (!fs.existsSync(mp4Path)) {
      throw new Error(`No se encontró el vídeo del Capítulo ${ch.num}: ${mp4Path}`);
    }

    const durationStr = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${mp4Path}"`,
      { encoding: 'utf8' }
    ).trim();
    const duration = parseFloat(durationStr);

    chaptersTimecodes.push({
      num: ch.num,
      title: ch.title,
      startSeconds: currentAccumulatedSeconds,
      startTimeFormatted: formatTime(currentAccumulatedSeconds),
      duration: duration
    });

    videoListLines.push(`file '${path.resolve(mp4Path)}'`);

    // Procesar subtítulos SRT con desplazamiento temporal acumulado
    if (fs.existsSync(srtPath)) {
      const srtContent = fs.readFileSync(srtPath, 'utf8');
      const blocks = srtContent.trim().split(/\n\s*\n/);

      for (const block of blocks) {
        const lines = block.split('\n');
        if (lines.length >= 3) {
          const timeMatch = lines[1].match(/(.*)\s+-->\s+(.*)/);
          if (timeMatch) {
            const blockStartMs = parseSrtTime(timeMatch[1]) + (currentAccumulatedSeconds * 1000);
            const blockEndMs = parseSrtTime(timeMatch[2]) + (currentAccumulatedSeconds * 1000);
            const text = lines.slice(2).join('\n');

            fullUnifiedSrt += `${globalSubtitleIndex++}\n${msToSrtTime(blockStartMs)} --> ${msToSrtTime(blockEndMs)}\n${text}\n\n`;
          }
        }
      }
    }

    currentAccumulatedSeconds += duration;
  }

  // 1. Guardar lista de concatenación
  fs.writeFileSync(concatListPath, videoListLines.join('\n'), 'utf8');

  // 2. Concatenar vídeos MP4 con FFmpeg
  console.log(`🎞️ Concatenando pistas de vídeo y audio en ${finalVideoPath}...`);
  try {
    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${finalVideoPath}"`,
      { stdio: 'pipe' }
    );
  } catch (err) {
    console.log(`   (Re-encodeando con libx264 para garantizar continuidad de timestamps...)`);
    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k "${finalVideoPath}"`,
      { stdio: 'pipe' }
    );
  }

  // 3. Guardar subtítulos unificados
  fs.writeFileSync(finalSrtPath, fullUnifiedSrt.trim() + '\n', 'utf8');

  // 4. Generar descripción de YouTube
  let ytContent = `# 🚀 Antigravity Writer — Masterclass Completa: De la Idea al Compendio Editorial\n\n`;
  ytContent += `Aprende a dominar **Antigravity Writer**, el entorno de autoría pedagógica con inteligencia artificial 100% local (Whisper, GLiNER2, Grafos de Conocimiento, Matriz Curricular y Control de Versiones Git).\n\n`;
  ytContent += `### ⏱️ Marcas de Tiempo / Capítulos de YouTube\n\n`;
  for (const tc of chaptersTimecodes) {
    ytContent += `${tc.startTimeFormatted} Capítulo ${tc.num}: ${tc.title}\n`;
  }
  ytContent += `\n### 🔗 Enlaces y Repositorio del Proyecto\n`;
  ytContent += `- 🐙 GitHub / Código Fuente: https://github.com/josejuanmontiel/writer\n`;
  ytContent += `- 📖 Manual de Usuario y Documentación: https://github.com/josejuanmontiel/writer/blob/main/docs/MANUAL_DE_USUARIO.md\n`;
  ytContent += `- 🛠️ Guía de Videotutoriales: https://github.com/josejuanmontiel/writer/blob/main/docs/VIDEOTUTORIALES_Y_MASTERCLASS.md\n\n`;
  ytContent += `### 🏷️ Etiquetas / Tags\n`;
  ytContent += `#AntigravityWriter #Productividad #EscrituraCreativa #WhisperLocal #GLiNER #Educacion #Git #AsciiDoc #IAoffline\n`;

  fs.writeFileSync(youtubeDescPath, ytContent, 'utf8');

  console.log(`\n======================================================`);
  console.log(`🎉 MASTERCLASS COMPLETA UNIFICADA CON ÉXITO!`);
  console.log(`📹 Vídeo Completo: ${finalVideoPath} (${formatTime(currentAccumulatedSeconds)} / ${currentAccumulatedSeconds.toFixed(2)}s)`);
  console.log(`💬 Subtítulos Globales: ${finalSrtPath}`);
  console.log(`📝 Ficha YouTube: ${youtubeDescPath}`);
  console.log(`======================================================\n`);

  return {
    videoPath: finalVideoPath,
    srtPath: finalSrtPath,
    youtubeDescPath: youtubeDescPath,
    chaptersTimecodes: chaptersTimecodes,
    totalSeconds: currentAccumulatedSeconds
  };
}

buildUnifiedMasterclass();
