# Worker Pattern

Web Worker implementation for CPU-intensive operations in SerpTools.

## Overview

Web Workers allow CPU-intensive file conversions to run in background threads, keeping the UI responsive. The worker pattern handles message passing, error management, and progress reporting.

## Related Files

- `/workers/convert.worker.ts` - Main conversion worker
- `/workers/compress.worker.ts` - ZIP compression worker
- `/components/HeroConverter.tsx` - Worker integration
- `/lib/convert/*` - Conversion libraries

## Worker Architecture

```
Main Thread                    Worker Thread
    │                              │
    ├─ postMessage(data) ─────────>│
    │                              ├─ Process data
    │                              ├─ Import libraries
    │<──── postMessage(result) ────├─ Execute conversion
    │                              │
```

## Creating Workers

### Worker Instantiation

```typescript
// In component
const workerRef = useRef<Worker | null>(null);

useEffect(() => {
  // Create worker with module support
  workerRef.current = new Worker(
    new URL("../workers/convert.worker.ts", import.meta.url),
    { type: "module" }
  );
  
  // Set up message handler
  workerRef.current.onmessage = handleWorkerMessage;
  workerRef.current.onerror = handleWorkerError;
  
  // Cleanup on unmount
  return () => {
    workerRef.current?.terminate();
  };
}, []);
```

### Worker Implementation

```typescript
// workers/convert.worker.ts
self.addEventListener('message', async (event: MessageEvent) => {
  const { op, from, to, buf } = event.data;
  
  try {
    let result: ArrayBuffer;
    
    switch (op) {
      case "raster":
        result = await processImage(buf, from, to);
        break;
      case "video":
        result = await processVideo(buf, from, to);
        break;
      case "pdf-pages":
        result = await processPdf(buf, from, to);
        break;
      default:
        throw new Error(`Unknown operation: ${op}`);
    }
    
    // Transfer result back
    self.postMessage({ ok: true, blob: result }, [result]);
  } catch (error) {
    self.postMessage({ 
      ok: false, 
      error: error?.message || 'Processing failed' 
    });
  }
});
```

## Message Protocol

### Request Message

```typescript
interface WorkerRequest {
  op: 'raster' | 'video' | 'pdf-pages';
  from: string;
  to: string;
  buf: ArrayBuffer;
  options?: {
    quality?: number;
    scale?: number;
    pages?: number[];
  };
}

// Send with transferable objects
worker.postMessage(request, [request.buf]);
```

### Response Messages

```typescript
interface WorkerResponse {
  ok: boolean;
  blob?: ArrayBuffer;
  error?: string;
  type?: 'progress' | 'complete';
  progress?: number;
}

// Success response
{ ok: true, blob: ArrayBuffer, type: 'complete' }

// Error response
{ ok: false, error: 'Conversion failed: Invalid format' }

// Progress update
{ type: 'progress', progress: 0.5 }
```

## Progress Reporting

### Sending Progress Updates

```typescript
// In worker
async function processWithProgress(data: ArrayBuffer) {
  const totalSteps = 100;
  
  for (let i = 0; i < totalSteps; i++) {
    // Do work...
    
    // Report progress
    self.postMessage({
      type: 'progress',
      progress: i / totalSteps
    });
  }
  
  return result;
}
```

### Handling Progress

```typescript
// In component
worker.onmessage = (event: MessageEvent) => {
  if (event.data.type === 'progress') {
    setProgress(event.data.progress * 100);
    return;
  }
  
  if (event.data.ok) {
    // Handle completion
  }
};
```

## Transferable Objects

### Efficient Data Transfer

```typescript
// Transfer ownership instead of copying
const buffer = await file.arrayBuffer();

// This transfers ownership to worker (zero-copy)
worker.postMessage({ buf: buffer }, [buffer]);

// buffer is now detached in main thread
console.log(buffer.byteLength); // 0
```

### Multiple Transfers

```typescript
// Transfer multiple buffers
const buffers = [buffer1, buffer2, buffer3];
worker.postMessage(
  { buffers },
  buffers // Transfer all
);
```

## Dynamic Imports

### Lazy Loading Libraries

```typescript
// In worker - load only what's needed
self.addEventListener('message', async (event) => {
  const { op } = event.data;
  
  if (op === 'video') {
    // Load FFmpeg only for video
    const { convertVideo } = await import('../lib/convert/video');
    const result = await convertVideo(event.data);
    // ...
  } else if (op === 'pdf-pages') {
    // Load PDF.js only for PDFs
    const { renderPdfPages } = await import('../lib/convert/pdf');
    const result = await renderPdfPages(event.data);
    // ...
  }
});
```

## Error Handling

### Worker Error Boundaries

```typescript
// In worker
self.addEventListener('message', async (event) => {
  try {
    const result = await processData(event.data);
    self.postMessage({ ok: true, result });
  } catch (error) {
    // Catch all errors
    console.error('Worker error:', error);
    
    // Send error message
    self.postMessage({
      ok: false,
      error: error instanceof Error 
        ? error.message 
        : 'Unknown error occurred'
    });
  }
});
```

### Component Error Handling

```typescript
// In component
const handleWorkerError = (error: ErrorEvent) => {
  console.error('Worker crashed:', error);
  setError('Processing failed. Please try again.');
  setBusy(false);
  
  // Restart worker if needed
  restartWorker();
};

worker.onerror = handleWorkerError;
```

## Worker Pool Pattern

### Managing Multiple Workers

