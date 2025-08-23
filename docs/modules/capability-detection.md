# Capability Detection

Runtime detection system for determining available features based on deployment mode.

## Overview

The capability detection system determines which features are available at runtime based on browser capabilities, deployment mode (static vs server), and security context. This enables the application to gracefully handle different environments.

## Core Detection

### Capability Interface

```typescript
// lib/capabilities.ts
export interface Capabilities {
  supportsVideoConversion: boolean;
  supportsSharedArrayBuffer: boolean;
  isSecureContext: boolean;
  buildMode: 'static' | 'server';
  browserName?: string;
  browserVersion?: string;
  reason?: string;
}
```

### Detection Function

```typescript
export function detectCapabilities(): Capabilities {
  // Check browser features
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const hasCrossOriginIsolation = typeof window !== 'undefined' && 
    window.crossOriginIsolated === true;
  const isSecureContext = typeof window !== 'undefined' && 
    window.isSecureContext === true;
  
  // Check build mode
  const buildMode = process.env.BUILD_MODE as 'static' | 'server' || 'static';
  const envSupportsVideo = process.env.SUPPORTS_VIDEO_CONVERSION === 'true';
  
  // Determine video support
  const supportsVideoConversion = 
    hasSharedArrayBuffer && 
    hasCrossOriginIsolation &&
    isSecureContext &&
    buildMode === 'server' &&
    envSupportsVideo;
  
  // Get browser info
  const browserInfo = detectBrowser();
  
  // Generate reason if not supported
  const reason = !supportsVideoConversion 
    ? generateReason({
        hasSharedArrayBuffer,
        hasCrossOriginIsolation,
        isSecureContext,
        buildMode,
        envSupportsVideo
      })
    : undefined;
  
  return {
    supportsVideoConversion,
    supportsSharedArrayBuffer: hasSharedArrayBuffer,
    isSecureContext,
    buildMode,
    ...browserInfo,
    reason
  };
}
```

## Feature Requirements

### Video Conversion Requirements

| Requirement | Description | How to Enable |
|-------------|-------------|---------------|
| SharedArrayBuffer | Required by FFmpeg.wasm | Set COOP/COEP headers |
| Secure Context | HTTPS or localhost | Use HTTPS |
| Server Mode | Not static export | Use server deployment |
| Cross-Origin Isolation | Security requirement | Configure headers |

### Header Configuration

Required headers for video support:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

## Format Compatibility

### Static-Compatible Formats

Formats that work without special requirements:

```typescript
export const STATIC_COMPATIBLE_FORMATS = {
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'ico', 'avif'],
  document: ['pdf'] // PDF to image only
};

export function isStaticCompatible(from: string, to: string): boolean {
  const imageFormats = STATIC_COMPATIBLE_FORMATS.image;
  
  // Image to image
  if (imageFormats.includes(from) && imageFormats.includes(to)) {
    return true;
  }
  
  // PDF to image
  if (from === 'pdf' && imageFormats.includes(to)) {
    return true;
  }
  
  return false;
}
```

### Server-Required Formats

Formats needing server mode:

```typescript
export const SERVER_REQUIRED_FORMATS = {
  video: ['mp4', 'mkv', 'avi', 'webm', 'mov', 'flv', 'wmv', 'm4v'],
  audio: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'wma', 'flac', 'opus']
};

export function requiresVideoConversion(from: string, to: string): boolean {
  const { video, audio } = SERVER_REQUIRED_FORMATS;
  
  return video.includes(from) || 
         video.includes(to) || 
         audio.includes(from) || 
         audio.includes(to);
}
```

## Browser Detection

### User Agent Parsing

```typescript
function detectBrowser(): {
  browserName?: string;
  browserVersion?: string;
} {
  if (typeof navigator === 'undefined') {
    return {};
  }
  
  const ua = navigator.userAgent;
  
  // Chrome/Chromium
  if (ua.includes('Chrome/')) {
    const version = ua.match(/Chrome\/(\d+)/)?.[1];
    return { browserName: 'Chrome', browserVersion: version };
  }
  
  // Firefox
  if (ua.includes('Firefox/')) {
    const version = ua.match(/Firefox\/(\d+)/)?.[1];
    return { browserName: 'Firefox', browserVersion: version };
  }
  
  // Safari
  if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const version = ua.match(/Version\/(\d+)/)?.[1];
    return { browserName: 'Safari', browserVersion: version };
  }
  
  // Edge
  if (ua.includes('Edg/')) {
    const version = ua.match(/Edg\/(\d+)/)?.[1];
    return { browserName: 'Edge', browserVersion: version };
  }
  
  return { browserName: 'Unknown' };
}
```

