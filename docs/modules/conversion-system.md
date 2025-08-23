# Conversion System

Core file conversion architecture including image processing, PDF handling, video conversion, and compression tools for the SerpTools.io application.

## Overview

The conversion system provides a unified, client-side interface for converting between various file formats. It uses Web Workers for processing, supports multiple conversion pipelines, and handles format-specific optimizations. All processing happens entirely in the browser with no server uploads, ensuring privacy and performance.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   UI Layer      │────▶│   Web Workers   │────▶│   Libraries     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                       │
   HeroConverter         convert.worker.ts        FFmpeg.wasm
   BatchHeroConverter    compress.worker.ts       PDF.js
   Converter.tsx                                  libheif
   ToolPageTemplate                               Browser APIs
```

### Component Hierarchy

The system uses multiple UI components for different use cases:

- **HeroConverter**: Single-file conversion with drag & drop interface
- **BatchHeroConverter**: Batch processing with ZIP download capability  
- **Converter**: Multi-file queue-based conversion with progress tracking
- **ToolPageTemplate**: Wrapper that integrates converters with tool pages

## Conversion Operations

### Operation Types

The system supports three primary conversion operations, automatically selected based on input and output formats:

| Operation | Description | Input Formats | Output Formats | Processing Library |
|-----------|-------------|---------------|----------------|-------------------|
| `raster` | Image-to-image conversion | JPG, PNG, WEBP, GIF, BMP, HEIC, HEIF, AVIF, ICO, SVG, TIFF | JPG, PNG, WEBP, GIF, BMP, AVIF | Browser APIs + libheif |
| `video` | Video/audio conversion | MP4, MKV, AVI, MOV, WEBM, FLV, etc. | MP4, WEBM, AVI, MOV, MP3, WAV, OGG, AAC, etc. | FFmpeg.wasm |
| `pdf-pages` | PDF to image conversion | PDF | JPG, PNG | PDF.js |
| `compress-png` | PNG compression/optimization | PNG | PNG (compressed) | Canvas API + algorithms |

### Operation Detection Logic

```typescript
// From workers/convert.worker.ts
const isVideo = ["mkv", "mp4", "webm", "avi", "mov"].includes(from) || 
                ["mp4", "webm", "avi", "mov", "gif", "mp3", "wav", "ogg"].includes(to);
const op = from === "pdf" ? "pdf-pages" : isVideo ? "video" : "raster";
```

### Capability Detection

The system includes runtime capability detection to handle different deployment modes:

```typescript
// From lib/capabilities.ts
export function detectCapabilities(): Capabilities {
  const buildMode = process.env.BUILD_MODE as 'static' | 'server' || 'static';
  const envSupportsVideo = process.env.SUPPORTS_VIDEO_CONVERSION === 'true';
  
  let supportsVideoConversion = false;
  let reason: string | undefined;
  
  if (!envSupportsVideo) {
    reason = 'Video conversion disabled in static build mode';
  } else {
    // Single-threaded FFmpeg works without SharedArrayBuffer
    supportsVideoConversion = true;
  }
  
  return {
    supportsVideoConversion,
    supportsSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    buildMode,
    reason,
  };
}
```

## Image Conversion

The image conversion system leverages browser-native APIs with specialized handling for modern formats like HEIC/HEIF.

### Decode Pipeline

The decode system uses a unified interface that delegates to format-specific handlers:

```typescript
// lib/convert/decode.ts
export type RGBA = { data: Uint8ClampedArray; width: number; height: number };

export async function decodeToRGBA(ext: string, buf: ArrayBuffer): Promise<RGBA> {
  const e = (ext || "").toLowerCase();

  if (e === "heic" || e === "heif") {
    return decodeHeifToRGBA(buf);
  }

  // Browser-native decoders handle: jpg/jpeg/png/webp/gif/bmp/avif/ico (varies by engine)
  const blob = new Blob([buf]);
  const bitmap = await createImageBitmap(blob).catch(() => {
    throw new Error("This format isn't natively supported by your browser.");
  });
  return bitmapToRGBA(bitmap);
}

