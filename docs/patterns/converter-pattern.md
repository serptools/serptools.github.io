# Converter Pattern

File conversion architecture and processing pipelines in SerpTools.

## Overview

The converter pattern uses Web Workers to handle CPU-intensive file conversions without blocking the UI. Different file types are routed to appropriate processing pipelines based on their format characteristics.

## Related Files

- `/workers/convert.worker.ts` - Main conversion worker
- `/lib/convert/video.ts` - Video/audio conversion with FFmpeg
- `/lib/convert/decode.ts` - Image decoding
- `/lib/convert/encode.ts` - Image encoding
- `/lib/convert/pdf.ts` - PDF processing
- `/components/HeroConverter.tsx` - UI integration

## Conversion Pipeline

```
User Input → Format Detection → Operation Router → Worker → Processing → Output
                                        ↓
                                 [raster|video|pdf-pages]
```

## Operation Types

### Raster Operation (Images)

For image format conversions:

```typescript
// In convert.worker.ts
case "raster": {
  const rgba = await decodeToRGBA(inputBuffer, fromFormat);
  const outputBuffer = await encodeFromRGBA(rgba, toFormat);
  return outputBuffer;
}
```

Supported formats:
- **Input**: JPG, PNG, WEBP, GIF, BMP, TIFF, ICO, AVIF, HEIC
- **Output**: JPG, PNG, WEBP, GIF, BMP, ICO, AVIF

### Video Operation (Video/Audio)

For video and audio conversions using FFmpeg.wasm:

```typescript
// In convert.worker.ts
case "video": {
  const { convertVideo } = await import("../lib/convert/video");
  const outputBuffer = await convertVideo(inputBuffer, fromFormat, toFormat);
  return outputBuffer;
}
```

Supported formats:
- **Video**: MP4, MKV, AVI, WEBM, MOV, FLV, WMV, M4V, MPG, MPEG
- **Audio**: MP3, WAV, OGG, AAC, M4A, WMA, FLAC, OPUS

### PDF-Pages Operation

For converting PDF to images:

```typescript
// In convert.worker.ts
case "pdf-pages": {
  const { renderPdfPages } = await import("../lib/convert/pdf");
  const images = await renderPdfPages(inputBuffer, {
    format: toFormat,
    scale: 2
  });
  return images;
}
```

## Format Detection

### Determining Operation Type

```typescript
function determineOperation(from: string, to: string): string {
  const videoFormats = ['mp4', 'mkv', 'avi', 'webm', 'mov', 'flv'];
  const audioFormats = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
  
  if (from === "pdf") {
    return "pdf-pages";
  } else if (videoFormats.includes(from) || audioFormats.includes(to)) {
    return "video";
  } else {
    return "raster";
  }
}
```

### MIME Type Mapping

```typescript
const mimeTypeMap: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  // ...
};
```

## Worker Communication

### Sending Conversion Request

```typescript
// In HeroConverter.tsx
const worker = new Worker(
  new URL("../workers/convert.worker.ts", import.meta.url),
  { type: "module" }
);

// Transfer ArrayBuffer ownership for performance
worker.postMessage(
  {
    op: "raster",
    from: "jpg",
    to: "png",
    buf: arrayBuffer
  },
  [arrayBuffer] // Transferable objects
);
```

### Handling Response

```typescript
worker.onmessage = (ev: MessageEvent) => {
  // Progress updates
  if (ev.data?.type === 'progress') {
    setProgress(ev.data.progress);
    return;
  }
  
  // Handle errors
  if (!ev.data?.ok) {
    console.error('Conversion failed:', ev.data.error);
    return;
  }
  
  // Process result
  const blob = new Blob([ev.data.blob], { 
    type: getMimeType(toFormat) 
  });
  saveBlob(blob, `converted.${toFormat}`);
};
```

## Image Processing

### Decode Pipeline

```typescript
// lib/convert/decode.ts
export async function decodeToRGBA(
  buffer: ArrayBuffer,
  format: string
): Promise<ImageData> {
  switch (format) {
    case 'jpg':
    case 'jpeg':
      return decodeJPEG(buffer);
    case 'png':
      return decodePNG(buffer);
    case 'webp':
      return decodeWebP(buffer);
    case 'heic':
    case 'heif':
      return decodeHEIF(buffer);
    // ...
  }
}
```

### Encode Pipeline

```typescript
// lib/convert/encode.ts
export async function encodeFromRGBA(
  imageData: ImageData,
  format: string,
  quality = 0.9
): Promise<ArrayBuffer> {
  switch (format) {
    case 'jpg':
    case 'jpeg':
      return encodeJPEG(imageData, quality);
    case 'png':
      return encodePNG(imageData);
    case 'webp':
      return encodeWebP(imageData, quality);
    // ...
  }
}
```

## Video Processing

