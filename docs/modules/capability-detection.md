# Capability Detection

Runtime detection system for determining available features based on deployment mode and environment configuration.

## Overview

The capability detection system determines which features are available at runtime based on build mode (static vs server) and environment configuration. The system is designed to provide graceful fallbacks and clear messaging when features are unavailable, particularly for FFmpeg-based video/audio conversion tools.

## Core Detection

### Capability Interface

```typescript
// lib/capabilities.ts
export interface Capabilities {
  supportsVideoConversion: boolean;
  supportsSharedArrayBuffer: boolean;
  buildMode: 'static' | 'server';
  reason?: string;
}
```

### Detection Function

```typescript
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

### Helper Functions

```typescript
export function isVideoConversionSupported(): boolean {
  return detectCapabilities().supportsVideoConversion;
}

export function getVideoConversionError(): string {
  const caps = detectCapabilities();
  return caps.reason || 'Video conversion not supported';
}
```

## Environment Configuration

### Build Modes

The system operates in two distinct build modes:

#### Static Mode (Default)
```bash
BUILD_MODE=static
SUPPORTS_VIDEO_CONVERSION=false
```

- **Default for production builds**
- **Video/audio conversion disabled**
- **Uses Next.js static export**
- **Compatible with static hosting (Netlify, Vercel, GitHub Pages)**
- **All image conversions work normally**

#### Server Mode
```bash
BUILD_MODE=server  
SUPPORTS_VIDEO_CONVERSION=true
```

- **Development and server deployments**
- **Video/audio conversion enabled**
- **Requires SharedArrayBuffer support**
- **Needs CORS headers for cross-origin isolation**

### Next.js Configuration

```javascript
// next.config.mjs
const isStatic = process.env.BUILD_MODE === 'static' || process.env.NODE_ENV === 'production';