async function bitmapToRGBA(bitmap: ImageBitmap): Promise<RGBA> {
  const useOffscreen = typeof OffscreenCanvas !== "undefined";
  const canvas: any = useOffscreen
    ? new OffscreenCanvas(bitmap.width, bitmap.height)
    : Object.assign(document.createElement("canvas"), { width: bitmap.width, height: bitmap.height });

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  const img = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  bitmap.close?.();
  return { data: img.data, width: img.width, height: img.height };
}
```

### Encode Pipeline

The encode system uses canvas APIs to convert RGBA data to various formats:

```typescript
// lib/convert/encode.ts
export async function encodeFromRGBA(
  toExt: string,
  rgba: RGBA,
  quality = 0.85
): Promise<Blob> {
  const useOffscreen = typeof OffscreenCanvas !== "undefined";
  const canvas: any = useOffscreen
    ? new OffscreenCanvas(rgba.width, rgba.height)
    : Object.assign(document.createElement("canvas"), { width: rgba.width, height: rgba.height });

  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(new Uint8ClampedArray(rgba.data), rgba.width, rgba.height), 0, 0);

  const mime =
    toExt === "jpg" || toExt === "jpeg" ? "image/jpeg" :
    toExt === "webp" ? "image/webp" :
    toExt === "avif" ? "image/avif" :
    "image/png";

  if (canvas.convertToBlob) {
    return canvas.convertToBlob({
      type: mime,
      quality: mime === "image/png" ? undefined : quality,
    });
  }
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      mime,
      mime === "image/png" ? undefined : quality
    );
  });
}
```

### Format-Specific Handlers

#### HEIC/HEIF Support

The system uses a bundled version of libheif for HEIC/HEIF processing, with fallback strategies for different environments:

```typescript
// lib/convert/heif.ts
export type RGBA = { data: Uint8ClampedArray; width: number; height: number };

const BUNDLE_URL = "/vendor/libheif/libheif-bundle.js";

export async function decodeHeifToRGBA(buf: ArrayBuffer): Promise<RGBA> {
  await ensureHeif();
  const bytes = new Uint8Array(buf);

  // Path A: HeifContext API (preferred)
  if (typeof g.HeifContext === "function") {
    const ctx = new g.HeifContext();
    ctx.read(bytes);
    const handle = ctx.getPrimaryImageHandle();
    const img = handle.decode();
    const width = img.get_width();
    const height = img.get_height();
    const rgba = new Uint8ClampedArray(width * height * 4);
    
    if (img.display.length >= 4) {
      img.display(rgba, width, height, { colorSpace: "rgb", bitDepth: 8 });
    } else {
      await new Promise<void>((resolve, reject) => {
        try {
          const id = new ImageData(rgba, width, height);
          img.display(id, () => resolve());
        } catch (e) { reject(e); }
      });
    }
    
    img.free?.(); handle.free?.(); ctx.free?.();
    return { data: rgba, width, height };
  }

  // Path B: HeifDecoder API (fallback)
  if (typeof g.HeifDecoder === "function") {
    const dec = new g.HeifDecoder();
    const images = dec.decode(bytes);
    if (!images || !images.length) throw new Error("No images in HEIF");
    
    const img = images[0];
    const width = img.get_width();
    const height = img.get_height();
    const rgba = new Uint8ClampedArray(width * height * 4);
    
    if (img.display.length >= 4) {
      img.display(rgba, width, height, { colorSpace: "rgb", bitDepth: 8 });
    } else {
      await new Promise<void>((resolve, reject) => {
        try {
          const id = new ImageData(rgba, width, height);
          img.display(id, () => resolve());
        } catch (e) { reject(e); }
      });
    }
    
    img.free?.();
    return { data: rgba, width, height };
  }

  throw new Error("No compatible libheif API found");
}
```

#### Browser-Native Format Support

Most image formats (JPEG, PNG, WebP, GIF, BMP, AVIF, etc.) are handled using browser-native `createImageBitmap()` API, which provides optimal performance and compatibility across different browsers. The system automatically falls back to error handling for unsupported formats.

## Video Conversion

The video conversion system uses FFmpeg.wasm with single-threaded execution for broad compatibility, including static deployments that don't support SharedArrayBuffer.

### FFmpeg.wasm Integration

```typescript
// lib/convert/video.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { detectCapabilities } from '../capabilities';

