# Add New Converter

Step-by-step guide to adding a new file conversion tool to SerpTools.

## Overview

Adding a new converter involves creating a page component, optionally adding conversion logic if the format isn't already supported, and adding content to `tools.json`.

## Quick Steps

1. Create page component in `/app/tools/(convert)/`
2. Add conversion logic if needed
3. Add entry to `tools.json`
4. Test the converter

## Step 1: Create Page Component

### Basic Converter Page

Create a new file at `/app/tools/(convert)/[from]-to-[to]/page.tsx`:

```typescript
// app/tools/(convert)/webp-to-jpg/page.tsx
import HeroConverter from "@/components/HeroConverter";
import ToolPageTemplate from "@/components/ToolPageTemplate";
import { toolContent } from "@/lib/tool-content";

export default function WebpToJpgPage() {
  const content = toolContent["webp-to-jpg"];
  
  if (!content) {
    return <HeroConverter from="webp" to="jpg" />;
  }
  
  return <ToolPageTemplate content={content} />;
}
```

### With Metadata

Add SEO metadata:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WEBP to JPG Converter - Free Online Tool | SerpTools",
  description: "Convert WEBP images to JPG format instantly in your browser. Free, fast, and secure with no file uploads required.",
  keywords: ["webp to jpg", "webp converter", "image converter", "online tool"],
};

export default function WebpToJpgPage() {
  // ... component code
}
```

## Step 2: Check Format Support

### Verify Existing Support

Check if the formats are already supported:

```typescript
// Image formats (already supported)
const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'ico', 'avif'];

// Video formats (requires FFmpeg)
const videoFormats = ['mp4', 'mkv', 'avi', 'webm', 'mov', 'flv'];

// Audio formats (requires FFmpeg)
const audioFormats = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
```

### Add New Format Support

If the format isn't supported, add conversion logic:

#### For Image Formats

Edit `/lib/convert/decode.ts`:

```typescript
export async function decodeToRGBA(
  buffer: ArrayBuffer,
  format: string
): Promise<ImageData> {
  switch (format.toLowerCase()) {
    // ... existing cases
    
    case 'tiff':
    case 'tif':
      return decodeTIFF(buffer);
    
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

async function decodeTIFF(buffer: ArrayBuffer): Promise<ImageData> {
  // Import TIFF decoder library
  const { decode } = await import('tiff');
  const image = decode(buffer);
  
  return new ImageData(
    new Uint8ClampedArray(image.data),
    image.width,
    image.height
  );
}
```

Edit `/lib/convert/encode.ts`:

```typescript
export async function encodeFromRGBA(
  imageData: ImageData,
  format: string,
  quality = 0.9
): Promise<ArrayBuffer> {
  switch (format.toLowerCase()) {
    // ... existing cases
    
    case 'tiff':
    case 'tif':
      return encodeTIFF(imageData);
    
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

async function encodeTIFF(imageData: ImageData): Promise<ArrayBuffer> {
  // Import TIFF encoder library
  const { encode } = await import('tiff');
  return encode({
    width: imageData.width,
    height: imageData.height,
    data: imageData.data
  });
}
```

#### For Video/Audio Formats

Edit `/lib/convert/video.ts`:

```typescript
export async function convertVideo(
  inputBuffer: ArrayBuffer,
  fromFormat: string,
  toFormat: string
): Promise<ArrayBuffer> {
  const ffmpeg = await loadFFmpeg();
  
  // ... existing code
  
  // Add format-specific arguments
  if (toFormat === 'opus') {
    args.push('-c:a', 'libopus', '-b:a', '128k');
  } else if (toFormat === 'vp9') {
    args.push('-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0');
  }
  
  // ... rest of function
}
```

## Step 3: Add to tools.json

### Basic Entry

Add minimal entry to `/data/tools.json`:

```json
{
  "id": "webp-to-jpg",
  "name": "WEBP to JPG",
  "route": "/tools/webp-to-jpg",
  "from": "webp",
  "to": "jpg",
  "priority": 8,
  "tags": ["image", "converter", "webp", "jpg"]
}
```

### Full Entry with Content

Add comprehensive content:

```json
{
  "id": "webp-to-jpg",
  "name": "WEBP to JPG",
  "route": "/tools/webp-to-jpg",
  "from": "webp",
  "to": "jpg",
  "priority": 8,
  "tags": ["image", "converter", "webp", "jpg"],
  "content": {
    "tool": {
      "title": "WEBP to JPG Converter",
      "subtitle": "Convert WebP images to JPEG format for broader compatibility"
    },
    "videoSection": {
      "embedId": "youtube-video-id"
    },
    "faqs": [
      {
        "question": "What is WebP format?",
        "answer": "WebP is a modern image format developed by Google that provides superior lossless and lossy compression for images on the web."
      },
      {
        "question": "Why convert WebP to JPG?",
        "answer": "While WebP offers better compression, JPG has universal support across all devices and software, making it necessary for compatibility."
      },
      {
        "question": "Is the conversion lossless?",
        "answer": "Converting from WebP to JPG involves re-encoding and may result in some quality loss, as JPG uses lossy compression."
      }
    ],
    "aboutSection": {
      "title": "WebP vs JPG Comparison",
      "fromFormat": {
        "name": "WebP",
        "fullName": "Web Picture format",
        "description": "A modern image format providing superior compression",
        "pros": [
          "25-35% smaller file sizes than JPEG",
          "Supports transparency like PNG",
          "Supports animation like GIF",
          "Both lossy and lossless compression"
        ],
        "cons": [
          "Limited software support",
          "Not supported by older browsers",
          "Less familiar to users"
        ],
        "useCases": [
          "Web optimization",
          "Modern web applications",
          "Progressive web apps"
        ]
      },
      "toFormat": {
        "name": "JPG",
        "fullName": "Joint Photographic Experts Group",
        "description": "The most widely used image format",
        "pros": [
          "Universal compatibility",
          "Excellent for photographs",
          "Adjustable quality levels",
          "Wide software support"
        ],
        "cons": [
          "No transparency support",
          "Lossy compression only",
          "Larger files than WebP"
        ],
        "useCases": [
          "Digital photography",
          "Web images",
          "Email attachments",
          "Social media"
        ]
      }
    }
  }
}
```

## Step 4: Test the Converter

### Local Testing

1. Start development server:
```bash
npm run dev
```

2. Navigate to your converter:
```
http://localhost:3000/tools/webp-to-jpg
```

3. Test with sample files

### Test Checklist

- [ ] File upload works
- [ ] Drag and drop works
- [ ] Conversion completes successfully
- [ ] Download works correctly
- [ ] Error handling for invalid files
- [ ] Progress indicator shows (for large files)
- [ ] Mobile responsive layout

## Step 5: Add File Type Support

### Update Accept Attribute

Ensure the file input accepts the correct format:

```typescript
// In HeroConverter or page component
<HeroConverter 
  from="webp" 
  to="jpg"
  accept=".webp,image/webp"
/>
```

### Add MIME Type

Update MIME type mapping if needed:

```typescript
// In worker or conversion logic
const mimeTypes: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  // ... add new types
};
```

## Step 6: Handle Edge Cases

### Large Files

```typescript
// Check file size before processing
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large. Maximum size is 100MB.');
}
```

### Invalid Formats

```typescript
// Validate file type
const validExtensions = ['.webp'];
const fileExtension = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));

