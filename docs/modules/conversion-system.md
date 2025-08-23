# Conversion System

Core file conversion architecture including image processing, PDF handling, and video conversion.

## Overview

The conversion system provides a unified interface for converting between various file formats. It uses Web Workers for processing, supports multiple conversion pipelines, and handles format-specific optimizations.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   UI Layer  │────▶│   Workers   │────▶│  Libraries  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
   HeroConverter    convert.worker.ts    FFmpeg.wasm
   BatchConverter   compress.worker.ts   PDF.js
                                         Image codecs
```

## Conversion Operations

### Operation Types

| Operation | Description | Formats | Library |
|-----------|-------------|---------|---------|
| `raster` | Image conversion | JPG, PNG, WEBP, GIF, BMP | Native + polyfills |
| `video` | Video/audio conversion | MP4, MKV, MP3, WAV | FFmpeg.wasm |
| `pdf-pages` | PDF to images | PDF → JPG/PNG | PDF.js |

### Operation Detection

```typescript
function determineOperation(from: string, to: string): string {
  if (from === 'pdf') {
    return 'pdf-pages';
  }
  
  if (isVideoFormat(from) || isAudioFormat(to)) {
    return 'video';
  }
  
  return 'raster';
}
```

## Image Conversion

### Decode Pipeline

```typescript
// lib/convert/decode.ts
export async function decodeToRGBA(
  buffer: ArrayBuffer,
  format: string
): Promise<ImageData> {
  const decoder = getDecoder(format);
  return decoder(buffer);
}

const decoders: Record<string, Decoder> = {
  'jpg': decodeJPEG,
  'jpeg': decodeJPEG,
  'png': decodePNG,
  'webp': decodeWebP,
  'gif': decodeGIF,
  'bmp': decodeBMP,
  'heic': decodeHEIC,
  'heif': decodeHEIF,
  'avif': decodeAVIF
};
```

### Encode Pipeline

```typescript
// lib/convert/encode.ts
export async function encodeFromRGBA(
  imageData: ImageData,
  format: string,
  options: EncodeOptions = {}
): Promise<ArrayBuffer> {
  const encoder = getEncoder(format);
  return encoder(imageData, options);
}

interface EncodeOptions {
  quality?: number;      // 0-1 for lossy formats
  lossless?: boolean;    // For WebP
  effort?: number;       // Compression effort
  colors?: number;       // For GIF palette
}
```

### Format-Specific Handlers

#### JPEG Codec

```typescript
async function decodeJPEG(buffer: ArrayBuffer): Promise<ImageData> {
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  const bitmap = await createImageBitmap(blob);
  
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

async function encodeJPEG(
  imageData: ImageData,
  quality = 0.9
): Promise<ArrayBuffer> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  
  const blob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality
  });
  
  return blob.arrayBuffer();
}
```

#### WebP Codec

```typescript
async function decodeWebP(buffer: ArrayBuffer): Promise<ImageData> {
  // Use native browser support if available
  if (supportsWebP()) {
    return nativeWebPDecode(buffer);
  }
  
  // Fall back to WebP polyfill
  const { decode } = await import('webp-hero');
  return decode(buffer);
}

async function encodeWebP(
  imageData: ImageData,
  options: WebPOptions
): Promise<ArrayBuffer> {
  if (supportsWebP()) {
    return nativeWebPEncode(imageData, options);
  }
  
  const { encode } = await import('webp-hero');
  return encode(imageData, options);
}
```

#### HEIC/HEIF Support

```typescript
// lib/convert/heif.ts
import heic2any from 'heic2any';

export async function decodeHeifToRGBA(
  buffer: ArrayBuffer
): Promise<ImageData> {
  // Convert HEIC to JPEG first
  const jpegBlob = await heic2any({
    blob: new Blob([buffer]),
    toType: 'image/jpeg',
    quality: 1
  });
  
  // Then decode JPEG to RGBA
  const jpegBuffer = await jpegBlob.arrayBuffer();
  return decodeJPEG(jpegBuffer);
}
```

## Video Conversion

### FFmpeg.wasm Integration

```typescript
// lib/convert/video.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

class VideoConverter {
  private ffmpeg: FFmpeg | null = null;
  
  async initialize() {
    if (this.ffmpeg) return;
    
    this.ffmpeg = new FFmpeg();
    
    // Set up progress callback
    this.ffmpeg.on('progress', ({ progress }) => {
      self.postMessage({ type: 'progress', progress });
    });
    
    // Load FFmpeg
    await this.ffmpeg.load();
  }
  