let ffmpeg: FFmpeg | null = null;
let loaded = false;

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && loaded) return ffmpeg;
  
  // Check capabilities before loading FFmpeg
  const capabilities = detectCapabilities();
  if (!capabilities.supportsVideoConversion) {
    throw new Error(`Video conversion not supported: ${capabilities.reason}`);
  }
  
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    
    // Load single-threaded FFmpeg that doesn't require SharedArrayBuffer
    // Using esm build which doesn't need cross-origin isolation
    const baseURL = 'https://unpkg.com/@ffmpeg/core-st@0.12.6/dist/esm';
    
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
    ff.on('progress', (event: any) => {
      options.onProgress?.({
        ratio: event.progress || 0,
        time: event.time || 0
      });
    });
  }
  
  const inputName = `input.${fromFormat}`;
  let outputName = `output.${toFormat}`;
  
  // Write input file
  await ff.writeFile(inputName, new Uint8Array(inputBuffer));
  
  // Build FFmpeg command based on output format
  let args: string[] = ['-i', inputName];
  
  // Build format-specific arguments...
  args.push(outputName);
  
  // Execute conversion
  await ff.exec(args);
  
  // Read output file
  const data = await ff.readFile(outputName);
  
  // Cleanup files
  try {
    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);
  } catch (cleanupErr) {
    console.warn('Cleanup error:', cleanupErr);
  }
  
  // Return ArrayBuffer (handle SharedArrayBuffer compatibility)
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  
  if (buffer instanceof SharedArrayBuffer) {
    const ab = new ArrayBuffer(buffer.byteLength);
    const view = new Uint8Array(ab);
    view.set(new Uint8Array(buffer));
    return ab;
  }
  
  return buffer;
}
```

### Format-Specific Conversion Logic

The system includes optimized conversion paths for different format combinations:

```typescript
// Fast container remuxing (no re-encoding)
const canUseCopyCodec = 
  (fromFormat === 'mkv' && ['mov', 'mp4', 'm4v'].includes(toFormat)) ||
  (fromFormat === 'mp4' && ['mkv', 'mov', 'm4v', 'ts', 'mts', 'm2ts'].includes(toFormat));

if (canUseCopyCodec) {
  args.push('-c', 'copy'); // Just copy streams without re-encoding (FAST)
  if (['mp4', 'm4v'].includes(toFormat)) {
    args.push('-movflags', '+faststart');
  }
}

// Audio extraction optimized for common formats
else if (['mp3', 'wav', 'ogg', 'aac', 'm4a', 'opus', 'flac', 'wma', 'aiff', 'mp2'].includes(toFormat)) {
  if (toFormat === 'mp3') {
    args.push('-acodec', 'libmp3lame', '-b:a', '192k');
  } else if (toFormat === 'wav') {
    args.push('-acodec', 'pcm_s16le');
  } else if (toFormat === 'ogg') {
    args.push('-acodec', 'libvorbis', '-q:a', '5');
  }
  args.push('-vn'); // No video for audio extraction
}

// Video conversions optimized for speed
else if (toFormat === 'mp4') {
  args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28');
  args.push('-c:a', 'aac', '-b:a', '128k');
  args.push('-movflags', '+faststart');
  // Limit resolution for faster processing
  args.push('-vf', 'scale=\'min(1280,iw)\':\'min(720,ih)\':force_original_aspect_ratio=decrease');
}
```

### Supported Conversion Matrix

| From Format | To Format | Method | Performance | Notes |
|------------|-----------|--------|-------------|--------|
| MKV | MP4, MOV, M4V | Copy streams | Very Fast | No re-encoding |
| MP4 | MKV, MOV, TS | Copy streams | Very Fast | No re-encoding |
| MP4/MKV/AVI/MOV | MP3/WAV/OGG | Audio extraction | Fast | Video discarded |
| Any Video | MP4 | H.264 encode | Medium | 720p max for speed |
| Any Video | WebM | VP8 encode | Medium | 720p max for speed |
| Any Video | GIF | Palette optimization | Slow | 15fps, 480p max |

### Performance Optimizations

1. **Container Remuxing**: When possible, uses stream copying instead of re-encoding
2. **Resolution Limiting**: Automatically scales down to 1280x720 for faster processing
3. **Preset Selection**: Uses "ultrafast" preset for H.264 encoding
4. **Quality Tuning**: Higher CRF values (28) for smaller files and faster encoding
5. **GIF Optimization**: Two-pass encoding with custom palette generation

## PDF Processing

### PDF.js Integration

The PDF processing system converts PDF pages to images using PDF.js with optimized rendering:

```typescript
// lib/convert/pdf.ts
import * as pdfjsLib from "pdfjs-dist";