### FFmpeg.wasm Integration

```typescript
// lib/convert/video.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';

let ffmpeg: FFmpeg | null = null;

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  ffmpeg = new FFmpeg();
  
  await ffmpeg.load({
    coreURL: '/vendor/ffmpeg/ffmpeg-core.js',
    wasmURL: '/vendor/ffmpeg/ffmpeg-core.wasm'
  });
  
  return ffmpeg;
}
```

### Video Conversion

```typescript
export async function convertVideo(
  inputBuffer: ArrayBuffer,
  fromFormat: string,
  toFormat: string
): Promise<ArrayBuffer> {
  const ffmpeg = await loadFFmpeg();
  
  // Write input file
  await ffmpeg.writeFile(
    `input.${fromFormat}`,
    new Uint8Array(inputBuffer)
  );
  
  // Build conversion arguments
  const args = ['-i', `input.${fromFormat}`];
  
  // Format-specific settings
  if (toFormat === 'mp3') {
    args.push('-codec:a', 'libmp3lame', '-b:a', '192k');
  } else if (toFormat === 'webm') {
    args.push('-c:v', 'libvpx-vp9', '-crf', '30');
  }
  // ... more format settings
  
  args.push(`output.${toFormat}`);
  
  // Execute conversion
  await ffmpeg.exec(args);
  
  // Read output
  const data = await ffmpeg.readFile(`output.${toFormat}`);
  return data.buffer;
}
```

## PDF Processing

### PDF.js Integration

```typescript
// lib/convert/pdf.ts
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 
  '/vendor/pdfjs/pdf.worker.min.js';

export async function renderPdfPages(
  buffer: ArrayBuffer,
  options: {
    format: string;
    scale?: number;
    pages?: number[];
  }
): Promise<ArrayBuffer[]> {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const images: ArrayBuffer[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: options.scale || 2 });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: canvas.getContext('2d')!,
      viewport
    }).promise;
    
    const blob = await canvasToBlob(canvas, options.format);
    images.push(await blob.arrayBuffer());
  }
  
  return images;
}
```

## Error Handling

### Worker Error Handling

```typescript
// In worker
self.addEventListener('message', async (ev) => {
  try {
    const result = await processConversion(ev.data);
    self.postMessage({ ok: true, blob: result }, [result]);
  } catch (error) {
    self.postMessage({ 
      ok: false, 
      error: error?.message || 'Conversion failed' 
    });
  }
});
```

### Capability Checking

```typescript
// Before video conversion
if (!capabilities.supportsVideoConversion) {
  throw new Error(
    'Video conversion requires server mode. ' +
    'Please use the server deployment for this feature.'
  );
}
```

## Performance Optimization

### Transferable Objects

```typescript
// Transfer ownership instead of copying
worker.postMessage(
  { data: largeArrayBuffer },
  [largeArrayBuffer] // Transfers ownership
);
```

### Memory Management

```typescript
// Clean up after conversion
export async function cleanupFFmpeg() {
  if (ffmpeg) {
    ffmpeg.terminate();
    ffmpeg = null;
  }
}
```

### Progressive Loading

```typescript
// Load heavy libraries only when needed
if (operation === 'video') {
  const { convertVideo } = await import('../lib/convert/video');
  // Use convertVideo
}
```

## Format-Specific Optimizations

### GIF Optimization

```typescript
// Special handling for animated GIFs
if (format === 'gif') {
  const { optimizeGif } = await import('../lib/convert/gif');
  return optimizeGif(buffer, { colors: 256 });
}
```

### HEIC/HEIF Processing

```typescript
// Special decoder for Apple formats
if (format === 'heic' || format === 'heif') {
  const { decodeHeifToRGBA } = await import('../lib/convert/heif');
  return decodeHeifToRGBA(buffer);
}
```

## Best Practices

1. **Use Workers for Heavy Operations**: Keep UI responsive
2. **Transfer ArrayBuffers**: Avoid copying large data
3. **Lazy Load Libraries**: Import on demand
4. **Clean Up Resources**: Terminate workers and free memory
5. **Handle Errors Gracefully**: Provide user feedback
6. **Check Capabilities**: Verify feature support before use

## Common Issues

### SharedArrayBuffer Not Available
- **Issue**: Video conversion fails in static builds
- **Solution**: Use capability detection and show warnings

### Large File Processing
- **Issue**: Browser memory limits
- **Solution**: Stream processing or chunk handling

### Format Support
- **Issue**: Browser codec limitations
- **Solution**: Use appropriate polyfills or fallbacks

## See Also

- [Worker Pattern](worker-pattern.md) - Worker implementation details
- [Component Pattern](component-pattern.md) - UI integration
- [Capability Detection](../modules/capability-detection.md) - Feature detection
- [Add New Converter](../recipes/add-new-converter.md) - Implementation guide