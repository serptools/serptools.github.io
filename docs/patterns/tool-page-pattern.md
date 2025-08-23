# Tool Page Pattern

How tool pages are structured and created in SerpTools.

## Overview

Tool pages follow a consistent pattern using Next.js App Router dynamic routes and optional content from `tools.json`. Pages check for rich content and fall back to a basic converter UI when content is not available.

## Related Files

- `/app/tools/(convert)/[from]-to-[to]/page.tsx` - Dynamic converter routes
- `/data/tools.json` - Tool content and configuration
- `/components/ToolPageTemplate.tsx` - Content wrapper
- `/components/HeroConverter.tsx` - Basic converter UI
- `/lib/tool-content.ts` - Content loading utilities

## Route Structure

```
/app/tools/
├── (convert)/
│   └── [from]-to-[to]/
│       └── page.tsx          # Dynamic route: /tools/jpg-to-png
├── csv-combiner/
│   └── page.tsx              # Static route: /tools/csv-combiner
└── layout.tsx                # Shared layout
```

## Page Component Pattern

### Basic Pattern

Every tool page follows this structure:

```typescript
// app/tools/(convert)/jpg-to-png/page.tsx
import HeroConverter from "@/components/HeroConverter";
import ToolPageTemplate from "@/components/ToolPageTemplate";
import { toolContent } from "@/lib/tool-content";

export default function JpgToPngPage() {
  // 1. Check for content in tools.json
  const content = toolContent["jpg-to-png"];
  
  // 2. If no content, render basic converter
  if (!content) {
    return <HeroConverter from="jpg" to="png" />;
  }
  
  // 3. If content exists, use template
  return <ToolPageTemplate content={content} />;
}
```

### With Metadata

Pages can export metadata for SEO:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JPG to PNG Converter - Free Online Tool",
  description: "Convert JPG images to PNG format instantly...",
  keywords: ["jpg to png", "image converter", "online tool"],
};

export default function JpgToPngPage() {
  // Page component
}
```

## Dynamic Routes

### Pattern: [from]-to-[to]

Dynamic segments for converter pages:

```typescript
// app/tools/(convert)/[from]-to-[to]/page.tsx
export default function DynamicConverterPage({
  params
}: {
  params: { from: string; to: string }
}) {
  const { from, to } = params;
  const toolId = `${from}-to-${to}`;
  const content = toolContent[toolId];
  
  if (!content) {
    return <HeroConverter from={from} to={to} />;
  }
  
  return <ToolPageTemplate content={content} />;
}
```

### Route Groups

Using (convert) for organization without affecting URLs:

```
/app/tools/(convert)/        # Group folder (not in URL)
  jpg-to-png/                # Actual route: /tools/jpg-to-png
  mp4-to-mp3/                # Actual route: /tools/mp4-to-mp3
```

## Content Management

### Tool Content Structure

In `tools.json`:

```json
{
  "id": "jpg-to-png",
  "name": "JPG to PNG",
  "route": "/tools/jpg-to-png",
  "from": "jpg",
  "to": "png",
  "priority": 10,
  "tags": ["image", "converter"],
  "content": {
    "tool": {
      "title": "JPG to PNG Converter",
      "subtitle": "Convert JPEG images to PNG format with transparency support"
    },
    "videoSection": {
      "embedId": "youtube-video-id"
    },
    "faqs": [
      {
        "question": "What is the difference between JPG and PNG?",
        "answer": "JPG uses lossy compression while PNG uses lossless..."
      }
    ],
    "aboutSection": {
      "title": "JPG vs PNG Format Comparison",
      "fromFormat": {
        "name": "JPG",
        "fullName": "Joint Photographic Experts Group",
        "description": "...",
        "pros": ["Smaller file size", "Wide support"],
        "cons": ["No transparency", "Lossy compression"],
        "useCases": ["Photographs", "Web images"]
      },
      "toFormat": {
        "name": "PNG",
        "fullName": "Portable Network Graphics",
        "description": "...",
        "pros": ["Transparency support", "Lossless"],
        "cons": ["Larger files"],
        "useCases": ["Logos", "Screenshots"]
      }
    }
  }
}
```

### Content Loading

```typescript
// lib/tool-content.ts
import toolsData from "@/data/tools.json";

// Map tool IDs to content
export const toolContent: Record<string, ToolContent> = {};

toolsData.forEach(tool => {
  if (tool.content) {
    toolContent[tool.id] = tool.content;
  }
});
```

## Template Components

### ToolPageTemplate

Renders full content when available:

```typescript
interface ToolPageTemplateProps {
  content: {
    tool: {
      title: string;
      subtitle: string;
      from?: string;
      to?: string;
    };
    videoSection?: {
      embedId: string;
    };
    faqs?: FAQ[];
    aboutSection?: AboutSection;
    blogPosts?: BlogPost[];
    relatedTools?: RelatedTool[];
  };
}

