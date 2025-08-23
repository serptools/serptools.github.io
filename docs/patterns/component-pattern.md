# Component Pattern

React component architecture and composition patterns used in SerpTools.

## Overview

The application uses a layered component architecture with template components, feature components, and utility components. Components are designed for reusability and follow a consistent structure.

## Related Files

- `/components/ToolPageTemplate.tsx` - Main tool page wrapper
- `/components/HeroConverter.tsx` - Primary conversion UI
- `/components/LanderHeroTwoColumn.tsx` - Two-column layout variant
- `/components/BatchHeroConverter.tsx` - Bulk processing variant
- `/app/tools/*/page.tsx` - Tool page implementations

## Component Hierarchy

```
ToolPageTemplate (Content wrapper)
├── HeroConverter (Main converter UI)
│   ├── UI Components (Button, etc.)
│   └── Worker Integration
├── LanderHeroTwoColumn (Variant with video)
│   ├── Video Embed
│   └── Converter UI
└── BatchHeroConverter (Bulk processing)
    ├── File List
    └── Progress Tracking
```

## Template Pattern

### ToolPageTemplate

Wrapper component that displays tool content from `tools.json`:

```typescript
interface ToolPageTemplateProps {
  content: {
    tool: {
      title: string;
      subtitle: string;
      from: string;
      to: string;
    };
    videoSection?: { embedId: string };
    faqs?: FAQ[];
    aboutSection?: AboutSection;
    // ... other content sections
  };
}

export default function ToolPageTemplate({ content }: Props) {
  return (
    <>
      {/* Render hero section */}
      <HeroConverter 
        from={content.tool.from}
        to={content.tool.to}
      />
      
      {/* Render content sections */}
      {content.faqs && <FAQSection faqs={content.faqs} />}
      {content.aboutSection && <AboutSection {...content.aboutSection} />}
    </>
  );
}
```

## Hero Component Variants

### HeroConverter (Base)

Standard file conversion interface:

```typescript
interface HeroConverterProps {
  from: string;      // Source format
  to: string;        // Target format
  accept?: string;   // File input accept attribute
}

export default function HeroConverter({ from, to, accept }: Props) {
  const workerRef = useRef<Worker | null>(null);
  const [busy, setBusy] = useState(false);
  
  async function handleFiles(files: FileList) {
    // Process files with worker
  }
  
  return (
    <div className="converter-ui">
      {/* Drag-drop zone */}
      {/* File input */}
      {/* Upload button */}
    </div>
  );
}
```

### LanderHeroTwoColumn

Enhanced layout with video tutorial:

```typescript
export default function LanderHeroTwoColumn({
  title,
  subtitle,
  from,
  to,
  videoEmbedId,
}: Props) {
  return (
    <div className="grid grid-cols-2">
      {/* Video column */}
      <div>
        <iframe src={`youtube.com/embed/${videoEmbedId}`} />
      </div>
      
      {/* Converter column */}
      <div>
        <ConverterUI from={from} to={to} />
      </div>
    </div>
  );
}
```

### BatchHeroConverter

Multiple file processing:

```typescript
export default function BatchHeroConverter({
  title,
  from,
  to,
  processFile,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Map<string, number>>();
  
  async function processAllFiles() {
    for (const file of files) {
      const result = await processFile(file);
      // Update progress
    }
  }
  
  return (
    <div>
      {/* File list */}
      {/* Progress indicators */}
      {/* Batch controls */}
    </div>
  );
}
```

## Page Component Pattern

Tool pages follow a consistent pattern:

```typescript
// app/tools/(convert)/[from]-to-[to]/page.tsx
import HeroConverter from "@/components/HeroConverter";
import ToolPageTemplate from "@/components/ToolPageTemplate";
import { toolContent } from "@/lib/tool-content";

export default function ToolPage() {
  // 1. Check for content in tools.json
  const content = toolContent["tool-id"];
  
  // 2. If no content, render basic converter
  if (!content) {
    return <HeroConverter from="source" to="target" />;
  }
  
  // 3. If content exists, use template
  return <ToolPageTemplate content={content} />;
}
```

## Component Composition

### Prop Drilling vs Context

The codebase primarily uses prop drilling for simplicity:

```typescript
// Props are passed explicitly
<ToolPageTemplate content={content}>
  <HeroConverter from={content.from} to={content.to} />
</ToolPageTemplate>
```

### Component Reusability

Components are designed to be reusable across different tools:

```typescript
// Same HeroConverter for all image conversions
<HeroConverter from="jpg" to="png" />
<HeroConverter from="png" to="webp" />
<HeroConverter from="gif" to="jpg" />
```

## State Management

### Local State Pattern

Components manage their own state:

```typescript
function Converter() {
  // File processing state
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // UI state
  const [dropEffect, setDropEffect] = useState("");
  const [hint, setHint] = useState("Drop files here");
  
  // Capabilities state
  const [capabilities, setCapabilities] = useState(null);
}
```

### Ref Management

Refs for DOM and Worker access:

```typescript
const inputRef = useRef<HTMLInputElement | null>(null);
const dropRef = useRef<HTMLDivElement | null>(null);
const workerRef = useRef<Worker | null>(null);
```

## Styling Pattern

### Tailwind + Dynamic Styles

```typescript
// Static classes with Tailwind
<div className="border-2 border-dashed rounded-xl p-12">

// Dynamic styles for theming
<div 
  className="base-classes"
  style={{
    backgroundColor: `${color}15`,
    borderColor: color,
  }}
/>
```

### Color Generation

Tool-specific colors based on format:

```typescript
const colors = ["#ef4444", "#f59e0b", /* ... */];
const hashCode = (from + to).split('').reduce((hash, char) => {
  return char.charCodeAt(0) + ((hash << 5) - hash);
}, 0);
const randomColor = colors[Math.abs(hashCode) % colors.length];
```

## Best Practices

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition over Inheritance**: Use component composition
3. **Props over State**: Prefer props for configuration
4. **Consistent Structure**: Follow the same component structure
5. **Type Safety**: Use TypeScript interfaces for props

## Common Patterns

### Conditional Rendering

```typescript
{content?.faqs && <FAQSection faqs={content.faqs} />}
{isVideoSupported ? <VideoConverter /> : <Warning />}
```

### Event Handling

```typescript
function handleDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  handleFiles(e.dataTransfer.files);
}
```

### Effect Cleanup

```typescript
useEffect(() => {
  const worker = new Worker(...);
  return () => worker.terminate();
}, []);
```

## See Also

- [Tool Page Pattern](tool-page-pattern.md) - Page structure
- [Worker Pattern](worker-pattern.md) - Background processing
- [Code Standards](../code-standards.md) - Coding conventions
- [Add New Converter](../recipes/add-new-converter.md) - Implementation guide