// Point to public copy to avoid import shape issues
const workerPublicUrl = "/vendor/pdfjs/pdf.worker.min.js";
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerPublicUrl;

export async function renderPdfPages(buf: ArrayBuffer, page?: number, format?: string) {
  const doc = await (pdfjsLib as any).getDocument({ data: buf }).promise;
  const out: Array<ArrayBuffer> = [];
  const pages = page ? [page] : Array.from({ length: doc.numPages }, (_, i) => i + 1);
  
  // Determine output format
  const mimeType = format === "jpg" || format === "jpeg" ? "image/jpeg" : "image/png";
  const quality = mimeType === "image/jpeg" ? 0.9 : undefined;

  for (const p of pages) {
    const pg = await doc.getPage(p);
    const viewport = pg.getViewport({ scale: 2 });
    
    const useOffscreen = typeof OffscreenCanvas !== "undefined";
    const canvas: any = useOffscreen
      ? new OffscreenCanvas(viewport.width, viewport.height)
      : Object.assign(document.createElement("canvas"), { 
          width: viewport.width, 
          height: viewport.height 
        });

    const ctx = canvas.getContext("2d")!;
    
    // Fill white background for JPEG (since it doesn't support transparency)
    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, viewport.width, viewport.height);
    }
    
    await pg.render({ canvasContext: ctx as any, viewport }).promise;

    const blob: Blob = canvas.convertToBlob
      ? await canvas.convertToBlob({ type: mimeType, quality })
      : await new Promise((resolve) => 
          (canvas as HTMLCanvasElement).toBlob((b) => resolve(b!), mimeType, quality)
        );

    out.push(await blob.arrayBuffer());
  }

  await doc.destroy();
  return out;
}
```

### PDF Processing Features

- **Multi-page Support**: Can process specific pages or entire documents
- **Format Options**: Outputs to PNG (with transparency) or JPEG (with white background)
- **High Resolution**: Uses 2x scaling for crisp output
- **Memory Management**: Properly destroys PDF documents after processing
- **Worker Integration**: Uses dedicated PDF.js worker for optimal performance

### Usage in Workers

```typescript
// workers/convert.worker.ts
if (job.op === "pdf-pages") {
  const { renderPdfPages } = await import("../lib/convert/pdf");
  const bufs = await renderPdfPages(job.buf, job.page, job.to);
  self.postMessage({ ok: true, blobs: bufs }, bufs as unknown as Transferable[]);
  return;
}
```

## Worker Implementation

The system uses two specialized Web Workers for different types of processing.

### Main Conversion Worker

```typescript
// workers/convert.worker.ts
/// <reference lib="webworker" />
import { decodeToRGBA } from "../lib/convert/decode";
import { encodeFromRGBA } from "../lib/convert/encode";

type RasterJob = { op: "raster"; from: string; to: string; quality?: number; buf: ArrayBuffer };
type PdfJob    = { op: "pdf-pages"; page?: number; to?: string; buf: ArrayBuffer };
type VideoJob  = { op: "video"; from: string; to: string; quality?: number; buf: ArrayBuffer };
type Job = RasterJob | PdfJob | VideoJob;

