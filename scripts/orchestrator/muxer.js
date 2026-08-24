import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Formatea milisegundos a formato de tiempo SRT (HH:MM:SS,mmm)
 */
function msToSrtTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;

  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
}

/**
 * Genera un archivo de subtítulos SRT a partir del timeline de escenas
 */
export function generateSrtFile(timeline, outputSrtPath) {
  let srtContent = '';
  timeline.forEach((scene, index) => {
    const start = msToSrtTime(scene.startMs);
    const end = msToSrtTime(scene.endMs);
    srtContent += `${index + 1}\n${start} --> ${end}\n${scene.narration}\n\n`;
  });

  fs.writeFileSync(outputSrtPath, srtContent.trim() + '\n', 'utf8');
  return outputSrtPath;
}

/**
 * Muxea el vídeo crudo grabado por Playwright con las pistas de audio generadas y subtítulos
 */
export function muxVideoAndAudio({ rawVideoPath, audioFiles, timeline, outputPath, srtPath }) {
  const tempDir = path.dirname(outputPath);
  const concatListPath = path.join(tempDir, 'audio_concat_list.txt');
  const masterAudioPath = path.join(tempDir, 'master_audio.wav');

  // 1. Crear archivo de lista de audios para FFmpeg
  const concatContent = audioFiles
    .map(f => `file '${path.resolve(f)}'`)
    .join('\n');
  fs.writeFileSync(concatListPath, concatContent, 'utf8');

  // 2. Concatenar audios
  try {
    execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${masterAudioPath}"`, { stdio: 'pipe' });
  } catch (e) {
    // Si falla copy por diferentes codecs, re-encodear
    execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:a pcm_s16le "${masterAudioPath}"`, { stdio: 'pipe' });
  }

  // 3. Generar SRT si no se proporcionó ruta existente
  const finalSrtPath = srtPath || path.join(tempDir, 'subtitles.srt');
  generateSrtFile(timeline, finalSrtPath);

  // 4. Muxing final con FFmpeg
  // Ajustamos el vídeo al audio (shortest=0, extendiendo último frame si fuera necesario)
  const cmd = `ffmpeg -y -i "${rawVideoPath}" -i "${masterAudioPath}" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${outputPath}"`;
  
  execSync(cmd, { stdio: 'pipe' });

  return {
    videoOutput: outputPath,
    audioOutput: masterAudioPath,
    srtOutput: finalSrtPath
  };
}
