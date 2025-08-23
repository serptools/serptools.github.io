# Add Tool Content

How to add rich content to tools through the `tools.json` configuration.

## Overview

Tool content enhances converter pages with FAQs, format comparisons, video tutorials, blog posts, and related tools. Content is managed centrally in `tools.json` and rendered by `ToolPageTemplate`.

## Content Structure

### Basic Tool Entry

Minimal configuration for a tool:

```json
{
  "id": "jpg-to-png",
  "name": "JPG to PNG",
  "route": "/tools/jpg-to-png",
  "from": "jpg",
  "to": "png",
  "priority": 10,
  "tags": ["image", "converter"]
}
```

### Full Content Structure

Complete content configuration:

```json
{
  "id": "jpg-to-png",
  "name": "JPG to PNG",
  "route": "/tools/jpg-to-png",
  "from": "jpg",
  "to": "png",
  "priority": 10,
  "tags": ["image", "converter", "popular"],
  "content": {
    "tool": {
      "title": "JPG to PNG Converter",
      "subtitle": "Convert JPEG images to PNG format with transparency support",
      "from": "jpg",
      "to": "png"
    },
    "videoSection": {
      "embedId": "dQw4w9WgXcQ"
    },
    "faqs": [...],
    "aboutSection": {...},
    "blogPosts": [...],
    "relatedTools": [...],
    "changelog": [...]
  }
}
```

## Content Sections

### Tool Section

Basic tool information:

```json
"tool": {
  "title": "JPG to PNG Converter",
  "subtitle": "Convert JPEG images to PNG format with transparency support",
  "from": "jpg",
  "to": "png"
}
```

### Video Section

YouTube tutorial embed:

```json
"videoSection": {
  "embedId": "dQw4w9WgXcQ",
  "title": "How to Convert JPG to PNG",
  "description": "Learn how to use our JPG to PNG converter"
}
```

### FAQs Section

Frequently asked questions:

```json
"faqs": [
  {
    "question": "What is the difference between JPG and PNG?",
    "answer": "JPG uses lossy compression and is best for photographs, while PNG uses lossless compression and supports transparency, making it ideal for graphics and logos."
  },
  {
    "question": "Will converting JPG to PNG improve quality?",
    "answer": "No, converting from JPG to PNG cannot restore quality lost during the original JPG compression. However, PNG will preserve the current quality without further loss."
  },
  {
    "question": "Why are PNG files larger than JPG?",
    "answer": "PNG uses lossless compression which preserves all image data, resulting in larger files. JPG uses lossy compression, discarding some data to achieve smaller file sizes."
  },
  {
    "question": "Can I batch convert multiple files?",
    "answer": "Yes, you can select and convert multiple JPG files to PNG at once. Simply select all files you want to convert when uploading."
  },
  {
    "question": "Is the conversion done on my device?",
    "answer": "Yes, all conversions happen directly in your browser. Your files are never uploaded to our servers, ensuring complete privacy and security."
  }
]
```

### About Section

Format comparison and details:

```json
"aboutSection": {
  "title": "JPG vs PNG: Understanding the Differences",
  "introduction": "Choosing between JPG and PNG depends on your specific needs.",
  "fromFormat": {
    "name": "JPG",
    "fullName": "Joint Photographic Experts Group",
    "description": "JPG is the most common image format used for digital photography and web images.",
    "technicalDetails": {
      "compression": "Lossy",
      "colorDepth": "24-bit (16.7 million colors)",
      "transparency": "Not supported",
      "animation": "Not supported",
      "metadata": "EXIF support"
    },
    "pros": [
      "Smaller file sizes",
      "Excellent for photographs",
      "Universal compatibility",
      "Adjustable compression levels",
      "Fast loading on web"
    ],
    "cons": [
      "Lossy compression reduces quality",
      "No transparency support",
      "Not ideal for text or line art",
      "Quality degrades with each save"
    ],
    "useCases": [
      "Digital photography",
      "Web images with photos",
      "Email attachments",
      "Social media photos",
      "Print materials"
    ],
    "history": "Developed in 1992 by the Joint Photographic Experts Group.",
    "statistics": {
      "marketShare": "72% of web images",
      "averageCompression": "10:1 ratio",
      "browserSupport": "100%"
    }
  },
  "toFormat": {
    "name": "PNG",
    "fullName": "Portable Network Graphics",
    "description": "PNG is a lossless format ideal for images requiring transparency or high quality.",
    "technicalDetails": {
      "compression": "Lossless (DEFLATE)",
      "colorDepth": "Up to 48-bit true color",
      "transparency": "Full alpha channel",
      "animation": "APNG variant available",
      "metadata": "Extensive chunk-based"
    },
    "pros": [
      "Lossless compression",
      "Transparency support",
      "Better for text and graphics",
      "No quality loss on save",
      "Gamma correction"
    ],
    "cons": [
      "Larger file sizes",
      "Slower web loading",
      "Not ideal for photos",
      "Limited animation support"
    ],
    "useCases": [
      "Logos and branding",
      "Screenshots",
      "Graphics with transparency",
      "Digital art",
      "Icons and UI elements"
    ],
    "history": "Created in 1996 as a free alternative to GIF.",
    "statistics": {
      "marketShare": "25% of web images",
      "averageSize": "3x larger than JPG",
      "browserSupport": "100%"
    }
  },
  "conversionConsiderations": [
    "Converting JPG to PNG won't improve quality",
    "File size will increase significantly",
    "Transparency areas will be white",
    "Metadata may be preserved or lost",
    "Color profiles should be maintained"
  ],
  "recommendations": {
    "whenToConvert": [
      "Need transparency for editing",
      "Preventing further quality loss",
      "Creating graphics from photos",
      "Archival purposes"
    ],
    "whenNotToConvert": [
      "Web optimization needed",
      "Email size limits",
      "Storage space concerns",
      "Photo galleries"
    ]
  }
}
```

### Blog Posts Section

Related articles and guides:

```json
"blogPosts": [
  {
    "title": "Complete Guide to Image Formats",
    "excerpt": "Understanding when to use JPG, PNG, WebP, and other formats.",
    "url": "/blog/complete-guide-image-formats",
    "date": "2024-01-15",
    "readTime": "8 min",
    "tags": ["tutorial", "formats"],
    "image": "/images/blog/image-formats.jpg"
  },
  {
    "title": "Optimizing Images for Web Performance",
    "excerpt": "Best practices for image optimization and format selection.",
    "url": "/blog/optimizing-images-web",
    "date": "2024-01-10",
    "readTime": "6 min",
    "tags": ["performance", "web"],
    "image": "/images/blog/optimization.jpg"
  }
]
```

### Related Tools Section

Links to similar converters:

```json
"relatedTools": [
  {
    "name": "PNG to JPG",
    "route": "/tools/png-to-jpg",
    "description": "Convert PNG images to JPG format"
  },
  {
    "name": "WEBP to PNG",
    "route": "/tools/webp-to-png",
    "description": "Convert WebP images to PNG format"
  },
  {
    "name": "Image Compressor",
    "route": "/tools/image-compressor",
    "description": "Reduce image file sizes"
  }
]
```

### Changelog Section

Version history and updates:

```json
"changelog": [
  {
    "version": "2.0.0",
    "date": "2024-01-20",
    "changes": [
      "Added batch processing support",
      "Improved conversion speed by 50%",
      "Added drag-and-drop functionality"
    ]
  },
  {
    "version": "1.5.0",
    "date": "2023-12-15",
    "changes": [
      "Added quality adjustment slider",
      "Fixed transparency handling",
      "Improved mobile interface"
    ]
  }
]
```

## Adding Content to Existing Tool

### Step 1: Find Tool in tools.json

Locate the tool entry by its ID:

```json
{
  "id": "jpg-to-png",
  "name": "JPG to PNG",
  "route": "/tools/jpg-to-png"
}
```

### Step 2: Add Content Object

Add the content property:

```json
{
  "id": "jpg-to-png",
  "name": "JPG to PNG",
  "route": "/tools/jpg-to-png",
  "content": {
    "tool": {
      "title": "JPG to PNG Converter",
      "subtitle": "Convert JPEG to PNG with transparency"
    }
  }
}
```

### Step 3: Add Sections Incrementally

Add sections as needed:

