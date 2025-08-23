# Worker System

Web Worker implementation for offloading CPU-intensive tasks from the main thread.

## Overview

The worker system provides background processing for file conversions, preventing UI freezes during intensive operations. It handles message passing, error management, progress reporting, and resource cleanup.

## Worker Architecture

### System Components

```
Main Thread                    Worker Thread                   Libraries
     │                              │                              │
  UI Events ──────────────▶  Message Handler ────────────▶  FFmpeg.wasm
     │                              │                              │
  Progress ◀──────────────  Progress Events  ◀────────────    PDF.js
     │                              │                              │
  Results  ◀──────────────   Process Files   ◀────────────  Image Codecs
```

### Worker Types

| Worker | Purpose | Operations |
|--------|---------|------------|
| `convert.worker.ts` | File conversion | Image, video, PDF processing |
| `compress.worker.ts` | ZIP compression | Create ZIP archives |
| `optimize.worker.ts` | Image optimization | Compress and resize images |

## Main Worker Implementation

### Worker Entry Point

```typescript
// workers/convert.worker.ts
declare const self: DedicatedWorkerGlobalScope;

// Message handler
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;
  
  try {
    const result = await handleMessage(type, payload);
    
    self.postMessage({
      id,
      type: 'success',
      payload: result
    }, getTransferables(result));
    
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      payload: {
        message: error?.message || 'Operation failed',
        code: error?.code || 'UNKNOWN_ERROR'
      }
    });
  }
});

async function handleMessage(type: string, payload: any): Promise<any> {
  switch (type) {
    case 'convert':
      return handleConvert(payload);
    case 'compress':
      return handleCompress(payload);
    case 'optimize':
      return handleOptimize(payload);
    default:
      throw new Error(`Unknown message type: ${type}`);
  }
}
```

### Message Protocol

```typescript
// Incoming message
interface WorkerMessage {
  id: string;                    // Unique message ID
  type: 'convert' | 'compress' | 'optimize';
  payload: {
    operation: string;
    data: ArrayBuffer | ArrayBuffer[];
    options?: any;
  };
}

// Outgoing message
interface WorkerResponse {
  id: string;                    // Matching message ID
  type: 'success' | 'error' | 'progress';
  payload: any;
}
```

## Conversion Operations

### Operation Router

```typescript
async function handleConvert(payload: ConvertPayload): Promise<ArrayBuffer> {
  const { operation, from, to, data, options } = payload;
  
  switch (operation) {
    case 'raster':
      return convertImage(data, from, to, options);
      
    case 'video':
      return convertVideo(data, from, to, options);
      
    case 'pdf-pages':
      return convertPdfToImages(data, from, to, options);
      
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
```

### Image Conversion

```typescript
async function convertImage(
  buffer: ArrayBuffer,
  from: string,
  to: string,
  options: ImageOptions = {}
): Promise<ArrayBuffer> {
  // Dynamic imports for code splitting
  const { decodeToRGBA } = await import('../lib/convert/decode');
  const { encodeFromRGBA } = await import('../lib/convert/encode');
  
  // Report progress
  self.postMessage({ type: 'progress', payload: { stage: 'decoding', progress: 0 }});
  
  // Decode to RGBA
  const imageData = await decodeToRGBA(buffer, from);
  
  self.postMessage({ type: 'progress', payload: { stage: 'decoding', progress: 50 }});
  
  // Apply transformations if needed
  const processed = await applyTransformations(imageData, options);
  
  self.postMessage({ type: 'progress', payload: { stage: 'encoding', progress: 75 }});
  
  // Encode to target format
  const result = await encodeFromRGBA(processed, to, options);
  
  self.postMessage({ type: 'progress', payload: { stage: 'complete', progress: 100 }});
  
  return result;
}
```

## Worker Management

### Worker Pool

