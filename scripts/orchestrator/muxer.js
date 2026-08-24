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
  const millis = Math.round(ms % 1000);

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

  // 1. Crear archivo de lista de audios para FFmpeg en orden estricto
  const concatContent = audioFiles
    .map(f => `file '${path.resolve(f)}'`)
    .join('\n');
  fs.writeFileSync(concatListPath, concatContent, 'utf8');

  // 2. Concatenar audios convirtiendo a PCM s16le estéreo para evitar desincronizaciones de sample rate
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -ar 44100 -ac 2 -c:a pcm_s16le "${masterAudioPath}"`, { stdio: 'pipe' });

  // 3. Generar SRT con marcas de tiempo precisas
  const finalSrtPath = srtPath || path.join(tempDir, 'subtitles.srt');
  generateSrtFile(timeline, finalSrtPath);

  // 4. Obtener la duración exacta del audio master en segundos
  const durationOutput = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${masterAudioPath}"`, { encoding: 'utf8' }).trim();
  const audioDurationSec = parseFloat(durationOutput);

  // 5. Muxing final con FFmpeg:
  // - tpad clona el último fotograma si el vídeo terminase milisegundos antes que el audio
  // - -t ${audioDurationSec} asegura que el MP4 final dure exactamente lo mismo que la locución completa
  const cmd = `ffmpeg -y -i "${rawVideoPath}" -i "${masterAudioPath}" -filter_complex "[0:v]tpad=stop_mode=clone:stop_duration=10,fps=30[v]" -map "[v]" -map 1:a -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${audioDurationSec} "${outputPath}"`;
  
  execSync(cmd, { stdio: 'pipe' });

  return {
    videoOutput: outputPath,
    audioOutput: masterAudioPath,
    srtOutput: finalSrtPath,
    durationSeconds: audioDurationSec
  };
}
