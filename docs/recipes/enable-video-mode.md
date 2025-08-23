# Enable Video Mode

Configuring the application for server deployment with video conversion support.

## Overview

Video conversion requires FFmpeg.wasm which needs SharedArrayBuffer support. This requires specific HTTP headers that static hosting (like GitHub Pages) cannot provide. Server mode enables these features for platforms like Vercel, Netlify, or self-hosted deployments.

## Requirements

### HTTP Headers Required

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

These headers enable SharedArrayBuffer, which FFmpeg.wasm needs for video processing.

### Supported Platforms

- ✅ **Vercel** - Full support with configuration
- ✅ **Netlify** - Full support with headers file
- ✅ **Self-hosted** - Full support with proper headers
- ❌ **GitHub Pages** - Cannot set required headers
- ❌ **Static CDN** - No header configuration

## Quick Setup

### For Development

```bash
# Run with video support (server mode)
npm run dev

# Run without video support (static mode)
npm run dev:static
```

### For Production

```bash
# Build for server deployment (with video)
npm run build:server

# Build for static hosting (no video)
npm run build
```

## Configuration

### next.config.mjs

The configuration dynamically adjusts based on BUILD_MODE:

```javascript
// next.config.mjs
const isStatic = process.env.BUILD_MODE === 'static';

const nextConfig = {
  // Static export for GitHub Pages
  ...(isStatic && { 
    output: 'export',
    images: { unoptimized: true }
  }),
  
  // Environment variables
  env: {
    BUILD_MODE: isStatic ? 'static' : 'server',
    SUPPORTS_VIDEO_CONVERSION: isStatic ? 'false' : 'true',
  },
  
  // Headers for SharedArrayBuffer (server mode only)
  async headers() {
    if (isStatic) return [];
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:static": "BUILD_MODE=static next dev",
    "build": "BUILD_MODE=static next build",
    "build:server": "next build",
    "start": "next start"
  }
}
```

## Deployment Configurations

### Vercel

Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

### Netlify

Create `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Embedder-Policy = "require-corp"
    Cross-Origin-Opener-Policy = "same-origin"
```

Or create `_headers` file in public directory:

```
/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
```

### Docker/Self-Hosted

For Nginx:

```nginx
server {
    listen 80;
    server_name example.com;
    
    location / {
        add_header Cross-Origin-Embedder-Policy "require-corp" always;
        add_header Cross-Origin-Opener-Policy "same-origin" always;
        
        proxy_pass http://localhost:3000;
    }
}
```

For Apache:

```apache
<IfModule mod_headers.c>
    Header always set Cross-Origin-Embedder-Policy "require-corp"
    Header always set Cross-Origin-Opener-Policy "same-origin"
</IfModule>
```

## Capability Detection

### Runtime Detection

The application automatically detects available features:

```typescript
// lib/capabilities.ts
export function detectCapabilities(): Capabilities {
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;
  const buildMode = process.env.BUILD_MODE as 'static' | 'server' || 'static';
  
  const supportsVideoConversion = 
    hasSharedArrayBuffer && 
    isSecureContext && 
    buildMode === 'server';
  
  return {
    supportsVideoConversion,
    supportsSharedArrayBuffer: hasSharedArrayBuffer,
    isSecureContext,
    buildMode,
    reason: !supportsVideoConversion 
      ? getReasonMessage(hasSharedArrayBuffer, isSecureContext, buildMode)
      : undefined
  };
}
```

### Using Capabilities

```typescript
// In components
import { detectCapabilities } from "@/lib/capabilities";

export default function VideoConverter() {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  
  useEffect(() => {
    setCapabilities(detectCapabilities());
  }, []);
  
  if (!capabilities?.supportsVideoConversion) {
    return (
      <div className="alert alert-warning">
        <h3>Video Conversion Not Available</h3>
        <p>{capabilities?.reason}</p>
        <p>
          Video conversion requires server deployment. 
          Please use the server version for this feature.
        </p>
      </div>
    );
  }
  
  return <HeroConverter from="mp4" to="mp3" />;
}
```

## FFmpeg.wasm Setup

### Installation

```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

### Loading FFmpeg

```typescript
// lib/convert/video.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  
  // Check capabilities first
  const capabilities = detectCapabilities();
  if (!capabilities.supportsVideoConversion) {
    throw new Error('Video conversion not supported in current environment');
  }
  
  ffmpeg = new FFmpeg();
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
  });
  
  return ffmpeg;
}
```

### Video Conversion

```typescript
export async function convertVideo(
  inputBuffer: ArrayBuffer,
  fromFormat: string,
  toFormat: string,
  options: ConversionOptions = {}
): Promise<ArrayBuffer> {
  const ffmpeg = await loadFFmpeg();
  
  // Write input file
  const inputFileName = `input.${fromFormat}`;
  const outputFileName = `output.${toFormat}`;
  
  await ffmpeg.writeFile(inputFileName, new Uint8Array(inputBuffer));
  
  // Build FFmpeg command
  const args = ['-i', inputFileName];
  
  // Format-specific settings
  if (toFormat === 'mp3') {
    args.push('-codec:a', 'libmp3lame', '-b:a', '192k');
  } else if (toFormat === 'mp4') {
    args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '22');
  }
  
  args.push(outputFileName);
  
  // Execute conversion
  await ffmpeg.exec(args);
  
  // Read output
  const data = await ffmpeg.readFile(outputFileName);
  
  // Cleanup
  await ffmpeg.deleteFile(inputFileName);
  await ffmpeg.deleteFile(outputFileName);
  
  return data.buffer;
}
```

## Testing Video Mode

### Check SharedArrayBuffer

```javascript
// In browser console
console.log(typeof SharedArrayBuffer !== 'undefined'); // Should be true
console.log(crossOriginIsolated); // Should be true
```

### Test Headers

```bash
# Check response headers
curl -I https://your-site.com | grep -i "cross-origin"
```

Should return:
```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