```typescript
class WorkerPool {
  private workers: Worker[] = [];
  private available: Worker[] = [];
  private queue: QueuedTask[] = [];
  private tasks: Map<string, TaskInfo> = new Map();
  
  constructor(
    private workerUrl: URL,
    private size: number = navigator.hardwareConcurrency || 4
  ) {
    this.initialize();
  }
  
  private initialize() {
    for (let i = 0; i < this.size; i++) {
      const worker = new Worker(this.workerUrl, { type: 'module' });
      this.setupWorker(worker);
      this.workers.push(worker);
      this.available.push(worker);
    }
  }
  
  private setupWorker(worker: Worker) {
    worker.onmessage = (event) => {
      const { id, type, payload } = event.data;
      const task = this.tasks.get(id);
      
      if (!task) return;
      
      switch (type) {
        case 'success':
          task.resolve(payload);
          this.completeTask(id, worker);
          break;
          
        case 'error':
          task.reject(new Error(payload.message));
          this.completeTask(id, worker);
          break;
          
        case 'progress':
          task.onProgress?.(payload);
          break;
      }
    };
    
    worker.onerror = (error) => {
      console.error('Worker error:', error);
      this.handleWorkerError(worker);
    };
  }
  
  async execute<T>(
    type: string,
    payload: any,
    onProgress?: (progress: any) => void
  ): Promise<T> {
    const id = generateId();
    
    return new Promise((resolve, reject) => {
      const task: TaskInfo = {
        id,
        type,
        payload,
        resolve,
        reject,
        onProgress
      };
      
      this.tasks.set(id, task);
      this.scheduleTask(task);
    });
  }
  
  private scheduleTask(task: TaskInfo) {
    const worker = this.available.pop();
    
    if (worker) {
      this.executeTask(task, worker);
    } else {
      this.queue.push(task);
    }
  }
  
  private executeTask(task: TaskInfo, worker: Worker) {
    const message: WorkerMessage = {
      id: task.id,
      type: task.type,
      payload: task.payload
    };
    
    const transferables = getTransferables(task.payload);
    worker.postMessage(message, transferables);
  }
  
  private completeTask(id: string, worker: Worker) {
    this.tasks.delete(id);
    
    // Process next queued task
    const nextTask = this.queue.shift();
    if (nextTask) {
      this.executeTask(nextTask, worker);
    } else {
      this.available.push(worker);
    }
  }
  
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.available = [];
    this.queue = [];
    this.tasks.clear();
  }
}
```

### Worker Lifecycle

```typescript
class ManagedWorker {
  private worker: Worker | null = null;
  private idleTimeout: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private readonly IDLE_TIMEOUT = 60000; // 1 minute
  
  async start(): Promise<void> {
    if (this.worker) return;
    
    this.worker = new Worker(
      new URL('../workers/convert.worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    this.setupHandlers();
    this.resetIdleTimeout();
  }
  
  private setupHandlers() {
    if (!this.worker) return;
    
    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = this.handleError.bind(this);
  }
  
  async execute(message: any): Promise<any> {
    await this.start();
    this.lastActivity = Date.now();
    this.resetIdleTimeout();
    
    return new Promise((resolve, reject) => {
      const id = generateId();
      const timeout = setTimeout(() => {
        reject(new Error('Worker timeout'));
      }, 30000);
      
      const handler = (event: MessageEvent) => {
        if (event.data.id !== id) return;
        
        clearTimeout(timeout);
        this.worker!.removeEventListener('message', handler);
        
        if (event.data.type === 'success') {
          resolve(event.data.payload);
        } else {
          reject(new Error(event.data.payload.message));
        }
      };
      
      this.worker!.addEventListener('message', handler);
      this.worker!.postMessage({ ...message, id });
    });
  }
  
  private resetIdleTimeout() {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
    
    this.idleTimeout = setTimeout(() => {
      this.terminate();
    }, this.IDLE_TIMEOUT);
  }
  
  terminate() {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
```

## Progress Reporting

### Progress Events