self.onmessage = async (e: MessageEvent<Job>) => {
  try {
    const job = e.data;

    if (job.op === "raster") {
      const rgba = await decodeToRGBA(job.from, job.buf);
      const blob = await encodeFromRGBA(job.to, rgba, job.quality ?? 0.85);
      const arr = await blob.arrayBuffer();
      // Transfer the ArrayBuffer to avoid copying
      self.postMessage({ ok: true, blob: arr }, [arr]);
      return;
    }

    if (job.op === "pdf-pages") {
      const { renderPdfPages } = await import("../lib/convert/pdf");
      const bufs = await renderPdfPages(job.buf, job.page, job.to);
      self.postMessage({ ok: true, blobs: bufs }, bufs as unknown as Transferable[]);
      return;
    }

    if (job.op === "video") {
      try {
        const { convertVideo } = await import("../lib/convert/video");
        
        // Send loading status
        self.postMessage({ type: 'progress', status: 'loading', progress: 0 });
        
        const outputBuffer = await convertVideo(job.buf, job.from, job.to, { 
          quality: job.quality,
          onProgress: (event) => {
            const percent = Math.round((event.ratio || 0) * 100);
            self.postMessage({ 
              type: 'progress', 
              status: 'processing', 
              progress: percent,
              time: event.time 
            });
          }
        });
        
        self.postMessage({ ok: true, blob: outputBuffer });
      } catch (videoErr: any) {
        console.error('Video conversion error:', videoErr);
        self.postMessage({ ok: false, error: `Video conversion failed: ${videoErr?.message}` });
      }
      return;
    }

    self.postMessage({ ok: false, error: "Unknown op" });
  } catch (err: any) {
    self.postMessage({ ok: false, error: err?.message || String(err) });
  }
};
```

### Compression Worker

```typescript
// workers/compress.worker.ts
/// <reference lib="webworker" />

type CompressJob = { op: "compress-png"; buf: ArrayBuffer; quality?: number };

self.onmessage = async (e: MessageEvent<CompressJob>) => {
  try {
    const job = e.data;

    if (job.op === "compress-png") {
      const compressed = await compressPNGViaCanvas(job.buf, job.quality ?? 0.85);
      self.postMessage({ ok: true, blob: compressed }, [compressed]);
      return;
    }

    self.postMessage({ ok: false, error: "Unknown operation" });
  } catch (err: any) {
    self.postMessage({ ok: false, error: err?.message || String(err) });
  }
};

// PNG compression using multiple strategies
async function compressPNGViaCanvas(buf: ArrayBuffer, quality: number): Promise<ArrayBuffer> {
  const blob = new Blob([buf], { type: 'image/png' });
  const imageBitmap = await createImageBitmap(blob);
  
  // Resize if image is very large
  let targetWidth = imageBitmap.width;
  let targetHeight = imageBitmap.height;
  const maxDimension = 2048;
  
  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    const scale = Math.min(maxDimension / targetWidth, maxDimension / targetHeight);
    targetWidth = Math.floor(targetWidth * scale);
    targetHeight = Math.floor(targetHeight * scale);
  }
  
  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
  
  // Check for transparency
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const hasTransparency = checkHasTransparency(imageData);
  
  // Use different compression strategies based on transparency
  if (!hasTransparency) {
    // Convert to JPEG for better compression, then back to PNG
    const jpegQuality = quality * 0.5;
    const jpegBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: jpegQuality });
    const jpegBitmap = await createImageBitmap(jpegBlob);
    const newCanvas = new OffscreenCanvas(jpegBitmap.width, jpegBitmap.height);
    const newCtx = newCanvas.getContext('2d')!;
    newCtx.drawImage(jpegBitmap, 0, 0);
    const finalBlob = await newCanvas.convertToBlob({ type: 'image/png' });
    return await finalBlob.arrayBuffer();
  }
  
  // For transparent images, use color quantization
  const data = imageData.data;
  const colorBits = Math.max(2, Math.floor(quality * 4));
  const colorLevels = Math.pow(2, colorBits);
  const colorStep = 256 / colorLevels;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / colorStep) * colorStep;
    data[i + 1] = Math.round(data[i + 1] / colorStep) * colorStep;
    data[i + 2] = Math.round(data[i + 2] / colorStep) * colorStep;
  }
  
  ctx.putImageData(imageData, 0, 0);
  const compressedBlob = await canvas.convertToBlob({ type: 'image/png' });
  return await compressedBlob.arrayBuffer();
}
```

## UI Components

### HeroConverter

The main conversion component with drag & drop interface and progress tracking:

```typescript
// components/HeroConverter.tsx
export default function HeroConverter({
  title, subtitle, from, to, accept, videoEmbedId
}: Props) {
  const workerRef = useRef<Worker | null>(null);
  const [busy, setBusy] = useState(false);
  const [currentFile, setCurrentFile] = useState<{
    name: string;
    progress: number;
    status: 'loading' | 'processing' | 'completed' | 'error';
    message?: string;
  } | null>(null);

  function ensureWorker() {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../workers/convert.worker.ts", import.meta.url),
        { type: "module" }
      );
    }
    return workerRef.current;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const w = ensureWorker();
    setBusy(true);
    
    for (const file of Array.from(files)) {
      setCurrentFile({
        name: file.name,
        progress: 0,
        status: 'loading',
        message: 'Loading FFmpeg...'
      });
      
      const buf = await file.arrayBuffer();
      // Process with worker and handle progress/results...
    }
  }
}
```

### Converter (Multi-file Queue)

For batch processing with queue management:

```typescript
// components/Converter.tsx
export default function Converter({
  title, from, to, description, accepts, qualityDefault = 85
}: ConvertProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [quality, setQuality] = useState<number>(qualityDefault);
  const [busy, setBusy] = useState(false);

  async function convertAll() {
    setBusy(true);
    const worker = ensureWorker();
    
    for (const item of items.filter(i => i.status === "queued")) {
      setItems(prev => prev.map(x => 
        x.id === item.id ? { ...x, status: "converting" } : x
      ));
      
      // Process each item with worker...
    }
    
    setBusy(false);
  }
}
```

## Error Handling

### Error Types and Recovery

The system implements comprehensive error handling with user-friendly messaging:

```typescript
// workers/convert.worker.ts
self.onmessage = async (e: MessageEvent<Job>) => {
  try {
    const job = e.data;
    // ... processing logic
  } catch (err: any) {
    self.postMessage({ ok: false, error: err?.message || String(err) });
  }
};