### Test Conversion

```typescript
// Test video conversion
async function testVideoConversion() {
  const response = await fetch('/sample.mp4');
  const buffer = await response.arrayBuffer();
  
  try {
    const converted = await convertVideo(buffer, 'mp4', 'mp3');
    console.log('Success! Converted size:', converted.byteLength);
  } catch (error) {
    console.error('Video conversion failed:', error);
  }
}
```

## Conditional Features

### Show/Hide Tools

```typescript
// lib/tool-utils.ts
export function getAvailableTools() {
  const allTools = getAllTools();
  const capabilities = detectCapabilities();
  
  if (capabilities.supportsVideoConversion) {
    return allTools; // All tools available
  }
  
  // Filter out video tools for static builds
  return allTools.filter(tool => 
    !requiresVideoConversion(tool.from, tool.to)
  );
}
```

### Dynamic UI

```typescript
function ToolGrid() {
  const [tools, setTools] = useState<Tool[]>([]);
  
  useEffect(() => {
    setTools(getAvailableTools());
  }, []);
  
  return (
    <div className="tool-grid">
      {tools.map(tool => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
```

## Fallback Strategies

### Progressive Enhancement

```typescript
function VideoTool({ from, to }: Props) {
  const capabilities = detectCapabilities();
  
  // Server-side rendering fallback
  if (typeof window === 'undefined') {
    return <LoadingPlaceholder />;
  }
  
  // Client-side capability check
  if (!capabilities.supportsVideoConversion) {
    return <StaticModeFallback from={from} to={to} />;
  }
  
  return <VideoConverter from={from} to={to} />;
}
```

### Alternative Solutions

```typescript
function StaticModeFallback({ from, to }: Props) {
  return (
    <div className="fallback-container">
      <h2>{from.toUpperCase()} to {to.toUpperCase()} Converter</h2>
      
      <div className="alert alert-info">
        <p>Video conversion requires our server version.</p>
        
        <div className="alternatives">
          <h3>Alternative Options:</h3>
          <ul>
            <li>
              <a href="https://server.serptools.com">
                Use our server version
              </a>
            </li>
            <li>
              <a href="https://github.com/serptools/serptools">
                Run locally with Docker
              </a>
            </li>
            <li>Try our image converters that work everywhere</li>
          </ul>
        </div>
      </div>
      
      <RelatedTools category="image" />
    </div>
  );
}
```

## Environment Variables

### Development

Create `.env.local`:

```bash
# For server mode
BUILD_MODE=server
NEXT_PUBLIC_API_URL=http://localhost:3000

# For static mode
BUILD_MODE=static
```

### Production

Set in deployment platform:

```bash
# Vercel
BUILD_MODE=server
SUPPORTS_VIDEO_CONVERSION=true

# GitHub Actions (for Pages)
BUILD_MODE=static
SUPPORTS_VIDEO_CONVERSION=false
```

## Monitoring

### Performance Metrics

```typescript
// Track video conversion performance
async function convertWithMetrics(
  buffer: ArrayBuffer,
  from: string,
  to: string
) {
  const startTime = performance.now();
  const startMemory = performance.memory?.usedJSHeapSize;
  
  try {
    const result = await convertVideo(buffer, from, to);
    
    const endTime = performance.now();
    const endMemory = performance.memory?.usedJSHeapSize;
    
    // Send metrics
    analytics.track('video_conversion', {
      from,
      to,
      duration: endTime - startTime,
      inputSize: buffer.byteLength,
      outputSize: result.byteLength,
      memoryUsed: endMemory - startMemory
    });
    
    return result;
  } catch (error) {
    analytics.track('video_conversion_error', {
      from,
      to,
      error: error.message
    });
    throw error;
  }
}
```

## Troubleshooting

### SharedArrayBuffer Not Available

**Symptoms:**
- `SharedArrayBuffer is not defined` error
- `crossOriginIsolated` is false

**Solutions:**
1. Check HTTP headers are set correctly
2. Ensure HTTPS is used (required for secure context)
3. Verify no conflicting headers
4. Check browser support

### FFmpeg Loading Fails

**Symptoms:**
- FFmpeg.wasm fails to initialize
- Network errors loading WASM files

**Solutions:**
1. Check CORS settings for CDN
2. Verify file paths are correct
3. Ensure sufficient memory available
4. Try self-hosting FFmpeg files

### Conversion Timeout

**Symptoms:**
- Long videos timeout
- Browser becomes unresponsive

**Solutions:**
1. Implement progress callbacks
2. Process in chunks for large files
3. Add timeout handling
4. Optimize FFmpeg arguments

## Best Practices

1. **Feature Detection**: Always check capabilities before using
2. **Graceful Degradation**: Provide fallbacks for static mode
3. **Clear Messaging**: Inform users why features aren't available
4. **Performance**: Monitor and optimize video processing
5. **Security**: Validate inputs before processing
6. **Testing**: Test both static and server modes

## See Also

- [Capability Detection](../modules/capability-detection.md) - Detection system
- [Converter Pattern](../patterns/converter-pattern.md) - Conversion architecture
- [Worker Pattern](../patterns/worker-pattern.md) - Background processing
- [Quick Reference](../quick-reference.md) - Common commands