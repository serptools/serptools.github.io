# Add Bulk Tool

Creating batch processing tools that handle multiple files simultaneously.

## Overview

Bulk tools allow users to process multiple files at once, showing progress for each file and providing batch download options. The `BatchHeroConverter` component provides the foundation for these tools.

## Basic Bulk Tool

### Step 1: Create Page Component

```typescript
// app/tools/(convert)/batch-jpg-to-png/page.tsx
import BatchHeroConverter from "@/components/BatchHeroConverter";

export default function BatchJpgToPngPage() {
  return (
    <BatchHeroConverter
      title="Batch JPG to PNG Converter"
      subtitle="Convert multiple JPG images to PNG format at once"
      from="jpg"
      to="png"
      accept=".jpg,.jpeg"
      maxFiles={50}
    />
  );
}
```

### Step 2: Add to tools.json

```json
{
  "id": "batch-jpg-to-png",
  "name": "Batch JPG to PNG",
  "route": "/tools/batch-jpg-to-png",
  "from": "jpg",
  "to": "png",
  "priority": 9,
  "tags": ["batch", "image", "converter"],
  "content": {
    "tool": {
      "title": "Batch JPG to PNG Converter",
      "subtitle": "Convert multiple JPG images to PNG format simultaneously"
    }
  }
}
```

## BatchHeroConverter Component

### Component Structure

```typescript
// components/BatchHeroConverter.tsx
interface BatchHeroConverterProps {
  title: string;
  subtitle?: string;
  from: string;
  to: string;
  accept?: string;
  maxFiles?: number;
  processFile?: (file: File) => Promise<Blob>;
}

export default function BatchHeroConverter({
  title,
  subtitle,
  from,
  to,
  accept,
  maxFiles = 100,
  processFile
}: BatchHeroConverterProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Map<string, number>>(new Map());
  const [results, setResults] = useState<Map<string, Blob>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  
  // Component implementation
}
```

### File Processing Logic

```typescript
async function processAllFiles() {
  setProcessing(true);
  
  for (const file of files) {
    try {
      // Update progress
      setProgress(prev => new Map(prev).set(file.name, 0));
      
      // Process file
      const result = processFile 
        ? await processFile(file)
        : await defaultProcess(file);
      
      // Store result
      setResults(prev => new Map(prev).set(file.name, result));
      setProgress(prev => new Map(prev).set(file.name, 100));
      
    } catch (error) {
      // Handle error
      setErrors(prev => new Map(prev).set(
        file.name, 
        error?.message || 'Processing failed'
      ));
    }
  }
  
  setProcessing(false);
}
```

## Custom Processing Function

### Image Optimization Example

```typescript
// app/tools/batch-image-optimizer/page.tsx
import BatchHeroConverter from "@/components/BatchHeroConverter";

async function optimizeImage(file: File): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  
  // Load image
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.src = url;
  await img.decode();
  
  // Create canvas for processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Resize if needed
  const maxWidth = 1920;
  const maxHeight = 1080;
  
  let width = img.width;
  let height = img.height;
  
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width *= ratio;
    height *= ratio;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  // Draw and compress
  ctx.drawImage(img, 0, 0, width, height);
  
  // Clean up
  URL.revokeObjectURL(url);
  
  // Convert to blob with compression
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      'image/jpeg',
      0.85 // 85% quality
    );
  });
}

export default function BatchImageOptimizerPage() {
  return (
    <BatchHeroConverter
      title="Batch Image Optimizer"
      subtitle="Optimize multiple images for web"
      from="image"
      to="image"
      accept=".jpg,.jpeg,.png,.webp"
      processFile={optimizeImage}
    />
  );
}
```

## Progress Tracking

### Individual File Progress

```typescript
interface FileProgress {
  name: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
  result?: Blob;
}

function FileProgressItem({ file, progress }: Props) {
  return (
    <div className="file-progress">
      <div className="file-info">
        <span className="file-name">{file.name}</span>
        <span className="file-size">
          {(file.size / 1024).toFixed(2)} KB
        </span>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="status">
        {progress === 100 ? '✓ Complete' : `${progress}%`}
      </div>
    </div>
  );
}
```

