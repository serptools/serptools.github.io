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
    onProgress?: (progress: { ratio: number; time: number }) => void;
  } = {}
): Promise<ArrayBuffer> {
  const ff = await loadFFmpeg();
  
  // Set up progress callback
  if (options.onProgress) {
    ff.on('progress', (event) => {
      options.onProgress?.(event);
    });
  }
  
  const inputName = `input.${fromFormat}`;
  const outputName = `output.${toFormat}`;
  
  // Write input file
  await ff.writeFile(inputName, new Uint8Array(inputBuffer));
  
  // Build FFmpeg command based on output format
  let args: string[] = ['-i', inputName];
  
  // For MKV to MOV/MP4 with H.264, we can use copy codec (super fast)
  const canUseCopyCodec = 
    fromFormat === 'mkv' && 
    ['mov', 'mp4'].includes(toFormat);
  
  if (canUseCopyCodec) {
    // Just copy streams without re-encoding (FAST - like your 2 second example)
    args.push('-c', 'copy');
    if (toFormat === 'mp4') {
      args.push('-movflags', '+faststart');
    }
  }
  // Audio extraction (mp3, wav, ogg)
  else if (['mp3', 'wav', 'ogg'].includes(toFormat)) {
    if (toFormat === 'mp3') {
      args.push('-acodec', 'libmp3lame', '-b:a', '192k');
    } else if (toFormat === 'wav') {
      args.push('-acodec', 'pcm_s16le');
    } else if (toFormat === 'ogg') {
      args.push('-acodec', 'libvorbis', '-q:a', '5');
    }
    args.push('-vn'); // No video
  }
  // Video conversions - optimized for speed
  else if (toFormat === 'mp4') {
    // Use ultrafast preset for speed, higher CRF for smaller file
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28');
    args.push('-c:a', 'aac', '-b:a', '128k');
    args.push('-movflags', '+faststart');
    // Limit resolution for faster processing
    args.push('-vf', 'scale=\'min(1280,iw)\':\'min(720,ih)\':force_original_aspect_ratio=decrease');
  } else if (toFormat === 'webm') {
    // Use faster VP8 instead of VP9
    args.push('-c:v', 'libvpx', '-crf', '30', '-b:v', '1M');
    args.push('-c:a', 'libvorbis', '-b:a', '128k');
    args.push('-vf', 'scale=\'min(1280,iw)\':\'min(720,ih)\':force_original_aspect_ratio=decrease');
  } else if (toFormat === 'avi') {
    args.push('-c:v', 'mpeg4', '-vtag', 'xvid', '-qscale:v', '8');
    args.push('-c:a', 'libmp3lame', '-b:a', '128k');
    args.push('-vf', 'scale=\'min(1280,iw)\':\'min(720,ih)\':force_original_aspect_ratio=decrease');
  } else if (toFormat === 'mov') {
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28');
    args.push('-c:a', 'aac', '-b:a', '128k');
    args.push('-movflags', '+faststart');
    args.push('-vf', 'scale=\'min(1280,iw)\':\'min(720,ih)\':force_original_aspect_ratio=decrease');
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
  
  console.log(`Output file size: ${data.length} bytes`);
  
  // Cleanup
  try {
    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);
    if (toFormat === 'gif') {
      await ff.deleteFile('palette.png');
    }
  } catch (cleanupErr) {
    console.warn('Cleanup error:', cleanupErr);
  }
  
  // Return the Uint8Array buffer
  return data instanceof Uint8Array ? data.buffer : data;
}

export async function cleanupFFmpeg() {
  if (ffmpeg) {
    ffmpeg.terminate();
    ffmpeg = null;
    loaded = false;
  }
}