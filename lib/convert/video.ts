// Load FFmpeg.wasm for video conversion
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let loaded = false;

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && loaded) return ffmpeg;
  
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    
    // Load FFmpeg with CDN URLs
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });
    
    await ffmpeg.load({
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`,
    });
    
    loaded = true;
  }
  
  return ffmpeg;
}

export async function convertVideo(
  inputBuffer: ArrayBuffer,
  fromFormat: string,
  toFormat: string,
  options: {
    quality?: number;
    audioOnly?: boolean;
  } = {}
): Promise<ArrayBuffer> {
  const ff = await loadFFmpeg();
  
  const inputName = `input.${fromFormat}`;
  const outputName = `output.${toFormat}`;
  
  // Write input file
  await ff.writeFile(inputName, new Uint8Array(inputBuffer));
  
  // Build FFmpeg command based on output format
  let args: string[] = ['-i', inputName];
  
  // Audio extraction (mp3, wav, ogg)
  if (['mp3', 'wav', 'ogg'].includes(toFormat)) {
    if (toFormat === 'mp3') {
      args.push('-acodec', 'libmp3lame', '-b:a', '192k');
    } else if (toFormat === 'wav') {
      args.push('-acodec', 'pcm_s16le');
    } else if (toFormat === 'ogg') {
      args.push('-acodec', 'libvorbis', '-q:a', '5');
    }
    args.push('-vn'); // No video
  }
  // Video conversions
  else if (toFormat === 'mp4') {
    args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23');
    args.push('-c:a', 'aac', '-b:a', '128k');
    args.push('-movflags', '+faststart');
  } else if (toFormat === 'webm') {
    args.push('-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0');
    args.push('-c:a', 'libopus', '-b:a', '128k');
  } else if (toFormat === 'avi') {
    args.push('-c:v', 'mpeg4', '-vtag', 'xvid', '-qscale:v', '5');
    args.push('-c:a', 'libmp3lame', '-b:a', '192k');
  } else if (toFormat === 'mov') {
    args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23');
    args.push('-c:a', 'aac', '-b:a', '128k');
    args.push('-movflags', '+faststart');
  } else if (toFormat === 'gif') {
    // Generate palette for better quality
    const paletteName = 'palette.png';
    await ff.exec([
      '-i', inputName,
      '-vf', 'fps=15,scale=480:-1:flags=lanczos,palettegen',
      paletteName
    ]);
    
    // Use palette to create GIF
    args = [
      '-i', inputName,
      '-i', paletteName,
      '-lavfi', 'fps=15,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse',
      '-loop', '0'
    ];
  }
  
  args.push(outputName);
  
  // Execute conversion
  await ff.exec(args);
  
  // Read output file
  const data = await ff.readFile(outputName);
  
  // Cleanup
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);
  if (toFormat === 'gif') {
    await ff.deleteFile('palette.png');
  }
  
  return data.buffer;
}

export async function cleanupFFmpeg() {
  if (ffmpeg) {
    ffmpeg.terminate();
    ffmpeg = null;
    loaded = false;
  }
}