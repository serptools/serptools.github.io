# Worker System

Web Worker implementation for offloading CPU-intensive tasks from the main thread, enabling fast, browser-native file conversion and processing.

## Overview

The worker system provides background processing for file conversions, preventing UI freezes during intensive operations. It handles message passing, error management, progress reporting, and resource cleanup. The system is designed to work in both static and server deployment modes with different capability sets.

## Worker Architecture

### System Components

```
Main Thread                    Worker Thread                   Libraries/APIs
     │                              │                              │
Components/UI ──────────────▶  Message Handler ────────────▶  FFmpeg.wasm
     │                              │                              │
Progress UI ◀───────────────  Progress Events  ◀────────────    PDF.js
     │                              │                              │
File Downloads ◀────────────   Process Files   ◀────────────  Browser APIs
     │                              │                              │
Error Handling ◀────────────   Error Messages  ◀────────────  Canvas/ImageBitmap
```

### Worker Types

| Worker | Purpose | Operations | Capabilities |
|--------|---------|------------|--------------|
| `convert.worker.ts` | File conversion | Image, video, PDF processing | Raster images, video (FFmpeg), PDF pages |
| `compress.worker.ts` | Image compression | PNG compression via Canvas API | Lossy PNG compression, format conversion |

## Main Worker Implementation

### Convert Worker (`convert.worker.ts`)

The main conversion worker handles three types of operations: raster image conversion, PDF page rendering, and video conversion.

```typescript
/// <reference lib="webworker" />
import { decodeToRGBA } from "../lib/convert/decode";
import { encodeFromRGBA } from "../lib/convert/encode";

type RasterJob = { op: "raster"; from: string; to: string; quality?: number; buf: ArrayBuffer };
type PdfJob    = { op: "pdf-pages"; page?: number; to?: string; buf: ArrayBuffer };
type VideoJob  = { op: "video"; from: string; to: string; quality?: number; buf: ArrayBuffer };
type Job = RasterJob | PdfJob | VideoJob;

declare const self: DedicatedWorkerGlobalScope;

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
    }

    self.postMessage({ ok: false, error: "Unknown op" });
  } catch (err: any) {
    self.postMessage({ ok: false, error: err?.message || String(err) });
  }
};
```

### Compress Worker (`compress.worker.ts`)

Handles PNG compression using Canvas API workarounds since true PNG compression requires native libraries.

```typescript
/// <reference lib="webworker" />

type CompressJob = { op: "compress-png"; buf: ArrayBuffer; quality?: number };

self.onmessage = async (e: MessageEvent<CompressJob>) => {
  try {
    const job = e.data;

    if (job.op === "compress-png") {
      // Use Canvas API to apply lossy compression
      const compressed = await compressPNGViaCanvas(job.buf, job.quality ?? 0.85);
      
      // Transfer the ArrayBuffer to avoid copying
      self.postMessage({ ok: true, blob: compressed }, [compressed]);
      return;
    }

    self.postMessage({ ok: false, error: "Unknown operation" });
  } catch (err: any) {
    self.postMessage({ ok: false, error: err?.message || String(err) });
  }
};
```

### Message Protocol

The workers use a simple, direct message protocol:

```typescript
// Job types sent to convert worker
type RasterJob = { 
  op: "raster"; 
  from: string; 
  to: string; 
  quality?: number; 
  buf: ArrayBuffer 
};

type PdfJob = { 
  op: "pdf-pages"; 
  page?: number; 
  to?: string; 
  buf: ArrayBuffer 
};

type VideoJob = { 
  op: "video"; 
  from: string; 
  to: string; 
  quality?: number; 
  buf: ArrayBuffer 
};

// Response messages from workers
interface SuccessResponse {
  ok: true;
  blob: ArrayBuffer;        // Single result
  blobs?: ArrayBuffer[];    // Multiple results (PDF pages)
}

interface ErrorResponse {
  ok: false;
  error: string;
}

interface ProgressResponse {
  type: 'progress';
  status: 'loading' | 'processing';
  progress: number;         // 0-100
  time?: number;           // FFmpeg time info
}
```