```typescript
class WorkerPool {
  private workers: Worker[] = [];
  private queue: Task[] = [];
  private busy: Map<Worker, boolean> = new Map();
  
  constructor(size: number, workerUrl: string) {
    for (let i = 0; i < size; i++) {
      const worker = new Worker(workerUrl, { type: 'module' });
      this.workers.push(worker);
      this.busy.set(worker, false);
    }
  }
  
  async process(data: any): Promise<any> {
    const worker = await this.getAvailableWorker();
    this.busy.set(worker, true);
    
    return new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        this.busy.set(worker, false);
        resolve(e.data);
        this.processQueue();
      };
      
      worker.postMessage(data);
    });
  }
  
  private async getAvailableWorker(): Promise<Worker> {
    const available = this.workers.find(w => !this.busy.get(w));
    if (available) return available;
    
    // Wait for worker to become available
    return new Promise(resolve => {
      this.queue.push({ resolve });
    });
  }
}
```

## Memory Management

### Cleanup After Processing

```typescript
// In worker
let ffmpeg: FFmpeg | null = null;

self.addEventListener('message', async (event) => {
  if (event.data.type === 'cleanup') {
    // Clean up resources
    if (ffmpeg) {
      ffmpeg.terminate();
      ffmpeg = null;
    }
    
    // Force garbage collection hint
    if (global.gc) global.gc();
  }
});
```

### Component Cleanup

```typescript
useEffect(() => {
  const worker = new Worker(...);
  
  return () => {
    // Send cleanup message
    worker.postMessage({ type: 'cleanup' });
    
    // Terminate worker
    setTimeout(() => worker.terminate(), 100);
  };
}, []);
```

## SharedArrayBuffer Support

### Checking Availability

```typescript
// In worker or main thread
const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

if (!hasSharedArrayBuffer) {
  console.warn('SharedArrayBuffer not available');
  // Fall back to alternative method
}
```

### Using SharedArrayBuffer

```typescript
// When available (requires special headers)
const sharedBuffer = new SharedArrayBuffer(1024 * 1024);
const sharedArray = new Int32Array(sharedBuffer);

// Can be shared between workers without copying
worker1.postMessage({ shared: sharedBuffer });
worker2.postMessage({ shared: sharedBuffer });
```

## Worker Communication Patterns

### Request-Response Pattern

```typescript
// Wrap worker in Promise
function processFile(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(...);
    
    worker.onmessage = (e) => {
      if (e.data.ok) {
        resolve(new Blob([e.data.blob]));
      } else {
        reject(new Error(e.data.error));
      }
      worker.terminate();
    };
    
    worker.onerror = reject;
    
    file.arrayBuffer().then(buffer => {
      worker.postMessage({ buffer }, [buffer]);
    });
  });
}
```

### Streaming Pattern

```typescript
// For large file processing
self.addEventListener('message', async (event) => {
  const { chunks } = event.data;
  
  for (const chunk of chunks) {
    const processed = await processChunk(chunk);
    
    // Stream results back
    self.postMessage({
      type: 'chunk',
      data: processed
    }, [processed]);
  }
  
  self.postMessage({ type: 'complete' });
});
```

## TypeScript in Workers

### Worker Types

```typescript
// types/worker.types.ts
export interface ConvertWorkerRequest {
  op: 'raster' | 'video' | 'pdf-pages';
  from: string;
  to: string;
  buf: ArrayBuffer;
}

export interface ConvertWorkerResponse {
  ok: boolean;
  blob?: ArrayBuffer;
  error?: string;
}
```

### Typed Worker Context

```typescript
// workers/convert.worker.ts
declare const self: DedicatedWorkerGlobalScope;

self.addEventListener('message', async (
  event: MessageEvent<ConvertWorkerRequest>
) => {
  const response: ConvertWorkerResponse = {
    ok: true,
    blob: processedData
  };
  
  self.postMessage(response);
});
```

## Performance Optimization

### Minimize Data Transfer

```typescript
// Bad: Copying large data
const copy = buffer.slice(0);
worker.postMessage({ data: copy });

// Good: Transfer ownership
worker.postMessage({ data: buffer }, [buffer]);
```

### Reuse Workers

```typescript
// Bad: Create new worker for each task
function processFile(file) {
  const worker = new Worker(...);
  // Process
  worker.terminate();
}

// Good: Reuse worker
const worker = new Worker(...);
function processFile(file) {
  return new Promise(resolve => {
    worker.onmessage = resolve;
    worker.postMessage(file);
  });
}
```

## Best Practices

1. **Always Transfer ArrayBuffers**: Use transferable objects
2. **Handle Errors Gracefully**: Catch and report all errors
3. **Clean Up Resources**: Terminate workers when done
4. **Use TypeScript**: Type your worker messages
5. **Lazy Load Libraries**: Import only when needed
6. **Report Progress**: Keep users informed
7. **Validate Input**: Check data before processing

## Common Issues

### Worker Not Loading
- Check webpack/build configuration
- Verify worker file path
- Ensure `type: "module"` for ES modules

### Memory Leaks
- Terminate workers when done
- Clear references to large objects
- Use transferable objects

### Performance Issues
- Avoid copying large buffers
- Use worker pools for parallel processing
- Implement progress reporting

## See Also

- [Converter Pattern](converter-pattern.md) - Conversion architecture
- [Component Pattern](component-pattern.md) - UI integration
- [Worker System](../modules/worker-system.md) - Implementation details
- [Performance Guide](../recipes/optimize-performance.md) - Optimization tips