```json
"content": {
  "tool": {...},
  "faqs": [...],      // Add FAQs
  "videoSection": {...}, // Add video
  "aboutSection": {...}  // Add comparison
}
```

## Content Guidelines

### Writing FAQs

1. **Address Common Concerns**: What users typically ask
2. **Be Concise**: Clear, direct answers
3. **Technical Accuracy**: Correct information
4. **User-Friendly Language**: Avoid jargon
5. **Actionable**: Provide solutions

Example structure:
```json
{
  "question": "Short, clear question?",
  "answer": "Direct answer with explanation if needed."
}
```

### Format Descriptions

Include:
- Technical specifications
- Use cases
- Advantages and disadvantages
- History and development
- Current usage statistics

### Video Guidelines

- Use relevant, instructional content
- Keep videos short (2-5 minutes)
- Ensure good audio/video quality
- Include closed captions if possible

## Dynamic Content

### Conditional Rendering

Content sections render only if present:

```typescript
// In ToolPageTemplate
{content.faqs && <FAQSection faqs={content.faqs} />}
{content.videoSection && <VideoEmbed {...content.videoSection} />}
```

### Capability-Based Content

Show different content based on capabilities:

```typescript
const capabilities = detectCapabilities();

if (!capabilities.supportsVideoConversion) {
  content.warning = "Video conversion not available in static mode";
}
```

## SEO Optimization

### Rich Snippets

Structure content for search engines:

```json
"faqs": [
  {
    "question": "What is JPG format?",
    "answer": "JPG (Joint Photographic Experts Group) is a compressed image format...",
    "@type": "Question",
    "name": "What is JPG format?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "JPG (Joint Photographic Experts Group) is a compressed image format..."
    }
  }
]
```

### Meta Description

Craft compelling descriptions:

```json
"tool": {
  "title": "JPG to PNG Converter - Free Online Tool",
  "subtitle": "Convert JPEG images to PNG format instantly. Free, fast, and secure with no uploads required.",
  "metaDescription": "Free online JPG to PNG converter. Transform JPEG images to PNG format with transparency support. No registration, no uploads, works in your browser."
}
```

## Content Templates

### Minimal Content

```json
"content": {
  "tool": {
    "title": "Format to Format Converter",
    "subtitle": "Quick description"
  }
}
```

### Standard Content

```json
"content": {
  "tool": {...},
  "faqs": [
    // 3-5 common questions
  ],
  "aboutSection": {
    "fromFormat": {...},
    "toFormat": {...}
  }
}
```

### Comprehensive Content

```json
"content": {
  "tool": {...},
  "videoSection": {...},
  "faqs": [...],
  "aboutSection": {...},
  "blogPosts": [...],
  "relatedTools": [...],
  "changelog": [...]
}
```

## Validation

### JSON Validation

Ensure valid JSON syntax:

```bash
# Validate tools.json
npx jsonlint data/tools.json
```

### Content Validation

Check required fields:

```typescript
function validateToolContent(content: any) {
  if (!content.tool?.title) {
    throw new Error("Tool title is required");
  }
  
  if (content.faqs) {
    content.faqs.forEach((faq: any) => {
      if (!faq.question || !faq.answer) {
        throw new Error("FAQ must have question and answer");
      }
    });
  }
}
```

## Best Practices

1. **Accuracy**: Ensure technical information is correct
2. **Clarity**: Write for your audience level
3. **Completeness**: Cover common use cases
4. **Updates**: Keep content current
5. **Consistency**: Follow existing patterns
6. **SEO**: Include keywords naturally
7. **Value**: Provide useful information

## Troubleshooting

### Content Not Showing

1. Check JSON syntax is valid
2. Verify tool ID matches
3. Ensure content structure is correct
4. Check component imports

### Video Not Loading

1. Verify YouTube embed ID
2. Check network connectivity
3. Ensure iframe permissions

### FAQ Formatting Issues

1. Check for special characters
2. Escape quotes properly
3. Use proper line breaks

## See Also

- [Tool Page Pattern](../patterns/tool-page-pattern.md) - Page structure
- [Add New Converter](add-new-converter.md) - Creating converters
- [Component Pattern](../patterns/component-pattern.md) - Component usage
- [Quick Reference](../quick-reference.md) - Common tasks