### Feature Support by Browser

```typescript
export const BROWSER_SUPPORT = {
  SharedArrayBuffer: {
    Chrome: 68,
    Firefox: 79,
    Safari: 15.2,
    Edge: 79
  },
  OffscreenCanvas: {
    Chrome: 69,
    Firefox: 105,
    Safari: 16.4,
    Edge: 79
  },
  WebCodecs: {
    Chrome: 94,
    Firefox: null, // Not supported
    Safari: null,  // Not supported
    Edge: 94
  }
};

export function checkBrowserSupport(
  feature: keyof typeof BROWSER_SUPPORT,
  browserName: string,
  browserVersion: string
): boolean {
  const minVersion = BROWSER_SUPPORT[feature][browserName];
  if (!minVersion) return false;
  
  return parseInt(browserVersion) >= minVersion;
}
```

## Runtime Checks

### Component-Level Detection

```typescript
// In React components
export function useCapabilities() {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  
  useEffect(() => {
    // Detect on client side only
    setCapabilities(detectCapabilities());
  }, []);
  
  return capabilities;
}

// Usage
function VideoConverter() {
  const capabilities = useCapabilities();
  
  if (!capabilities) {
    return <LoadingSpinner />;
  }
  
  if (!capabilities.supportsVideoConversion) {
    return <VideoNotSupported reason={capabilities.reason} />;
  }
  
  return <VideoConverterUI />;
}
```

### Worker-Level Detection

```typescript
// In workers
self.addEventListener('message', async (event) => {
  const { op } = event.data;
  
  if (op === 'video') {
    // Check capabilities in worker
    if (typeof SharedArrayBuffer === 'undefined') {
      self.postMessage({
        ok: false,
        error: 'SharedArrayBuffer not available in worker'
      });
      return;
    }
  }
  
  // Process normally
});
```

## Fallback Strategies

### Graceful Degradation

```typescript
export function getAvailableOperation(
  preferredOp: string,
  capabilities: Capabilities
): string {
  // If video requested but not available
  if (preferredOp === 'video' && !capabilities.supportsVideoConversion) {
    // Check if we can use image fallback
    if (isImageFormat(from) && isImageFormat(to)) {
      return 'raster';
    }
    
    // No fallback available
    throw new Error('Video conversion not available in static mode');
  }
  
  return preferredOp;
}
```

### Alternative Suggestions

```typescript
export function getSuggestedAlternatives(
  from: string,
  to: string,
  capabilities: Capabilities
): Alternative[] {
  const alternatives: Alternative[] = [];
  
  if (!capabilities.supportsVideoConversion) {
    // Suggest server version
    alternatives.push({
      type: 'deployment',
      title: 'Use Server Version',
      description: 'Video conversion requires server deployment',
      url: 'https://server.serptools.com'
    });
    
    // Suggest similar tools that work
    if (from === 'mp4' && to === 'mp3') {
      alternatives.push({
        type: 'tool',
        title: 'Try Audio Extractor',
        description: 'Extract audio from video files',
        url: '/tools/audio-extractor'
      });
    }
  }
  
  return alternatives;
}
```

## Error Messages

### User-Friendly Explanations

```typescript
function generateReason(checks: CapabilityChecks): string {
  const reasons: string[] = [];
  
  if (!checks.hasSharedArrayBuffer) {
    reasons.push('Your browser doesn\'t support SharedArrayBuffer');
  }
  
  if (!checks.hasCrossOriginIsolation) {
    reasons.push('The page is not cross-origin isolated');
  }
  
  if (!checks.isSecureContext) {
    reasons.push('HTTPS is required for this feature');
  }
  
  if (checks.buildMode === 'static') {
    reasons.push('This feature requires server deployment');
  }
  
  if (reasons.length === 0) {
    return 'Unknown compatibility issue';
  }
  
  return reasons.join('. ') + '.';
}
```

### Technical Details

```typescript
export function getDetailedDiagnostics(): Diagnostics {
  return {
    headers: {
      coep: document.featurePolicy?.allowedFeatures().includes('cross-origin-isolated'),
      coop: window.crossOriginIsolated
    },
    features: {
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      webAssembly: typeof WebAssembly !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      webWorker: typeof Worker !== 'undefined'
    },
    context: {
      secure: window.isSecureContext,
      protocol: window.location.protocol,
      origin: window.location.origin
    },
    build: {
      mode: process.env.BUILD_MODE,
      videoSupport: process.env.SUPPORTS_VIDEO_CONVERSION
    }
  };
}
```