  async convert(
    input: ArrayBuffer,
    fromFormat: string,
    toFormat: string,
    options: VideoOptions = {}
  ): Promise<ArrayBuffer> {
    await this.initialize();
    
    const inputFile = `input.${fromFormat}`;
    const outputFile = `output.${toFormat}`;
    
    // Write input
    await this.ffmpeg!.writeFile(inputFile, new Uint8Array(input));
    
    // Build command
    const args = this.buildArgs(inputFile, outputFile, options);
    
    // Execute
    await this.ffmpeg!.exec(args);
    
    // Read output
    const data = await this.ffmpeg!.readFile(outputFile);
    
    // Cleanup
    await this.cleanup([inputFile, outputFile]);
    
    return data.buffer;
  }
  
  private buildArgs(
    input: string,
    output: string,
    options: VideoOptions
  ): string[] {
    const args = ['-i', input];
    
    // Video codec
    if (options.videoCodec) {
      args.push('-c:v', options.videoCodec);
    }
    
    // Audio codec
    if (options.audioCodec) {
      args.push('-c:a', options.audioCodec);
    }
    
    // Bitrate
    if (options.videoBitrate) {
      args.push('-b:v', options.videoBitrate);
    }
    if (options.audioBitrate) {
      args.push('-b:a', options.audioBitrate);
    }
    
    // Quality
    if (options.crf) {
      args.push('-crf', options.crf.toString());
    }
    
    // Preset
    if (options.preset) {
      args.push('-preset', options.preset);
    }
    
    args.push(output);
    return args;
  }
}
```

### Format Presets

```typescript
const formatPresets: Record<string, VideoOptions> = {
  'mp4': {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    preset: 'fast',
    crf: 23
  },
  'webm': {
    videoCodec: 'libvpx-vp9',
    audioCodec: 'libopus',
    crf: 30
  },
  'mp3': {
    audioCodec: 'libmp3lame',
    audioBitrate: '192k'
  },
  'wav': {
    audioCodec: 'pcm_s16le'
  },
  'ogg': {
    audioCodec: 'libvorbis',
    audioBitrate: '192k'
  }
};
```

## PDF Processing

### PDF.js Integration

```typescript
// lib/convert/pdf.ts
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.js';

export async function renderPdfPages(
  pdfBuffer: ArrayBuffer,
  options: PdfOptions = {}
): Promise<PageResult[]> {
  const pdf = await pdfjsLib.getDocument({
    data: pdfBuffer,
    cMapUrl: '/vendor/pdfjs/cmaps/',
    cMapPacked: true
  }).promise;
  
  const pages: PageResult[] = [];
  const pageNumbers = options.pages || 
    Array.from({ length: pdf.numPages }, (_, i) => i + 1);
  
  for (const pageNum of pageNumbers) {
    const page = await pdf.getPage(pageNum);
    const image = await renderPage(page, options);
    
    pages.push({
      pageNumber: pageNum,
      image,
      width: page.view[2],
      height: page.view[3]
    });
  }
  
  return pages;
}

async function renderPage(
  page: PDFPageProxy,
  options: PdfOptions
): Promise<ArrayBuffer> {
  const scale = options.scale || 2;
  const viewport = page.getViewport({ scale });
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  const context = canvas.getContext('2d')!;
  
  // Render PDF page
  await page.render({
    canvasContext: context,
    viewport,
    intent: 'display'
  }).promise;
  
  // Convert to desired format
  const format = options.format || 'png';
  const blob = await canvasToBlob(canvas, format, options.quality);
  
  return blob.arrayBuffer();
}
```

### PDF Options

```typescript
interface PdfOptions {
  pages?: number[];      // Specific pages to render
  scale?: number;        // Render scale (default: 2)
  format?: string;       // Output format (jpg, png)
  quality?: number;      // JPEG quality (0-1)
  maxWidth?: number;     // Maximum width
  maxHeight?: number;    // Maximum height
}
```

## Worker Implementation

### Main Worker

```typescript
// workers/convert.worker.ts
self.addEventListener('message', async (event: MessageEvent) => {
  const { op, from, to, buf, options } = event.data;
  
  try {
    let result: ArrayBuffer | ArrayBuffer[];
    
    switch (op) {
      case 'raster':
        result = await processRaster(buf, from, to, options);
        break;
        
      case 'video':
        result = await processVideo(buf, from, to, options);
        break;
        
      case 'pdf-pages':
        result = await processPdf(buf, from, to, options);
        break;
        
      default:
        throw new Error(`Unknown operation: ${op}`);
    }
    
    // Send result back
    if (Array.isArray(result)) {
      self.postMessage({ ok: true, blobs: result }, result);
    } else {
      self.postMessage({ ok: true, blob: result }, [result]);
    }
    
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error?.message || 'Conversion failed'
    });
  }
});