### Overall Progress

```typescript
function OverallProgress({ files, progress }: Props) {
  const completed = Array.from(progress.values())
    .filter(p => p === 100).length;
  const total = files.length;
  const percentage = (completed / total) * 100;
  
  return (
    <div className="overall-progress">
      <h3>Overall Progress</h3>
      <div className="stats">
        <span>{completed} of {total} files processed</span>
        <span>{percentage.toFixed(0)}%</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

## Batch Download

### ZIP Creation

```typescript
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

async function downloadAllAsZip(
  results: Map<string, Blob>,
  format: string
) {
  const zip = new JSZip();
  
  results.forEach((blob, filename) => {
    // Change extension
    const newName = filename.replace(/\.[^.]+$/, `.${format}`);
    zip.file(newName, blob);
  });
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `converted-files-${Date.now()}.zip`);
}
```

### Individual Downloads

```typescript
function downloadFile(blob: Blob, filename: string, format: string) {
  const newName = filename.replace(/\.[^.]+$/, `.${format}`);
  saveAs(blob, newName);
}

function DownloadButtons({ results, format }: Props) {
  return (
    <div className="download-options">
      <button onClick={() => downloadAllAsZip(results, format)}>
        Download All as ZIP
      </button>
      
      {Array.from(results.entries()).map(([name, blob]) => (
        <button 
          key={name}
          onClick={() => downloadFile(blob, name, format)}
        >
          Download {name}
        </button>
      ))}
    </div>
  );
}
```

## Worker Pool for Parallelism

### Parallel Processing

```typescript
class BatchProcessor {
  private workerPool: Worker[] = [];
  private poolSize = navigator.hardwareConcurrency || 4;
  
  constructor() {
    // Create worker pool
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(
        new URL('../workers/convert.worker.ts', import.meta.url),
        { type: 'module' }
      );
      this.workerPool.push(worker);
    }
  }
  
  async processFiles(files: File[], from: string, to: string) {
    const chunks = this.chunkFiles(files, this.poolSize);
    const promises = chunks.map((chunk, index) => 
      this.processChunk(chunk, this.workerPool[index], from, to)
    );
    
    return Promise.all(promises);
  }
  
  private chunkFiles(files: File[], size: number): File[][] {
    const chunks: File[][] = [];
    for (let i = 0; i < files.length; i += size) {
      chunks.push(files.slice(i, i + size));
    }
    return chunks;
  }
  
  private async processChunk(
    files: File[],
    worker: Worker,
    from: string,
    to: string
  ): Promise<Blob[]> {
    const results: Blob[] = [];
    
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const result = await this.processWithWorker(
        worker, buffer, from, to
      );
      results.push(new Blob([result]));
    }
    
    return results;
  }
}
```

## Error Handling

### File Validation

```typescript
function validateFiles(files: File[], options: ValidationOptions) {
  const errors: string[] = [];
  
  files.forEach(file => {
    // Check file size
    if (file.size > options.maxSize) {
      errors.push(`${file.name}: File too large (max ${options.maxSize})`);
    }
    
    // Check file type
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!options.allowedTypes.includes(ext!)) {
      errors.push(`${file.name}: Invalid file type`);
    }
  });
  
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}
```

### Error Recovery

```typescript
interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
}

async function processWithRetry(
  file: File,
  processFunc: (file: File) => Promise<Blob>,
  options: RetryOptions
): Promise<Blob> {
  let lastError: Error;
  
  for (let i = 0; i < options.maxRetries; i++) {
    try {
      return await processFunc(file);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Retry ${i + 1} for ${file.name}:`, error);
      
      if (i < options.maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, options.retryDelay)
        );
      }
    }
  }
  
  throw lastError!;
}
```

## UI Components

### File List Display

```typescript
function FileList({ files, onRemove }: Props) {
  return (
    <div className="file-list">
      <h3>Selected Files ({files.length})</h3>
      
      <div className="files">
        {files.map((file, index) => (
          <div key={index} className="file-item">
            <span className="file-icon">📄</span>
            <span className="file-name">{file.name}</span>
            <span className="file-size">
              {(file.size / 1024).toFixed(2)} KB
            </span>
            <button 
              onClick={() => onRemove(index)}
              className="remove-btn"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Drag and Drop Zone

```typescript
function DropZone({ onFiles, accept, multiple = true }: Props) {
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    onFiles(files);
  };
  
  return (
    <div
      className={`drop-zone ${dragActive ? 'active' : ''}`}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <p>Drag & drop files here</p>
      <p>or</p>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => onFiles(Array.from(e.target.files!))}
      />
    </div>
  );
}
```

## Advanced Features

### Preview Generation

```typescript
async function generatePreviews(files: File[]): Promise<Map<string, string>> {
  const previews = new Map<string, string>();
  
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      previews.set(file.name, url);
    }
  }
  
  return previews;
}