const nextConfig = {
  // Static export for static builds
  ...(isStatic && { 
    output: 'export',
    trailingSlash: true,
  }),
  
  // CORS headers for video conversion routes
  async headers() {
    if (isStatic) return [];
    return [
      {
        source: '/tools/mkv-to-:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/tools/mp4-to-:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
  
  // Environment variables for client
  env: {
    BUILD_MODE: isStatic ? 'static' : 'server',
    SUPPORTS_VIDEO_CONVERSION: isStatic ? 'false' : 'true',
  },
}
```

## Format Compatibility

### Format Categories

The system categorizes file formats into three groups:

#### Video Formats (Require FFmpeg)
```typescript
export const VIDEO_FORMATS = [
  // Video containers
  'mp4', 'mkv', 'avi', 'webm', 'mov', 'flv', 'ts', 'mts', 'm2ts', 'm4v', 
  'mpeg', 'mpg', 'vob', '3gp', 'f4v', 'hevc', 'divx', 'mjpeg', 'mpeg2', 
  'asf', 'wmv', 'mxf', 'ogv', 'rm', 'rmvb', 'swf'
];
```

#### Audio Formats (Require FFmpeg)
```typescript
export const AUDIO_FORMATS = [
  // Audio formats (extracted from video or converted)
  'mp3', 'wav', 'ogg', 'aac', 'm4a', 'opus', 'flac', 'wma', 'aiff', 'mp2'
];
```

#### Static-Safe Formats (Work in Both Modes)
```typescript
export const STATIC_SAFE_FORMATS = [
  // Images (browser createImageBitmap support)
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'ico', 'tiff', 'avif',
  // Documents (special handling)
  'pdf'
];
```

### Compatibility Checking

```typescript
export function requiresVideoConversion(from: string, to: string): boolean {
  return VIDEO_FORMATS.includes(from) || 
         AUDIO_FORMATS.includes(to) ||
         VIDEO_FORMATS.includes(to);
}

export function isStaticCompatible(from: string, to: string): boolean {
  // PDF to image conversions work (special PDF.js handling)
  if (from === 'pdf' && STATIC_SAFE_FORMATS.includes(to)) {
    return true;
  }
  
  // Image to image conversions work (browser native)
  if (STATIC_SAFE_FORMATS.includes(from) && STATIC_SAFE_FORMATS.includes(to)) {
    return true;
  }
  
  // Anything requiring video conversion won't work
  return !requiresVideoConversion(from, to);
}

export function getStaticIncompatibilityReason(from: string, to: string): string | null {
  if (isStaticCompatible(from, to)) return null;
  
  if (VIDEO_FORMATS.includes(from)) {
    return `${from.toUpperCase()} video processing requires FFmpeg.wasm (server mode only)`;
  }
  
  if (AUDIO_FORMATS.includes(to)) {
    return `Audio extraction to ${to.toUpperCase()} requires FFmpeg.wasm (server mode only)`;
  }
  
  if (VIDEO_FORMATS.includes(to)) {
    return `Video conversion to ${to.toUpperCase()} requires FFmpeg.wasm (server mode only)`;
  }
  
  return 'Video/audio processing not supported in static builds';
}
```

## Component Integration

### Two-Column Layout with Capability Detection

```typescript
// components/LanderHeroTwoColumn.tsx
import { detectCapabilities, type Capabilities } from "@/lib/capabilities";

export default function LanderHeroTwoColumn({
  title, subtitle, from, to, accept, videoEmbedId
}: Props) {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);

  useEffect(() => {
    // Detect capabilities on mount
    setCapabilities(detectCapabilities());
  }, []);

  const handleConvert = async (file: File) => {
    try {
      if (!capabilities?.supportsVideoConversion) {
        throw new Error(`Video conversion not supported: ${capabilities?.reason || 'Unknown reason'}`);
      }
      
      // Proceed with conversion...
    } catch (error) {
      // Handle capability errors
    }
  };

  return (
    <div>
      {/* Conversion interface */}
      
      {/* Capability warning */}
      {capabilities && !capabilities.supportsVideoConversion && (
        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            <strong>Video conversion not available:</strong>{" "}
            {capabilities.reason}. Deploy to a server environment to enable video processing.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

### Tool Page Template Logic

```typescript
// components/ToolPageTemplate.tsx
export default function ToolPageTemplate({ tool, videoSection, useTwoColumnLayout }: ToolPageProps) {
  // If tool requires FFmpeg, always use single column layout (full dropzone)
  const shouldUseTwoColumn = useTwoColumnLayout && videoSection?.embedId && !tool.requiresFFmpeg;
  
  return (
    <main>
      {shouldUseTwoColumn ? (
        <LanderHeroTwoColumn {...props} videoEmbedId={videoSection.embedId} />
      ) : (
        <HeroConverter {...props} />
      )}
    </main>
  );
}
```

### Video Conversion Implementation

```typescript
// lib/convert/video.ts
import { detectCapabilities } from '../capabilities';

async function loadFFmpeg(): Promise<FFmpeg> {
  // Check capabilities before loading FFmpeg
  const capabilities = detectCapabilities();
  if (!capabilities.supportsVideoConversion) {
    throw new Error(`Video conversion not supported: ${capabilities.reason}`);
  }
  
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    
    // Load FFmpeg with multi-threading support (requires SharedArrayBuffer)
    const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
    
    await ffmpeg.load({
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      workerURL: `${baseURL}/ffmpeg-core.worker.js`,
    });
  }
  
  return ffmpeg;
}
```

## Tool Metadata System

### Tool Definition with FFmpeg Flag

```typescript
// data/tools.json (excerpt)
{
  "id": "mp4-to-mp3",
  "name": "MP4 to MP3",
  "description": "Convert MP4 video files to MP3 format",
  "operation": "convert",
  "from": "mp4",
  "to": "mp3",
  "requiresFFmpeg": true,
  "isActive": true,
  // ... other properties
}
```

### Tool Content Processing

```typescript
// lib/tool-content.ts
const toolRequiresFFmpeg: Record<string, boolean> = {};

toolsData.forEach((tool: Tool) => {
  if (tool.content) {
    // Add requiresFFmpeg flag to the tool content if it exists
    if (tool.requiresFFmpeg) {
      tool.content.tool.requiresFFmpeg = true;
    }
  }
  
  // Track which tools require FFmpeg
  toolRequiresFFmpeg[tool.id] = tool.requiresFFmpeg || false;
});

export function requiresFFmpeg(toolId: string): boolean {
  return toolRequiresFFmpeg[toolId];
}
```

## Browser Feature Detection

### SharedArrayBuffer Detection

The system primarily relies on SharedArrayBuffer availability as the key indicator for FFmpeg support:

```typescript
// Runtime detection
const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
```

### CORS Headers for Cross-Origin Isolation

Required headers for SharedArrayBuffer in production:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

These are automatically applied to video conversion routes in server mode.

## Fallback Strategies

### Graceful Degradation

1. **Static Mode**: All image conversions work, video/audio conversions show capability warnings
2. **Missing SharedArrayBuffer**: Clear error messages explaining CORS requirements
3. **Tool Layout**: FFmpeg-requiring tools use single-column layout (no YouTube embeds)

### Error Messaging

```typescript
// Clear, user-friendly error messages
const reasons = {
  static: 'Video conversion disabled in static build mode',
  cors: 'SharedArrayBuffer not available - CORS headers required',
  unknown: 'Video conversion not supported'
};
```

## Performance Considerations

### Lazy Loading

- FFmpeg libraries (>10MB) only load when needed
- Capability detection happens on component mount
- Video conversion tools conditionally load heavy dependencies

### Memory Management

```typescript
// lib/convert/video.ts
export async function cleanupFFmpeg() {
  if (ffmpeg) {
    ffmpeg.terminate();
    ffmpeg = null;
    loaded = false;
  }
}
```

### Efficient Format Checking

- Pre-computed format arrays for fast lookups
- Simple boolean checks for compatibility
- Minimal runtime overhead

## Development vs Production

### Development Environment
```bash
npm run dev          # BUILD_MODE=server, video enabled
npm run dev:static   # BUILD_MODE=static, video disabled (testing)
```

### Production Builds
```bash
npm run build        # BUILD_MODE=static, optimized for static hosting
npm run build:server # BUILD_MODE=server, full feature set
```

## Testing Capabilities

### Manual Testing

```javascript
// Browser console
import { detectCapabilities } from '@/lib/capabilities';
const caps = detectCapabilities();
console.log('Capabilities:', caps);

// Check specific conversions
import { requiresVideoConversion, isStaticCompatible } from '@/lib/capabilities';
console.log('MP4->MP3 requires video:', requiresVideoConversion('mp4', 'mp3'));
console.log('JPG->PNG static compatible:', isStaticCompatible('jpg', 'png'));
```

### Environment Testing

```bash
# Test static mode
BUILD_MODE=static npm run dev

# Test server mode  
BUILD_MODE=server npm run dev

# Check environment variables
echo $BUILD_MODE $SUPPORTS_VIDEO_CONVERSION
```

## Architecture Benefits

### Clean Separation
- Environment configuration drives capability detection
- Format compatibility is pre-defined and testable
- Component logic is simplified with clear capability checks

### User Experience
- Immediate feedback on feature availability
- No confusing failures during conversion attempts
- Clear guidance on how to enable missing features

### Deployment Flexibility
- Single codebase supports both static and server deployments
- Automatic feature detection based on build configuration
- No runtime configuration needed

## Best Practices

1. **Always Check**: Use `detectCapabilities()` before attempting video operations
2. **Clear Messaging**: Provide specific reasons when features are unavailable  
3. **Graceful Fallbacks**: Show helpful alternatives when possible
4. **Performance**: Only load heavy libraries when capabilities allow
5. **Testing**: Test both static and server modes during development
6. **Documentation**: Keep format lists up-to-date as new tools are added

## See Also

- [Conversion System](conversion-system.md) - FFmpeg integration details
- [Tool System](tool-system.md) - Tool metadata and structure
- [Build Configuration](../recipes/enable-video-mode.md) - Setting up server mode
- [Quick Reference](../quick-reference.md) - Common capability checks