// Video-specific error handling
if (job.op === "video") {
  try {
    const outputBuffer = await convertVideo(job.buf, job.from, job.to, options);
    self.postMessage({ ok: true, blob: outputBuffer });
  } catch (videoErr: any) {
    console.error('Video conversion error:', videoErr);
    self.postMessage({ 
      ok: false, 
      error: `Video conversion failed: ${videoErr?.message || videoErr}` 
    });
  }
}
```

### Capability-based Error Prevention

```typescript
// lib/capabilities.ts
export function detectCapabilities(): Capabilities {
  const buildMode = process.env.BUILD_MODE as 'static' | 'server' || 'static';
  const envSupportsVideo = process.env.SUPPORTS_VIDEO_CONVERSION === 'true';
  
  let supportsVideoConversion = false;
  let reason: string | undefined;
  
  if (!envSupportsVideo) {
    reason = 'Video conversion disabled in static build mode';
  } else {
    supportsVideoConversion = true;
  }
  
  return { supportsVideoConversion, buildMode, reason };
}

export function getStaticIncompatibilityReason(from: string, to: string): string | null {
  if (isStaticCompatible(from, to)) return null;
  
  if (VIDEO_FORMATS.includes(from)) {
    return `${from.toUpperCase()} video processing requires FFmpeg.wasm (server mode only)`;
  }
  
  if (AUDIO_FORMATS.includes(to)) {
    return `Audio extraction to ${to.toUpperCase()} requires FFmpeg.wasm (server mode only)`;
  }
  
  return 'Video/audio processing not supported in static builds';
}
```

### User Interface Error Handling

```typescript
// components/HeroConverter.tsx
w.onmessage = (ev: MessageEvent<any>) => {
  if (!ev.data?.ok) {
    setCurrentFile({
      name: file.name,
      progress: 0,
      status: 'error',
      message: ev.data?.error || "Convert failed"
    });
    return reject(new Error(ev.data?.error || "Convert failed"));
  }
  
  // Handle successful conversion...
};
```

## Testing

The system includes comprehensive test coverage for all conversion types:

### Test Structure

```typescript
// tests/converters.spec.ts
describe('Conversion System', () => {
  describe('Image Conversion', () => {
    it('should convert HEIC to JPG', async () => {
      const heicBuffer = await loadTestFile('test.heic');
      const result = await testConverter('heic', 'jpg', heicBuffer);
      expect(result.success).toBe(true);
      expect(result.outputSize).toBeGreaterThan(0);
    });
  });
  
  describe('Video Conversion', () => {
    it('should convert MP4 to MP3 (audio extraction)', async () => {
      const mp4Buffer = await loadTestFile('test.mp4');
      const result = await testVideoConverter('mp4', 'mp3', mp4Buffer);
      expect(result.success).toBe(true);
    });
  });
  
  describe('PDF Conversion', () => {
    it('should convert PDF pages to PNG', async () => {
      const pdfBuffer = await loadTestFile('test.pdf');
      const result = await testPdfConverter('pdf', 'png', pdfBuffer);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBeGreaterThan(0);
    });
  });
});
```

### Test Files

The test suite includes sample files for various formats:
- `/tests/files/test.heic` - HEIC image
- `/tests/files/test.jpg` - JPEG image  
- `/tests/files/test.png` - PNG image
- `/tests/files/test.pdf` - Multi-page PDF
- `/tests/files/test.webp` - WebP image

## Adding New Converters

### Step 1: Add Format Support

```typescript
// lib/capabilities.ts - Add new format to appropriate category
export const VIDEO_FORMATS = [
  'mp4', 'mkv', 'avi', 'webm', 'mov', 'flv', 'new-video-format'
];