export default function ToolPageTemplate({ content }: Props) {
  const { tool, videoSection, faqs, aboutSection } = content;
  
  return (
    <>
      {/* Hero section with converter */}
      {videoSection ? (
        <LanderHeroTwoColumn
          title={tool.title}
          subtitle={tool.subtitle}
          from={tool.from}
          to={tool.to}
          videoEmbedId={videoSection.embedId}
        />
      ) : (
        <HeroConverter
          from={tool.from}
          to={tool.to}
        />
      )}
      
      {/* Content sections */}
      {faqs && <FAQSection faqs={faqs} />}
      {aboutSection && <AboutSection {...aboutSection} />}
      {blogPosts && <BlogSection posts={blogPosts} />}
      {relatedTools && <RelatedTools tools={relatedTools} />}
    </>
  );
}
```

## Page Variants

### Standard Converter Page

```typescript
// Simple converter without extra content
export default function ConverterPage() {
  return <HeroConverter from="jpg" to="png" />;
}
```

### Enhanced Converter Page

```typescript
// With video tutorial and content
export default function EnhancedPage() {
  const content = toolContent["mp4-to-mp3"];
  return <ToolPageTemplate content={content} />;
}
```

### Batch Processing Page

```typescript
// For bulk operations
export default function BatchPage() {
  return (
    <BatchHeroConverter
      title="Batch PNG Optimizer"
      from="png"
      to="png"
      processFile={optimizePng}
    />
  );
}
```

### Utility Tool Page

```typescript
// Non-converter tools
export default function CsvCombinerPage() {
  return (
    <div>
      <h1>CSV Combiner</h1>
      <CsvCombinerTool />
    </div>
  );
}
```

## Static Generation

### Generate Static Params

For dynamic routes with static export:

```typescript
// app/tools/(convert)/[from]-to-[to]/page.tsx
export async function generateStaticParams() {
  const tools = getAllTools();
  
  return tools
    .filter(tool => tool.route.includes('-to-'))
    .map(tool => {
      const [from, to] = tool.id.split('-to-');
      return { from, to };
    });
}
```

### Metadata Generation

Dynamic metadata based on params:

```typescript
export async function generateMetadata({
  params
}: {
  params: { from: string; to: string }
}): Promise<Metadata> {
  const { from, to } = params;
  
  return {
    title: `${from.toUpperCase()} to ${to.toUpperCase()} Converter`,
    description: `Convert ${from} files to ${to} format online`,
  };
}
```

## Layout Structure

### Tools Layout

Shared layout for all tool pages:

```typescript
// app/tools/layout.tsx
export default function ToolsLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto px-4">
      <nav className="breadcrumb">
        <Link href="/">Home</Link> / 
        <Link href="/tools">Tools</Link>
      </nav>
      {children}
    </div>
  );
}
```

## SEO Optimization

### Structured Data

```typescript
export default function ToolPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "JPG to PNG Converter",
    "description": "Convert JPG images to PNG format",
    "applicationCategory": "Utility",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      <HeroConverter from="jpg" to="png" />
    </>
  );
}
```

## Component Selection

### Decision Tree

```typescript
function selectComponent(tool: Tool) {
  // Has video tutorial?
  if (tool.content?.videoSection) {
    return LanderHeroTwoColumn;
  }
  
  // Batch processing?
  if (tool.tags?.includes('batch')) {
    return BatchHeroConverter;
  }
  
  // PDF conversion?
  if (tool.from === 'pdf') {
    return PdfConverter;
  }
  
  // Default converter
  return HeroConverter;
}
```

## Best Practices

1. **Content Fallback**: Always provide basic converter as fallback
2. **Consistent Structure**: Follow the same pattern for all pages
3. **SEO Metadata**: Include proper meta tags and structured data
4. **Static Generation**: Pre-render pages when possible
5. **Type Safety**: Use TypeScript interfaces for content
6. **Performance**: Lazy load heavy components

## Common Patterns

### Conditional Content Rendering

```typescript
{content?.faqs && <FAQSection faqs={content.faqs} />}
{content?.videoSection && (
  <VideoTutorial embedId={content.videoSection.embedId} />
)}
```

### Format-Specific Features

```typescript
// Add accept attribute for file input
const accept = getAcceptAttribute(from);
<HeroConverter from={from} to={to} accept={accept} />
```

### Error Boundaries

```typescript
<ErrorBoundary fallback={<HeroConverter from={from} to={to} />}>
  <ToolPageTemplate content={content} />
</ErrorBoundary>
```

## File Organization

```
/app/tools/
├── (convert)/           # Converter tools group
│   ├── jpg-to-png/
│   ├── mp4-to-mp3/
│   └── [from]-to-[to]/  # Dynamic fallback
├── (utilities)/         # Utility tools group
│   ├── csv-combiner/
│   └── json-formatter/
└── layout.tsx           # Shared layout
```

## See Also

- [Component Pattern](component-pattern.md) - Component architecture
- [Add New Converter](../recipes/add-new-converter.md) - Step-by-step guide
- [Add Tool Content](../recipes/add-tool-content.md) - Content management
- [Tool System](../modules/tool-system.md) - Tool registration