// Clean up URLs when done
function cleanupPreviews(previews: Map<string, string>) {
  previews.forEach(url => URL.revokeObjectURL(url));
}
```

### Quality Settings

```typescript
interface QualitySettings {
  format: string;
  quality: number;
  resize?: { width: number; height: number };
  preserveMetadata?: boolean;
}

function QualityControls({ 
  settings, 
  onChange 
}: {
  settings: QualitySettings;
  onChange: (settings: QualitySettings) => void;
}) {
  return (
    <div className="quality-controls">
      <label>
        Quality:
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={settings.quality}
          onChange={(e) => onChange({
            ...settings,
            quality: parseFloat(e.target.value)
          })}
        />
        <span>{Math.round(settings.quality * 100)}%</span>
      </label>
      
      <label>
        <input
          type="checkbox"
          checked={settings.preserveMetadata}
          onChange={(e) => onChange({
            ...settings,
            preserveMetadata: e.target.checked
          })}
        />
        Preserve metadata
      </label>
    </div>
  );
}
```

## Performance Optimization

### Memory Management

```typescript
class MemoryManager {
  private maxMemory = 500 * 1024 * 1024; // 500MB
  private currentUsage = 0;
  
  async canProcess(file: File): Promise<boolean> {
    return (this.currentUsage + file.size) < this.maxMemory;
  }
  
  async processWithMemoryLimit(
    files: File[],
    processFunc: (file: File) => Promise<Blob>
  ) {
    const results: Blob[] = [];
    const queue = [...files];
    
    while (queue.length > 0) {
      const batch: File[] = [];
      let batchSize = 0;
      
      // Build batch within memory limit
      while (queue.length > 0 && batchSize < this.maxMemory) {
        const file = queue[0];
        if (batchSize + file.size > this.maxMemory && batch.length > 0) {
          break;
        }
        batch.push(queue.shift()!);
        batchSize += file.size;
      }
      
      // Process batch
      const batchResults = await Promise.all(
        batch.map(processFunc)
      );
      results.push(...batchResults);
      
      // Force garbage collection hint
      if (global.gc) global.gc();
    }
    
    return results;
  }
}
```

## Testing

### Unit Tests

```typescript
describe('BatchHeroConverter', () => {
  it('should process multiple files', async () => {
    const files = [
      new File(['content1'], 'file1.jpg'),
      new File(['content2'], 'file2.jpg')
    ];
    
    const results = await processFiles(files, 'jpg', 'png');
    
    expect(results).toHaveLength(2);
    expect(results[0]).toBeInstanceOf(Blob);
  });
  
  it('should handle errors gracefully', async () => {
    const invalidFile = new File([''], 'invalid.xyz');
    
    await expect(processFile(invalidFile))
      .rejects
      .toThrow('Unsupported format');
  });
});
```

## Best Practices

1. **Set File Limits**: Prevent memory issues
2. **Show Progress**: Keep users informed
3. **Handle Errors**: Graceful failure handling
4. **Optimize Memory**: Process in batches
5. **Provide Options**: Quality, format settings
6. **Enable Preview**: Show before/after
7. **Support Cancellation**: Allow stopping mid-process

## See Also

- [Component Pattern](../patterns/component-pattern.md) - Component architecture
- [Worker Pattern](../patterns/worker-pattern.md) - Background processing
- [Add New Converter](add-new-converter.md) - Creating converters
- [Performance Guide](optimize-performance.md) - Optimization tips