export const STATIC_SAFE_FORMATS = [
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'new-image-format'
];
```

### Step 2: Update Processing Logic

```typescript
// lib/convert/video.ts - Add format-specific conversion logic
else if (toFormat === 'new-format') {
  args.push('-c:v', 'new-codec', '-preset', 'ultrafast', '-crf', '23');
  args.push('-c:a', 'new-audio-codec', '-b:a', '192k');
}

// lib/convert/decode.ts - Add format-specific decode logic (if needed)
if (e === "new-format") {
  return decodeNewFormat(buf);
}
```

### Step 3: Create Tool Page

```typescript
// app/tools/(convert)/new-from-to-new-to/page.tsx
"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["new-from-to-new-to"];
  
  return (
    <ToolPageTemplate
      tool={content.tool}
      faqs={content.faqs}
      aboutSection={content.aboutSection}
      relatedTools={content.relatedTools}
    />
  );
}
```

### Step 4: Add Tool Configuration

```json
// data/tools.json
{
  "id": "new-from-to-new-to",
  "title": "NEW-FROM to NEW-TO",
  "subtitle": "Convert NEW-FROM files to NEW-TO format",
  "from": "new-from",
  "to": "new-to",
  "operation": "convert",
  "isActive": true,
  "path": "/tools/new-from-to-new-to"
}
```

### Performance Considerations

When adding new converters, consider:

1. **Processing Time**: Video conversions are CPU-intensive
2. **Memory Usage**: Large files may cause memory issues in browsers
3. **File Size Limits**: Consider warning users about large files (>100MB)
4. **Browser Compatibility**: Test across different browsers for codec support
5. **Static vs Server Mode**: Ensure capability detection works correctly

## See Also

- [Tool System](tool-system.md) - How tools integrate with the conversion system
- [Worker System](worker-system.md) - Web Worker architecture and patterns
- [Capability Detection](capability-detection.md) - Runtime feature detection
- [Converter Pattern](../patterns/converter-pattern.md) - UI component patterns
- [Add New Converter Recipe](../recipes/add-new-converter.md) - Step-by-step guide for adding formats

## Key Files

- `/lib/convert/video.ts` - Video conversion with FFmpeg.wasm
- `/lib/convert/decode.ts` - Image decoding pipeline
- `/lib/convert/encode.ts` - Image encoding pipeline  
- `/lib/convert/pdf.ts` - PDF to image conversion
- `/lib/convert/heif.ts` - HEIC/HEIF format support
- `/lib/capabilities.ts` - Runtime capability detection
- `/workers/convert.worker.ts` - Main conversion worker
- `/workers/compress.worker.ts` - PNG compression worker
- `/components/HeroConverter.tsx` - Single-file conversion UI
- `/components/Converter.tsx` - Multi-file queue UI
- `/components/BatchHeroConverter.tsx` - Batch processing UI