```typescript
interface ProgressEvent {
  stage: 'initialize' | 'processing' | 'encoding' | 'complete';
  progress: number;        // 0-100
  message?: string;
  current?: number;        // Current item
  total?: number;          // Total items
  eta?: number;            // Estimated time remaining (ms)
}

// In worker
function reportProgress(event: ProgressEvent) {
  self.postMessage({
    type: 'progress',
    payload: event
  });
}

// Example usage
async function processWithProgress(data: ArrayBuffer) {
  reportProgress({ stage: 'initialize', progress: 0 });
  
  const startTime = Date.now();
  const totalSteps = 100;
  
  for (let i = 0; i < totalSteps; i++) {
    // Process chunk
    await processChunk(data, i);
    
    const progress = ((i + 1) / totalSteps) * 100;
    const elapsed = Date.now() - startTime;
    const eta = (elapsed / (i + 1)) * (totalSteps - i - 1);
    
    reportProgress({
      stage: 'processing',
      progress,
      current: i + 1,
      total: totalSteps,
      eta
    });
  }
  
  reportProgress({ stage: 'complete', progress: 100 });
}
```

### Progress Aggregation

```typescript
class ProgressAggregator {
  private progresses: Map<string, number> = new Map();
  private weights: Map<string, number> = new Map();
  
  setProgress(id: string, progress: number, weight = 1) {
    this.progresses.set(id, progress);
    this.weights.set(id, weight);
  }
  
  getOverallProgress(): number {
    if (this.progresses.size === 0) return 0;
    
    let totalWeight = 0;
    let weightedProgress = 0;
    
    this.progresses.forEach((progress, id) => {
      const weight = this.weights.get(id) || 1;
      totalWeight += weight;
      weightedProgress += progress * weight;
    });
    
    return weightedProgress / totalWeight;
  }
  
  reset() {
    this.progresses.clear();
    this.weights.clear();
  }
}
```

## Memory Management

### Resource Cleanup

```typescript
// In worker
let resources: Map<string, any> = new Map();

self.addEventListener('message', async (event) => {
  if (event.data.type === 'cleanup') {
    await cleanup();
    return;
  }
  
  // Regular processing
});

async function cleanup() {
  // Clean up FFmpeg
  if (resources.has('ffmpeg')) {
    const ffmpeg = resources.get('ffmpeg');
    ffmpeg.terminate();
    resources.delete('ffmpeg');
  }
  
  // Clean up large buffers
  resources.clear();
  
  // Suggest garbage collection
  if (typeof gc !== 'undefined') {
    gc();
  }
  
  self.postMessage({ type: 'cleanup-complete' });
}
```

### Memory Monitoring

```typescript
class MemoryMonitor {
  private maxMemory = 500 * 1024 * 1024; // 500MB
  private checkInterval = 5000; // 5 seconds
  private interval: NodeJS.Timer | null = null;
  
  start() {
    this.interval = setInterval(() => {
      this.checkMemory();
    }, this.checkInterval);
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  
  private checkMemory() {
    if (!performance.memory) return;
    
    const used = performance.memory.usedJSHeapSize;
    const limit = performance.memory.jsHeapSizeLimit;
    
    if (used > this.maxMemory) {
      console.warn('High memory usage:', {
        used: Math.round(used / 1024 / 1024) + 'MB',
        limit: Math.round(limit / 1024 / 1024) + 'MB',
        percentage: Math.round((used / limit) * 100) + '%'
      });
      
      // Trigger cleanup
      this.requestCleanup();
    }
  }
  
  private requestCleanup() {
    self.postMessage({ type: 'memory-warning' });
  }
}
```

## Error Handling

### Error Types

```typescript
enum WorkerErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  OPERATION_FAILED = 'OPERATION_FAILED',
  TIMEOUT = 'TIMEOUT',
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT'
}

class WorkerError extends Error {
  constructor(
    message: string,
    public code: WorkerErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'WorkerError';
  }
}
```

### Error Recovery

```typescript
class ResilientWorker {
  private retryCount = 0;
  private maxRetries = 3;
  private worker: Worker | null = null;
  
  async execute(message: any): Promise<any> {
    try {
      return await this.tryExecute(message);
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.warn(`Retry ${this.retryCount}/${this.maxRetries}`, error);
        
        // Restart worker
        await this.restart();
        
        // Retry
        return this.execute(message);
      }
      
      throw error;
    }
  }
  
  private async restart() {
    this.terminate();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.initialize();
  }
  
  private terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
```