if (!validExtensions.includes(fileExtension)) {
  throw new Error(`Invalid file type. Expected ${validExtensions.join(', ')}`);
}
```

## Advanced Features

### Batch Processing

Create a batch converter variant:

```typescript
// app/tools/(convert)/batch-webp-to-jpg/page.tsx
import BatchHeroConverter from "@/components/BatchHeroConverter";

export default function BatchWebpToJpgPage() {
  return (
    <BatchHeroConverter
      title="Batch WEBP to JPG Converter"
      from="webp"
      to="jpg"
      processFile={async (file) => {
        // Process individual file
        const buffer = await file.arrayBuffer();
        const converted = await convertImage(buffer, 'webp', 'jpg');
        return new Blob([converted], { type: 'image/jpeg' });
      }}
    />
  );
}
```

### Custom Options

Add conversion options:

```typescript
interface ConversionOptions {
  quality?: number;
  resize?: { width: number; height: number };
  format?: string;
}

<HeroConverter
  from="webp"
  to="jpg"
  options={{
    quality: 0.9,
    resize: { width: 1920, height: 1080 }
  }}
/>
```

## Video Converter Example

For video formats:

```typescript
// app/tools/(convert)/mkv-to-mp4/page.tsx
export default function MkvToMp4Page() {
  const content = toolContent["mkv-to-mp4"];
  
  // Check if video conversion is supported
  const capabilities = detectCapabilities();
  
  if (!capabilities.supportsVideoConversion) {
    return (
      <div className="alert alert-warning">
        <p>Video conversion is not available in static mode.</p>
        <p>Please use the server deployment for this feature.</p>
      </div>
    );
  }
  
  if (!content) {
    return <HeroConverter from="mkv" to="mp4" />;
  }
  
  return <ToolPageTemplate content={content} />;
}
```

## Troubleshooting

### Converter Not Working

1. Check browser console for errors
2. Verify format is in supported list
3. Check worker message format
4. Ensure proper MIME types

### Page Not Found

1. Verify file path matches route pattern
2. Check for typos in filename
3. Restart dev server after creating new files

### Content Not Showing

1. Verify tool ID in tools.json matches page
2. Check content structure is valid JSON
3. Ensure toolContent import is correct

## Checklist

- [ ] Page component created
- [ ] Format support verified/added
- [ ] Entry added to tools.json
- [ ] Metadata added for SEO
- [ ] File tested locally
- [ ] Error handling implemented
- [ ] Mobile responsive verified
- [ ] Documentation updated

## See Also

- [Tool Page Pattern](../patterns/tool-page-pattern.md) - Page structure
- [Converter Pattern](../patterns/converter-pattern.md) - Conversion architecture
- [Add Tool Content](add-tool-content.md) - Content management
- [Worker Pattern](../patterns/worker-pattern.md) - Background processing