async function processRaster(
  buffer: ArrayBuffer,
  from: string,
  to: string,
  options: any
): Promise<ArrayBuffer> {
  const { decodeToRGBA } = await import('../lib/convert/decode');
  const { encodeFromRGBA } = await import('../lib/convert/encode');
  
  const rgba = await decodeToRGBA(buffer, from);
  return encodeFromRGBA(rgba, to, options);
}
```

## Optimization Strategies

### Caching

```typescript
class ConversionCache {
  private cache = new Map<string, ArrayBuffer>();
  private maxSize = 100 * 1024 * 1024; // 100MB
  private currentSize = 0;
  
  getCacheKey(buffer: ArrayBuffer, from: string, to: string): string {
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hashHex}-${from}-${to}`;
  }
  
  async get(
    buffer: ArrayBuffer,
    from: string,
    to: string
  ): Promise<ArrayBuffer | null> {
    const key = await this.getCacheKey(buffer, from, to);
    return this.cache.get(key) || null;
  }
  
  async set(
    buffer: ArrayBuffer,
    from: string,
    to: string,
    result: ArrayBuffer
  ): Promise<void> {
    const key = await this.getCacheKey(buffer, from, to);
    
    // Evict if necessary
    if (this.currentSize + result.byteLength > this.maxSize) {
      this.evict(result.byteLength);
    }
    
    this.cache.set(key, result);
    this.currentSize += result.byteLength;
  }
}
```

### Streaming

```typescript
async function* streamConversion(
  input: ReadableStream,
  from: string,
  to: string
): AsyncGenerator<ArrayBuffer> {
  const reader = input.getReader();
  const converter = new StreamConverter(from, to);
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = await converter.processChunk(value);
      if (chunk) yield chunk;
    }
    
    const final = await converter.finalize();
    if (final) yield final;
    
  } finally {
    reader.releaseLock();
  }
}
```

## Error Handling

### Error Types

```typescript
class ConversionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ConversionError';
  }
}

class UnsupportedFormatError extends ConversionError {
  constructor(format: string) {
    super(
      `Unsupported format: ${format}`,
      'UNSUPPORTED_FORMAT',
      { format }
    );
  }
}

class CorruptedFileError extends ConversionError {
  constructor(details: string) {
    super(
      'File appears to be corrupted',
      'CORRUPTED_FILE',
      { details }
    );
  }
}
```

### Recovery Strategies

```typescript
async function convertWithFallback(
  buffer: ArrayBuffer,
  from: string,
  to: string
): Promise<ArrayBuffer> {
  try {
    // Try primary method
    return await convertDirect(buffer, from, to);
  } catch (error) {
    console.warn('Primary conversion failed, trying fallback', error);
    
    // Try intermediate format
    if (from === 'heic' && to === 'png') {
      const jpeg = await convertDirect(buffer, 'heic', 'jpg');
      return convertDirect(jpeg, 'jpg', 'png');
    }
    
    throw error;
  }
}
```

## Testing

### Unit Tests

```typescript
describe('Conversion System', () => {
  describe('Image Conversion', () => {
    it('should convert JPG to PNG', async () => {
      const jpgBuffer = await loadTestFile('test.jpg');
      const pngBuffer = await convert(jpgBuffer, 'jpg', 'png');
      
      expect(pngBuffer).toBeInstanceOf(ArrayBuffer);
      expect(isPNG(pngBuffer)).toBe(true);
    });
  });
  
  describe('Video Conversion', () => {
    it('should convert MP4 to MP3', async () => {
      const mp4Buffer = await loadTestFile('test.mp4');
      const mp3Buffer = await convert(mp4Buffer, 'mp4', 'mp3');
      
      expect(mp3Buffer).toBeInstanceOf(ArrayBuffer);
      expect(isMP3(mp3Buffer)).toBe(true);
    });
  });
});
```

## Performance Metrics

```typescript
interface ConversionMetrics {
  format: { from: string; to: string };
  inputSize: number;
  outputSize: number;
  duration: number;
  memoryUsed: number;
  compressionRatio: number;
}

function measureConversion(
  input: ArrayBuffer,
  output: ArrayBuffer,
  startTime: number
): ConversionMetrics {
  return {
    inputSize: input.byteLength,
    outputSize: output.byteLength,
    duration: performance.now() - startTime,
    memoryUsed: performance.memory?.usedJSHeapSize || 0,
    compressionRatio: input.byteLength / output.byteLength
  };
}
```

## See Also

- [Converter Pattern](../patterns/converter-pattern.md) - Implementation patterns
- [Worker Pattern](../patterns/worker-pattern.md) - Worker architecture
- [Capability Detection](capability-detection.md) - Feature detection
- [Add New Converter](../recipes/add-new-converter.md) - Adding formats