## Testing

### Worker Testing

```typescript
// __tests__/convert.worker.test.ts
import { WorkerTestHarness } from '../test-utils/worker-harness';

describe('Convert Worker', () => {
  let harness: WorkerTestHarness;
  
  beforeEach(() => {
    harness = new WorkerTestHarness('convert.worker.ts');
  });
  
  afterEach(() => {
    harness.terminate();
  });
  
  it('should convert image format', async () => {
    const input = await loadTestImage('test.jpg');
    
    const result = await harness.execute({
      type: 'convert',
      payload: {
        operation: 'raster',
        from: 'jpg',
        to: 'png',
        data: input
      }
    });
    
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(isPNG(result)).toBe(true);
  });
  
  it('should report progress', async () => {
    const progressEvents: any[] = [];
    
    harness.onProgress((event) => {
      progressEvents.push(event);
    });
    
    await harness.execute({
      type: 'convert',
      payload: { /* ... */ }
    });
    
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[progressEvents.length - 1].progress).toBe(100);
  });
});
```

### Test Harness

```typescript
export class WorkerTestHarness {
  private worker: Worker;
  private onProgressCallback?: (event: any) => void;
  
  constructor(workerPath: string) {
    this.worker = new Worker(
      new URL(workerPath, import.meta.url),
      { type: 'module' }
    );
  }
  
  execute(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36);
      
      const handler = (event: MessageEvent) => {
        if (event.data.id !== id) return;
        
        switch (event.data.type) {
          case 'success':
            this.worker.removeEventListener('message', handler);
            resolve(event.data.payload);
            break;
            
          case 'error':
            this.worker.removeEventListener('message', handler);
            reject(new Error(event.data.payload.message));
            break;
            
          case 'progress':
            this.onProgressCallback?.(event.data.payload);
            break;
        }
      };
      
      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ ...message, id });
    });
  }
  
  onProgress(callback: (event: any) => void) {
    this.onProgressCallback = callback;
  }
  
  terminate() {
    this.worker.terminate();
  }
}
```

## Performance Optimization

### Transferable Objects

```typescript
function getTransferables(data: any): Transferable[] {
  const transferables: Transferable[] = [];
  
  if (data instanceof ArrayBuffer) {
    transferables.push(data);
  } else if (data instanceof Uint8Array) {
    transferables.push(data.buffer);
  } else if (Array.isArray(data)) {
    data.forEach(item => {
      if (item instanceof ArrayBuffer) {
        transferables.push(item);
      }
    });
  } else if (typeof data === 'object' && data !== null) {
    Object.values(data).forEach(value => {
      if (value instanceof ArrayBuffer) {
        transferables.push(value);
      }
    });
  }
  
  return transferables;
}
```

### Code Splitting

```typescript
// Lazy load heavy dependencies
async function loadFFmpeg() {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  return new FFmpeg();
}

async function loadPDFJS() {
  const pdfjsLib = await import('pdfjs-dist');
  return pdfjsLib;
}

// Cache loaded modules
const moduleCache = new Map<string, any>();

async function getModule(name: string) {
  if (!moduleCache.has(name)) {
    const module = await loadModule(name);
    moduleCache.set(name, module);
  }
  return moduleCache.get(name);
}
```

## Best Practices

1. **Use Transferables**: Always transfer ArrayBuffers
2. **Report Progress**: Keep users informed
3. **Handle Errors**: Graceful error recovery
4. **Clean Resources**: Free memory after use
5. **Pool Workers**: Reuse workers for efficiency
6. **Test Thoroughly**: Test worker communication
7. **Monitor Performance**: Track memory and CPU usage

## See Also

- [Worker Pattern](../patterns/worker-pattern.md) - Implementation patterns
- [Conversion System](conversion-system.md) - Conversion architecture
- [Performance Guide](../recipes/optimize-performance.md) - Optimization tips
- [Testing Guide](../recipes/testing-guide.md) - Testing strategies