## Conversion Operations

### Raster Image Conversion

Uses browser-native image processing with Canvas API for maximum compatibility:

```typescript
// Decode: Supports browser-native formats + HEIC/HEIF
export async function decodeToRGBA(ext: string, buf: ArrayBuffer): Promise<RGBA> {
  const e = (ext || "").toLowerCase();

  if (e === "heic" || e === "heif") {
    return decodeHeifToRGBA(buf);
  }

  // Browser-native decoders: jpg/jpeg/png/webp/gif/bmp/avif/ico
  const blob = new Blob([buf]);
  const bitmap = await createImageBitmap(blob).catch(() => {
    throw new Error("This format isn't natively supported by your browser.");
  });
  return bitmapToRGBA(bitmap);
}

// Encode: Convert RGBA to target format
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
  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba.data), rgba.width, rgba.height), 0, 0);

  const mime =
    toExt === "jpg" || toExt === "jpeg" ? "image/jpeg" :
    toExt === "webp" ? "image/webp" :
    toExt === "avif" ? "image/avif" :
    "image/png";

  return canvas.convertToBlob({
    type: mime,
    quality: mime === "image/png" ? undefined : quality,
  });
}
```

### PDF to Image Conversion

Uses PDF.js for rendering PDF pages to images:

```typescript
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
      : Object.assign(document.createElement("canvas"), { width: viewport.width, height: viewport.height });

    const ctx = canvas.getContext("2d")!;
    
    // Fill white background for JPEG (no transparency support)
    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, viewport.width, viewport.height);
    }
    
    await pg.render({ canvasContext: ctx as any, viewport }).promise;

    const blob: Blob = canvas.convertToBlob
      ? await canvas.convertToBlob({ type: mimeType, quality })
      : await new Promise((resolve) => (canvas as HTMLCanvasElement).toBlob((b)=>resolve(b!), mimeType, quality));

    out.push(await blob.arrayBuffer());
  }

  await doc.destroy();
  return out;
}
```

### Video Conversion

Uses FFmpeg.wasm for comprehensive video processing with capability detection:

```typescript
export async function convertVideo(
  inputBuffer: ArrayBuffer,
  fromFormat: string,
  toFormat: string,
  options: {
    quality?: number;
    onProgress?: (progress: { ratio: number; time: number }) => void;
  } = {}
): Promise<ArrayBuffer> {
  // Check capabilities first
  const capabilities = detectCapabilities();
  if (!capabilities.supportsVideoConversion) {
    throw new Error(`Video conversion not supported: ${capabilities.reason}`);
  }
  
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
  
  // Build optimized FFmpeg command for fast conversion
  const inputName = `input.${fromFormat}`;
  let outputName = `output.${toFormat}`;
  
  await ff.writeFile(inputName, new Uint8Array(inputBuffer));
  
  let args: string[] = ['-i', inputName];
  
  // Optimized encoding settings per format
  if (toFormat === 'mp4') {
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28');
    args.push('-c:a', 'aac', '-b:a', '128k');
    args.push('-movflags', '+faststart');
    args.push('-vf', 'scale=\'min(1280,iw)\':\'min(720,ih)\':force_original_aspect_ratio=decrease');
  }
  // ... more format-specific optimizations
  
  args.push(outputName);
  
  await ff.exec(args);
  
  const data = await ff.readFile(outputName);
  
  // Cleanup
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);
  
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}
```

## Worker Management

### Component-Based Worker Usage

The current implementation uses a simple, direct approach where each converter component manages its own worker instance:

```typescript
// From Converter.tsx
export default function Converter({ title, from, to, ...props }) {
  const workerRef = useRef<Worker | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  function ensureWorker() {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../workers/convert.worker.ts", import.meta.url), 
        { type: "module" }
      );
    }
    return workerRef.current;
  }

  async function convertAll() {
    if (!items.length) return;
    setBusy(true);
    
    const worker = ensureWorker();
    
    for (const item of items) {
      if (item.status !== "queued") continue;
      
      setItems(prev => prev.map(x => 
        x.id === item.id ? { ...x, status: "converting" } : x
      ));
      
      try {
        await new Promise<void>((resolve, reject) => {
          const handleMessage = (e: MessageEvent) => {
            if (e.data.id === item.id) {
              if (e.data.error) {
                setItems(prev => prev.map(x => 
                  x.id === item.id 
                    ? { ...x, status: "error", message: e.data.error } 
                    : x
                ));
                reject(e.data.error);
              } else if (e.data.blob) {
                const outputName = item.file.name.replace(/\.[^.]+$/, `.${to}`);
                saveBlob(e.data.blob, outputName);
                setItems(prev => prev.map(x => 
                  x.id === item.id ? { ...x, status: "done" } : x
                ));
                resolve();
              }
              worker.removeEventListener("message", handleMessage);
            }
          };
          
          worker.addEventListener("message", handleMessage);
          worker.postMessage({
            id: item.id,
            op: "raster", // or "video"/"pdf-pages"
            from,
            to,
            buf: await item.file.arrayBuffer(),
            quality: to === "jpg" || to === "jpeg" ? quality / 100 : undefined,
          });
        });
      } catch (err) {
        console.error(`Error converting ${item.file.name}:`, err);
      }
    }
    
    setBusy(false);
  }
}
```

### Advanced Video Progress Handling

The video converter components implement comprehensive progress tracking:

```typescript
// From HeroConverter.tsx
function VideoConverter() {
  const [currentFile, setCurrentFile] = useState<{
    id: string;
    name: string;
    status: 'queued' | 'loading' | 'processing' | 'completed' | 'error';
    progress: number;
  } | null>(null);

  const worker = useMemo(() => {
    const w = new Worker(new URL("../workers/convert.worker.ts", import.meta.url), { type: "module" });
    
    w.onmessage = (ev) => {
      // Handle progress messages
      if (ev.data?.type === 'progress') {
        setCurrentFile(prev => prev && {
          ...prev,
          status: ev.data.status,
          progress: ev.data.progress || 0,
        });
      } else if (ev.data?.ok && ev.data?.blob) {
        // Handle successful conversion
        setCurrentFile(prev => prev && {
          ...prev,
          status: 'completed',
          progress: 100,
        });
        
        const outputName = currentFile?.name.replace(/\.[^.]+$/, `.${toFormat}`) || 'converted';
        saveBlob(ev.data.blob, outputName);
      } else if (ev.data?.error) {
        // Handle errors
        setCurrentFile(prev => prev && {
          ...prev,
          status: 'error',
          progress: 0,
        });
        setError(ev.data.error);
      }
    };
    
    return w;
  }, []);

  const startConversion = async (file: File) => {
    const fileId = crypto.randomUUID();
    
    setCurrentFile({
      id: fileId,
      name: file.name,
      status: 'loading',
      progress: 0,
    });

    try {
      const buffer = await file.arrayBuffer();
      
      worker.postMessage({
        id: fileId,
        op: "video",
        from: fromFormat,
        to: toFormat,
        buf: buffer,
        quality: quality / 100
      });
    } catch (error) {
      setCurrentFile(prev => prev && { ...prev, status: 'error' });
      setError(error instanceof Error ? error.message : 'Conversion failed');
    }
  };
}
```

### Worker Cleanup and Resource Management

```typescript
// Component cleanup pattern
useEffect(() => {
  return () => {
    // Clean up worker on component unmount
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  };
}, []);

// FFmpeg cleanup in video conversion
export async function cleanupFFmpeg() {
  if (ffmpeg) {
    ffmpeg.terminate();
    ffmpeg = null;
    loaded = false;
  }
}
```

## Progress Reporting

### Video Progress System

The VideoProgress component provides rich progress feedback for video conversions:

```typescript
interface VideoProgressProps {
  fileName: string;
  progress: number;
  status: 'loading' | 'processing' | 'completed' | 'error';
  message?: string;
}

export function VideoProgress({ fileName, progress, status, message }: VideoProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return 'Loading FFmpeg...';
      case 'processing':
        return message || `Processing ${Math.round(progress)}%`;
      case 'completed':
        return 'Conversion complete!';
      case 'error':
        return message || 'Conversion failed';
    }
  };

  return (
    <Card className="p-4 mb-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium truncate max-w-[200px]" title={fileName}>
              {fileName}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {getStatusText()}
          </span>
        </div>
        
        <Progress 
          value={progress} 
          className="h-2"
          indicatorClassName={getProgressColor()}
        />
      </div>
    </Card>
  );
}
```

### Multi-File Progress Tracking

For batch conversions, the system tracks overall progress across multiple files:

```typescript
export function MultiFileProgress({ files }: MultiFileProgressProps) {
  if (files.length === 0) return null;

  const totalProgress = files.reduce((acc, file) => acc + file.progress, 0) / files.length;
  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const processingCount = files.filter(f => f.status === 'processing' || f.status === 'loading').length;

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <Card className="p-4 bg-muted/50">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold">Overall Progress</h3>
            <div className="flex gap-4 text-xs">
              {completedCount > 0 && (
                <span className="text-green-600">✓ {completedCount} completed</span>
              )}
              {processingCount > 0 && (
                <span className="text-blue-600">⟳ {processingCount} processing</span>
              )}
              {errorCount > 0 && (
                <span className="text-red-600">✗ {errorCount} failed</span>
              )}
            </div>
          </div>
          <Progress value={totalProgress} className="h-2" />
          <div className="text-xs text-muted-foreground text-right">
            {Math.round(totalProgress)}% complete
          </div>
        </div>
      </Card>

      {/* Individual File Progress */}
      <div className="space-y-2">
        {files.map((file) => (
          <VideoProgress
            key={file.id}
            fileName={file.name}
            progress={file.progress}
            status={file.status}
            message={file.message}
          />
        ))}
      </div>
    </div>
  );
}
```

### FFmpeg Progress Integration

Video conversion progress is seamlessly integrated with FFmpeg's progress events:

```typescript
// In video conversion worker
const outputBuffer = await convertVideo(job.buf, job.from, job.to, { 
  quality: job.quality,
  onProgress: (event) => {
    // FFmpeg progress events have ratio (0-1) and time
    const percent = Math.round((event.ratio || 0) * 100);
    self.postMessage({ 
      type: 'progress', 
      status: 'processing', 
      progress: percent,
      time: event.time 
    });
  }
});

// In FFmpeg video conversion library
if (options.onProgress) {
  ff.on('progress', (event: any) => {
    options.onProgress?.({
      ratio: event.progress || 0,
      time: event.time || 0
    });
  });
}
```

## Memory Management

### Transferable Objects for Performance

The system uses ArrayBuffer transfers to avoid memory copying:

```typescript
// In convert worker - transfer ArrayBuffers to avoid copying
if (job.op === "raster") {
  const rgba = await decodeToRGBA(job.from, job.buf);
  const blob = await encodeFromRGBA(job.to, rgba, job.quality ?? 0.85);
  const arr = await blob.arrayBuffer();
  // Transfer the ArrayBuffer to avoid copying
  self.postMessage({ ok: true, blob: arr }, [arr]);
  return;
}

// In compress worker
if (job.op === "compress-png") {
  const compressed = await compressPNGViaCanvas(job.buf, job.quality ?? 0.85);
  // Transfer the ArrayBuffer to avoid copying
  self.postMessage({ ok: true, blob: compressed }, [compressed]);
  return;
}

// PDF pages handling
if (job.op === "pdf-pages") {
  const { renderPdfPages } = await import("../lib/convert/pdf");
  const bufs = await renderPdfPages(job.buf, job.page, job.to);
  self.postMessage({ ok: true, blobs: bufs }, bufs as unknown as Transferable[]);
  return;
}
```

### FFmpeg Resource Management

Proper cleanup of FFmpeg instances and temporary files:

```typescript
// Singleton FFmpeg instance with proper lifecycle management
let ffmpeg: FFmpeg | null = null;
let loaded = false;

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && loaded) return ffmpeg;
  
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    
    // Load FFmpeg with multi-threading support
    const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
    
    await ffmpeg.load({
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      workerURL: `${baseURL}/ffmpeg-core.worker.js`,
    });
    
    loaded = true;
  }
  
  return ffmpeg;
}

// Cleanup after each conversion
export async function convertVideo(...args): Promise<ArrayBuffer> {
  // ... conversion logic ...
  
  // Always cleanup temporary files
  try {
    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);
    if (toFormat === 'gif') {
      await ff.deleteFile('palette.png');
    }
  } catch (cleanupErr) {
    console.warn('Cleanup error:', cleanupErr);
  }
  
  return buffer;
}

// Global cleanup function
export async function cleanupFFmpeg() {
  if (ffmpeg) {
    ffmpeg.terminate();
    ffmpeg = null;
    loaded = false;
  }
}
```

### SharedArrayBuffer Handling

The system properly handles both ArrayBuffer and SharedArrayBuffer:

```typescript
// In video conversion - handle SharedArrayBuffer correctly
const data = await ff.readFile(outputName);

// Return the ArrayBuffer (handle both ArrayBuffer and SharedArrayBuffer)
const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

// Ensure we return an ArrayBuffer, not SharedArrayBuffer
if (buffer instanceof SharedArrayBuffer) {
  const ab = new ArrayBuffer(buffer.byteLength);
  const view = new Uint8Array(ab);
  view.set(new Uint8Array(buffer));
  return ab;
}

return buffer;
```

## Error Handling

### Simple Error Response Pattern

The workers use a straightforward error handling approach:

```typescript
// In both convert and compress workers
self.onmessage = async (e: MessageEvent<Job>) => {
  try {
    const job = e.data;
    
    // Process job...
    if (job.op === "unknown") {
      self.postMessage({ ok: false, error: "Unknown operation" });
      return;
    }
    
    // Success response
    self.postMessage({ ok: true, blob: result });
    
  } catch (err: any) {
    // Simple error response
    self.postMessage({ ok: false, error: err?.message || String(err) });
  }
};
```

### Component Error Handling

Components handle worker errors through message event listeners:

```typescript
// In Converter component
const handleMessage = (e: MessageEvent) => {
  if (e.data.id === item.id) {
    if (e.data.error) {
      setItems(prev => prev.map(x => 
        x.id === item.id 
          ? { ...x, status: "error" as const, message: e.data.error } 
          : x
      ));
      reject(e.data.error);
    } else if (e.data.blob) {
      // Success handling...
    }
    worker.removeEventListener("message", handleMessage);
  }
};

// In HeroConverter component
w.onmessage = (ev) => {
  if (ev.data?.error) {
    setCurrentFile(prev => prev && {
      ...prev,
      status: 'error',
      progress: 0,
    });
    setError(ev.data.error);
  }
  // Handle other message types...
};
```

### Video Conversion Error Handling

Video conversion includes specific error handling for FFmpeg operations:

```typescript
// In convert worker video handling
if (job.op === "video") {
  try {
    const { convertVideo } = await import("../lib/convert/video");
    
    const outputBuffer = await convertVideo(job.buf, job.from, job.to, { 
      quality: job.quality,
      onProgress: (event) => { /* progress handling */ }
    });
    
    self.postMessage({ ok: true, blob: outputBuffer });
  } catch (videoErr: any) {
    console.error('Video conversion error:', videoErr);
    self.postMessage({ 
      ok: false, 
      error: `Video conversion failed: ${videoErr?.message || videoErr}` 
    });
  }
  return;
}

// In video conversion library
export async function convertVideo(...): Promise<ArrayBuffer> {
  // Check capabilities before starting
  const capabilities = detectCapabilities();
  if (!capabilities.supportsVideoConversion) {
    throw new Error(`Video conversion not supported: ${capabilities.reason}`);
  }
  
  // FFmpeg operations with error handling
  try {
    const ff = await loadFFmpeg();
    await ff.writeFile(inputName, new Uint8Array(inputBuffer));
    await ff.exec(args);
    const data = await ff.readFile(outputName);
    return processResult(data);
  } catch (ffmpegError) {
    throw new Error(`FFmpeg operation failed: ${ffmpegError.message}`);
  }
}
```

