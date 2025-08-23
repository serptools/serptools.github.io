# Quick Reference

Common tasks and quick solutions for SerpTools development.

## Common Commands

### Development
```bash
# Start development server (with video support)
npm run dev

# Start static development (no video support)
npm run dev:static

# Build for production (static)
npm run build

# Build for server deployment
npm run build:server

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Adding a New Converter Tool

### 1. Create the page component
```typescript
// app/tools/(convert)/[from]-to-[to]/page.tsx
import HeroConverter from "@/components/HeroConverter";
import ToolPageTemplate from "@/components/ToolPageTemplate";
import { toolContent } from "@/lib/tool-content";

export default function FormatToFormatPage() {
  const content = toolContent["format-to-format"];
  
  if (!content) {
    return <HeroConverter from="format" to="format" />;
  }
  
  return <ToolPageTemplate content={content} />;
}
```

### 2. Add conversion logic (if needed)
```typescript
// lib/convert/video.ts
else if (toFormat === 'newformat') {
  args.push('-c:v', 'codec', '-preset', 'fast');
  // Add format-specific arguments
}
```

### 3. Add tool content
```json
// data/tools.json
{
  "id": "format-to-format",
  "name": "Format to Format",
  "route": "/tools/format-to-format",
  "from": "format",
  "to": "format",
  "content": {
    // Add content structure
  }
}
```

## Working with Video Conversion

### Check if video conversion is supported
```typescript
import { detectCapabilities } from "@/lib/capabilities";

const capabilities = detectCapabilities();
if (!capabilities.supportsVideoConversion) {
  // Show warning or fallback
}
```

### Video formats that require FFmpeg
```typescript
const VIDEO_FORMATS = ['mp4', 'mkv', 'avi', 'webm', 'mov', 'flv'];
const AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
```

## Component Patterns

### Using HeroConverter
```typescript
<HeroConverter 
  from="pdf" 
  to="jpg"
  accept=".pdf"
  videoEmbedId="youtube-id"
/>
```

### Using LanderHeroTwoColumn
```typescript
<LanderHeroTwoColumn
  title="PDF to JPG"
  subtitle="Convert PDF pages to images"
  from="pdf"
  to="jpg"
  accept=".pdf"
  videoEmbedId="youtube-id"
/>
```

### Using BatchHeroConverter
```typescript
<BatchHeroConverter
  title="Batch PNG Optimizer"
  from="png"
  to="png"
  processFile={optimizePng}
/>
```

## Working with Workers

### Send message to worker
```typescript
const worker = new Worker(
  new URL("../workers/convert.worker.ts", import.meta.url),
  { type: "module" }
);

worker.postMessage({
  op: "raster", // or "video", "pdf-pages"
  from: "jpg",
  to: "png",
  buf: arrayBuffer
}, [arrayBuffer]); // Transfer ownership
```

### Handle worker response
```typescript
worker.onmessage = (ev) => {
  if (ev.data?.type === 'progress') {
    // Handle progress
    return;
  }
  
  if (!ev.data?.ok) {
    // Handle error
    return;
  }
  
  // Process result
  const blob = new Blob([ev.data.blob], { type: mimeType });
};
```

## Tool Content Structure

### Basic tool entry
```json
{
  "id": "tool-id",
  "name": "Tool Name",
  "route": "/tools/tool-path",
  "from": "source",
  "to": "target",
  "priority": 5,
  "tags": ["tag1", "tag2"],
  "content": {
    "tool": {
      "title": "Tool Title",
      "subtitle": "Tool description"
    }
  }
}
```

### Full content structure
```json
{
  "content": {
    "tool": { /* title, subtitle */ },
    "videoSection": { "embedId": "youtube-id" },
    "faqs": [
      {
        "question": "Question?",
        "answer": "Answer."
      }
    ],
    "aboutSection": {
      "title": "Format Comparison",
      "fromFormat": { /* format details */ },
      "toFormat": { /* format details */ }
    },
    "changelog": [ /* version history */ ],
    "relatedTools": [ /* links */ ],
    "blogPosts": [ /* articles */ ]
  }
}
```

## File Type Detection

### Check if format needs video conversion
```typescript
import { requiresVideoConversion } from "@/lib/capabilities";

if (requiresVideoConversion(from, to)) {
  // Needs FFmpeg.wasm
}
```

### Check static compatibility
```typescript
import { isStaticCompatible } from "@/lib/capabilities";

if (isStaticCompatible(from, to)) {
  // Works on static builds
}
```

## Error Handling

### Worker errors
```typescript
worker.onerror = (error) => {
  console.error('Worker error:', error);
};

worker.onmessage = (ev) => {
  if (!ev.data) {
    console.error('Malformed message');
    return;
  }
};
```

### Capability errors
```typescript
try {
  await convertVideo(buffer, from, to);
} catch (error) {
  if (error.message.includes('SharedArrayBuffer')) {
    // Show static build limitation message
  }
}
```

## Styling Patterns

### Using dynamic colors
```typescript
const colors = ["#ef4444", "#f59e0b", /* ... */];
const hashCode = (from + to).split('').reduce((hash, char) => {
  return char.charCodeAt(0) + ((hash << 5) - hash);
}, 0);
const randomColor = colors[Math.abs(hashCode) % colors.length];
```

### Tailwind with dynamic styles
```tsx
<div 
  className="border-2 border-dashed"
  style={{
    backgroundColor: randomColor + "15", // 15 = ~8% opacity
    borderColor: randomColor,
  }}
/>
```

## File Operations

### Save file to user
```typescript
import { saveBlob } from "@/components/saveAs";

const blob = new Blob([data], { type: mimeType });
saveBlob(blob, filename);
```

### Handle file upload
```typescript
async function handleFiles(files: FileList) {
  for (const file of Array.from(files)) {
    const buffer = await file.arrayBuffer();
    // Process buffer
  }
}
```

## Build Mode Detection

### Environment variables
```typescript
// In code
const isStatic = process.env.BUILD_MODE === 'static';
const supportsVideo = process.env.SUPPORTS_VIDEO_CONVERSION === 'true';
```

### Runtime detection
```typescript
const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
```

## Common Issues

### Video conversion not working
- Check if running in server mode (`npm run dev`)
- Verify SharedArrayBuffer is available
- Ensure correct headers for CORS

### File not converting
- Check worker message format
- Verify format is supported
- Check browser console for errors

### Tool page not showing content
- Verify tool ID in tools.json matches page
- Check content structure is complete
- Ensure route is correct

## Useful Snippets

### Get all tools
```typescript
import { getAllTools } from "@/lib/tool-utils";
const tools = getAllTools();
```

### Filter tools by category
```typescript
import { getToolsByCategory } from "@/lib/tool-utils";
const videoTools = getToolsByCategory('video');
```

### Check file MIME type
```typescript
const mimeType = file.type || `image/${extension}`;
```

## See Also

- [Add New Converter](recipes/add-new-converter.md) - Detailed guide
- [Component Pattern](patterns/component-pattern.md) - Architecture
- [Worker Pattern](patterns/worker-pattern.md) - Background processing
- [Code Standards](code-standards.md) - Conventions