## Testing Capabilities

### Mock Capabilities

```typescript
// For testing
export function mockCapabilities(
  overrides: Partial<Capabilities> = {}
): Capabilities {
  return {
    supportsVideoConversion: true,
    supportsSharedArrayBuffer: true,
    isSecureContext: true,
    buildMode: 'server',
    browserName: 'Chrome',
    browserVersion: '120',
    ...overrides
  };
}

// In tests
describe('VideoConverter', () => {
  it('should show fallback in static mode', () => {
    const capabilities = mockCapabilities({
      supportsVideoConversion: false,
      buildMode: 'static'
    });
    
    const { getByText } = render(
      <CapabilityContext.Provider value={capabilities}>
        <VideoConverter />
      </CapabilityContext.Provider>
    );
    
    expect(getByText(/not available in static mode/)).toBeInTheDocument();
  });
});
```

### Manual Testing

```javascript
// Browser console tests
console.log('SharedArrayBuffer:', typeof SharedArrayBuffer !== 'undefined');
console.log('CrossOriginIsolated:', crossOriginIsolated);
console.log('SecureContext:', isSecureContext);
console.log('Headers:', performance.getEntriesByType('navigation')[0].serverTiming);
```

## Performance Impact

### Lazy Loading Based on Capabilities

```typescript
export async function loadConverter(
  format: string,
  capabilities: Capabilities
) {
  // Only load heavy libraries if supported
  if (requiresVideoConversion(format) && !capabilities.supportsVideoConversion) {
    throw new Error('Video conversion not supported');
  }
  
  if (requiresVideoConversion(format)) {
    return import('../lib/convert/video');
  }
  
  return import('../lib/convert/image');
}
```

### Conditional Rendering

```typescript
function ToolGrid() {
  const capabilities = useCapabilities();
  const [tools, setTools] = useState<Tool[]>([]);
  
  useEffect(() => {
    if (capabilities) {
      // Filter tools based on capabilities
      const availableTools = getAllTools().filter(tool =>
        isToolAvailable(tool, capabilities)
      );
      setTools(availableTools);
    }
  }, [capabilities]);
  
  return (
    <div className="grid">
      {tools.map(tool => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
```

## Configuration

### Environment Variables

```bash
# .env.local
BUILD_MODE=server
SUPPORTS_VIDEO_CONVERSION=true
NEXT_PUBLIC_SHOW_CAPABILITY_WARNING=true
```

### Runtime Configuration

```typescript
export const CAPABILITY_CONFIG = {
  // Show detailed error messages
  verbose: process.env.NODE_ENV === 'development',
  
  // Check capabilities on mount
  checkOnMount: true,
  
  // Recheck interval (ms)
  recheckInterval: 60000,
  
  // Cache duration (ms)
  cacheDuration: 300000
};
```

## Monitoring

### Analytics Integration

```typescript
export function trackCapabilities(capabilities: Capabilities) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'capability_detection', {
      supports_video: capabilities.supportsVideoConversion,
      build_mode: capabilities.buildMode,
      browser: capabilities.browserName,
      browser_version: capabilities.browserVersion,
      has_shared_array_buffer: capabilities.supportsSharedArrayBuffer,
      is_secure_context: capabilities.isSecureContext
    });
  }
}
```

### Error Reporting

```typescript
export function reportCapabilityError(
  error: Error,
  capabilities: Capabilities
) {
  console.error('Capability error:', {
    error: error.message,
    capabilities,
    diagnostics: getDetailedDiagnostics()
  });
  
  // Send to error tracking service
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      contexts: {
        capabilities
      }
    });
  }
}
```

## Best Practices

1. **Always Check**: Never assume capabilities
2. **Cache Results**: Avoid repeated detection
3. **Provide Fallbacks**: Graceful degradation
4. **Clear Messaging**: Explain limitations to users
5. **Test Both Modes**: Verify static and server builds
6. **Monitor Usage**: Track capability distribution

## See Also

- [Enable Video Mode](../recipes/enable-video-mode.md) - Configuration guide
- [Conversion System](conversion-system.md) - Conversion architecture
- [Worker Pattern](../patterns/worker-pattern.md) - Worker implementation
- [Quick Reference](../quick-reference.md) - Common tasks