## Capability Detection

### Runtime Environment Detection

The system includes sophisticated capability detection for different deployment modes:

```typescript
export interface Capabilities {
  supportsVideoConversion: boolean;
  supportsSharedArrayBuffer: boolean;
  buildMode: 'static' | 'server';
  reason?: string;
}

export function detectCapabilities(): Capabilities {
  // Check environment variables first
  const buildMode = process.env.BUILD_MODE as 'static' | 'server' || 'static';
  const envSupportsVideo = process.env.SUPPORTS_VIDEO_CONVERSION === 'true';
  
  // Runtime SharedArrayBuffer detection
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  
  // Determine video conversion support
  let supportsVideoConversion = false;
  let reason: string | undefined;
  
  if (!envSupportsVideo) {
    reason = 'Video conversion disabled in static build mode';
  } else if (!hasSharedArrayBuffer) {
    reason = 'SharedArrayBuffer not available - CORS headers required';
  } else {
    supportsVideoConversion = true;
  }
  
  return {
    supportsVideoConversion,
    supportsSharedArrayBuffer: hasSharedArrayBuffer,
    buildMode,
    reason,
  };
}
```

### Format Compatibility Matrix

```typescript
// Define formats that require video conversion (FFmpeg.wasm)
export const VIDEO_FORMATS = [
  'mp4', 'mkv', 'avi', 'webm', 'mov', 'flv', 'ts', 'mts', 'm2ts', 'm4v', 
  'mpeg', 'mpg', 'vob', '3gp', 'f4v', 'hevc', 'divx', 'mjpeg', 'mpeg2', 
  'asf', 'wmv', 'mxf', 'ogv', 'rm', 'rmvb', 'swf'
];

export const AUDIO_FORMATS = [
  'mp3', 'wav', 'ogg', 'aac', 'm4a', 'opus', 'flac', 'wma', 'aiff', 'mp2'
];

// Formats that work with browser-native processing (static-safe)
export const STATIC_SAFE_FORMATS = [
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'ico', 'tiff', 'avif', 'pdf'
];

// Check if a conversion requires video processing
export function requiresVideoConversion(from: string, to: string): boolean {
  return VIDEO_FORMATS.includes(from) || 
         AUDIO_FORMATS.includes(to) ||
         VIDEO_FORMATS.includes(to);
}
```

## Performance Optimization

### Optimized FFmpeg Commands

The video conversion system uses performance-optimized FFmpeg settings:

```typescript
// For container-to-container conversions with compatible codecs
const canUseCopyCodec = 
  (fromFormat === 'mkv' && ['mov', 'mp4', 'm4v'].includes(toFormat)) ||
  (fromFormat === 'mp4' && ['mkv', 'mov', 'm4v', 'ts', 'mts', 'm2ts'].includes(toFormat));

if (canUseCopyCodec) {
  // Just copy streams without re-encoding (FAST)
  args.push('-c', 'copy');
  if (['mp4', 'm4v'].includes(toFormat)) {
    args.push('-movflags', '+faststart');
  }
}

// Optimized MP4 encoding for speed
else if (toFormat === 'mp4') {
  // Use ultrafast preset for speed, higher CRF for smaller file
  args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28');
  args.push('-c:a', 'aac', '-b:a', '128k');
  args.push('-movflags', '+faststart');
  // Limit resolution for faster processing
  args.push('-vf', 'scale=\'min(1280,iw)\':\'min(720,ih)\':force_original_aspect_ratio=decrease');
}
```

### Canvas-Based PNG Compression

The compress worker uses multiple strategies for optimal PNG compression:

```typescript
async function compressPNGViaCanvas(buf: ArrayBuffer, quality: number): Promise<ArrayBuffer> {
  const blob = new Blob([buf], { type: 'image/png' });
  const imageBitmap = await createImageBitmap(blob);
  
  // Strategy 1: If no transparency, convert to JPEG for better compression
  if (!hasTransparency) {
    const jpegQuality = quality * 0.5; // Half the quality for more compression
    const jpegBlob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: jpegQuality
    });
    // Convert back to PNG to maintain format consistency
    return await convertBackToPNG(jpegBlob);
  }
  
  // Strategy 2: Try WebP if available
  try {
    const webpQuality = quality * 0.4; // Very aggressive WebP compression
    const webpBlob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: webpQuality
    });
    return await convertBackToPNG(webpBlob);
  } catch (e) {
    // WebP not supported, continue with other methods
  }
  
  // Strategy 3: Aggressive color reduction (quantization)
  const colorBits = Math.max(2, Math.floor(quality * 4)); // 2-4 bits per channel
  const colorLevels = Math.pow(2, colorBits);
  const colorStep = 256 / colorLevels;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / colorStep) * colorStep;     // R
    data[i + 1] = Math.round(data[i + 1] / colorStep) * colorStep; // G
    data[i + 2] = Math.round(data[i + 2] / colorStep) * colorStep; // B
    // Keep alpha channel unchanged for transparency
  }
}
```

### OffscreenCanvas Usage

The system uses OffscreenCanvas when available for better performance:

```typescript
// In both image processing and PDF rendering
const useOffscreen = typeof OffscreenCanvas !== "undefined";
const canvas: any = useOffscreen
  ? new OffscreenCanvas(width, height)
  : Object.assign(document.createElement("canvas"), { width, height });

// Consistent API between OffscreenCanvas and regular Canvas
if (canvas.convertToBlob) {
  return canvas.convertToBlob({ type: mimeType, quality });
} else {
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      mimeType,
      quality
    );
  });
}
```

## Best Practices

### 1. Use Transferable Objects
Always transfer ArrayBuffers to avoid memory copying:

```typescript
// ✅ Good - Transfer ownership
self.postMessage({ ok: true, blob: arr }, [arr]);

// ❌ Bad - Copies memory
self.postMessage({ ok: true, blob: arr });
```

### 2. Dynamic Imports for Code Splitting
Load heavy dependencies only when needed:

```typescript
// ✅ Good - Lazy load
if (job.op === "pdf-pages") {
  const { renderPdfPages } = await import("../lib/convert/pdf");
  const bufs = await renderPdfPages(job.buf, job.page, job.to);
}

// ❌ Bad - Always loads at startup
import { renderPdfPages } from "../lib/convert/pdf";
```

### 3. Proper Resource Cleanup
Always clean up temporary resources:

```typescript
// ✅ Good - Cleanup in finally block
try {
  await ff.exec(args);
  const data = await ff.readFile(outputName);
  return data.buffer;
} finally {
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);
}
```

### 4. Capability Detection
Check capabilities before attempting operations:

```typescript
// ✅ Good - Check first
const capabilities = detectCapabilities();
if (!capabilities.supportsVideoConversion) {
  throw new Error(`Video conversion not supported: ${capabilities.reason}`);
}
```

### 5. Progressive Enhancement
Design for static compatibility first, enhance with video features:

```typescript
// ✅ Good - Works in static mode, enhanced in server mode
const isVideoFormat = VIDEO_FORMATS.includes(fromFormat);
if (isVideoFormat && !capabilities.supportsVideoConversion) {
  showStaticModeMessage();
  return;
}
```

## Troubleshooting

### Common Issues

1. **SharedArrayBuffer not available**: Requires proper CORS headers (`Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy`)

2. **Video conversion fails**: Check that `SUPPORTS_VIDEO_CONVERSION=true` is set and SharedArrayBuffer is available

3. **Worker not loading**: Ensure worker files are properly bundled and accessible via `new URL()`

4. **Memory leaks**: Always transfer ArrayBuffers and clean up FFmpeg temporary files

5. **Progress not updating**: Ensure progress callbacks are properly connected between worker and UI

## See Also

- [Capability Detection](capability-detection.md) - Environment capability detection
- [Conversion System](conversion-system.md) - Overall conversion architecture  
- [Tool System](tool-system.md) - Integration with tool pages
- [Video Conversion Recipe](../recipes/enable-video-mode.md) - Setting up video conversion