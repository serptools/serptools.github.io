# Component Pattern

React component architecture and composition patterns used in SerpTools.

## Overview

SerpTools uses a modern Next.js/React component architecture built around file conversion tools and utilities. The system is organized into multiple layers with clear separation of concerns:

- **Template Components**: High-level layout and page templates
- **Hero Components**: Core conversion UI variants  
- **Section Components**: Reusable content sections
- **UI Components**: Shadcn/ui-based design system components
- **Feature Components**: Specialized tool-specific components

## Component Architecture

### Directory Structure

```
components/
├── ui/                          # Shadcn/ui design system
│   ├── button.tsx              # CVA-based Button component
│   ├── card.tsx                # Card layout primitives
│   ├── input.tsx               # Form input components
│   └── progress.tsx            # Progress indicators
├── sections/                    # Reusable content sections
│   ├── FAQSection.tsx          # Expandable FAQ lists
│   ├── RelatedToolsSection.tsx # Tool recommendations
│   ├── ToolsLinkHub.tsx        # Site-wide tool footer
│   └── VideoSection.tsx        # YouTube embed wrapper
├── tools/                       # Tool-specific components
│   ├── CharacterCounter.tsx    # Text analysis tool
│   └── JsonToCsv.tsx          # Data conversion tool
├── files/                       # File type page components
│   ├── FileTypeHero.tsx        # File extension landing hero
│   ├── FileTypeSidebar.tsx     # Related file info
│   └── TechnicalInfoSection.tsx
├── HeroConverter.tsx            # Base conversion component
├── LanderHeroTwoColumn.tsx     # Video + converter layout
├── BatchHeroConverter.tsx      # Multi-file processing
├── ToolPageTemplate.tsx        # Main page template
└── VideoProgress.tsx           # Progress tracking UI
```

## Core Component Types

### 1. Template Components

#### ToolPageTemplate
**Purpose**: Main layout wrapper for conversion tools
**Props Pattern**: Accepts structured content data from `tools.json`

```typescript
type ToolPageProps = {
  tool: ToolInfo;
  videoSection?: VideoSectionData;
  useTwoColumnLayout?: boolean; // Controls layout variant
  faqs?: FAQ[];
  aboutSection?: AboutFormatsSectionData;
  changelog?: ChangelogEntry[];
  relatedTools?: RelatedTool[];
  blogPosts?: BlogPost[];
};

export default function ToolPageTemplate({
  tool,
  videoSection,
  useTwoColumnLayout = true,
  faqs,
  aboutSection,
  changelog,
  relatedTools,
  blogPosts,
}: ToolPageProps) {
  // Conditional layout based on tool requirements
  const shouldUseTwoColumn = useTwoColumnLayout && 
    videoSection?.embedId && 
    !tool.requiresFFmpeg;
  
  return (
    <main className="min-h-screen bg-background">
      {/* Conditional hero section */}
      {shouldUseTwoColumn ? (
        <LanderHeroTwoColumn {...heroProps} />
      ) : (
        <HeroConverter {...heroProps} />
      )}
      
      {/* Content sections */}
      {aboutSection && <AboutFormatsSection {...aboutSection} />}
      {tool.from && tool.to && <RelatedToolsSection {...relatedProps} />}
      {faqs && <FAQSection faqs={faqs} />}
      {blogPosts && <BlogSection blogPosts={blogPosts} />}
      {changelog && <ChangelogSection changelog={changelog} />}
      
      {/* Site-wide footer */}
      <ToolsLinkHub />
    </main>
  );
}
```

### 2. Hero Component Variants

#### HeroConverter (Base Implementation)
**Purpose**: Standard single-column conversion interface
**Key Features**: Drag-drop, file processing, progress tracking, color theming

```typescript
type Props = {
  title: string;
  subtitle?: string;
  from: string;              // Source format
  to: string;                // Target format  
  accept?: string;           // File input accept attribute
  videoEmbedId?: string;     // Optional video integration
};

export default function HeroConverter({
  title,
  subtitle = "Fast, private, in-browser conversion.",
  from,
  to,
  accept,
  videoEmbedId,
}: Props) {
  // State management
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("or drop files here");
  const [dropEffect, setDropEffect] = useState<string>("");
  const [currentFile, setCurrentFile] = useState<FileProgressState | null>(null);
  
  // Refs for DOM access and workers
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  
  // Deterministic color generation
  const randomColor = generateStableColor(from + to);
  
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8 text-center">
        {/* Progress indicator */}
        {currentFile && busy && (
          <VideoProgress {...currentFile} />
        )}
        
        {/* Main drop zone */}
        <div
          ref={dropRef}
          className={`mt-8 mx-auto max-w-6xl border-2 border-dashed rounded-2xl p-12 hover:border-opacity-80 transition-colors cursor-pointer ${
            dropEffect ? `animate-${dropEffect}` : ""
          }`}
          style={{
            backgroundColor: randomColor + "15",
            borderColor: randomColor,
          }}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {/* Content and interactions */}
        </div>
      </div>
    </section>
  );
}
```

#### LanderHeroTwoColumn
**Purpose**: Video tutorial + conversion interface layout
**Key Features**: Grid layout, video integration, capability detection

```typescript
export default function LanderHeroTwoColumn({
  title,
  subtitle = "Fast, private, in-browser conversion.",
  from,
  to,
  accept,
  videoEmbedId = "bbkhxMpIH4w",
}: Props) {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  
  // Detect browser capabilities on mount
  useEffect(() => {
    setCapabilities(detectCapabilities());
  }, []);
  
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1400px] px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center mb-12">
          {title}
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          {/* Video Column */}
          <div className="order-2 lg:order-1">
            <div className="relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900" 
                 style={{ aspectRatio: '16/9' }}>
              {videoEmbedId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoEmbedId}?${videoPlaying ? 'autoplay=1&' : ''}mute=1&loop=1`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <ConversionStatusIndicator />
              )}
            </div>
          </div>

          {/* Dropzone Column */}
          <div className="order-1 lg:order-2">
            <DropZoneInterface />
            
            {/* Capability warnings */}
            {capabilities && !capabilities.supportsVideoConversion && (
              <CapabilityWarning />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```

#### BatchHeroConverter
**Purpose**: Multi-file processing with compression features
**Key Features**: Batch operations, compression levels, ZIP downloads

```typescript
export default function BatchHeroConverter({
  title,
  subtitle = "Fast, private, in-browser batch compression.",
  from,
  to,
  accept,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<Map<string, ProcessedFile>>(new Map());
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('high');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  
  async function downloadZip() {
    const { createZipBlob } = await import("@/lib/zipUtils");
    const blobMap = new Map<string, Blob>();
    processedFiles.forEach((value, key) => {
      blobMap.set(key, value.blob);
    });
    const zipBlob = await createZipBlob(blobMap);
    saveBlob(zipBlob, "compressed_files.zip");
  }
  
  return (
    <section className="relative flex items-center justify-center min-h-[60vh] px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" />
      
      <div className="relative w-full max-w-4xl mx-auto py-16">
        {/* Compression level controls */}
        <CompressionLevelSelector />
        
        {/* File processing interface */}
        <ProcessingInterface />
        
        {/* Results and download */}
        <ResultsSection />
      </div>
    </section>
  );
}
```

### 3. UI Component System

#### Shadcn/ui Integration
The project uses shadcn/ui as its design system foundation:

```typescript
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### 4. Section Components

#### RelatedToolsSection
**Purpose**: Show contextually relevant tools
**Logic**: Filter tools by format compatibility

```typescript
type RelatedToolsSectionProps = {
  currentFrom: string;
  currentTo: string;
  currentPath: string;
};

export function RelatedToolsSection({ currentFrom, currentTo, currentPath }: RelatedToolsSectionProps) {
  const allTools = (toolsData as any[]).filter(tool => tool.isActive);
  
  // Find tools that involve either format
  const relatedTools = allTools.filter(tool => 
    ((tool.from === currentFrom || tool.to === currentFrom || 
      tool.from === currentTo || tool.to === currentTo)) && 
    tool.route !== currentPath
  );

  // Remove duplicates and limit results
  const uniqueTools = Array.from(new Set(relatedTools.map(t => t.id)))
    .map(id => relatedTools.find(t => t.id === id))
    .filter(Boolean);

  if (uniqueTools.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
          Related Tools
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {uniqueTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

#### FAQSection  
**Purpose**: Expandable FAQ interface
**Features**: Accordion-style expansion, click-to-expand

```typescript
export function FAQSection({ faqs }: { faqs: FAQ[] }) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600">
            Everything you need to know about our converter
          </p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <Card
              key={idx}
              className="p-6 cursor-pointer border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
              onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg pr-4 text-gray-900">
                  {faq.question}
                </h3>
                <ChevronIcon isExpanded={expandedFaq === idx} />
              </div>
              
              {expandedFaq === idx && (
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 5. Tool-Specific Components

#### CharacterCounter
**Purpose**: Real-time text analysis tool
**Features**: Statistics calculation, platform limits, reading time

```typescript
export default function CharacterCounter() {
  const [text, setText] = useState("");
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    lines: 0,
    readingTime: 0,
    speakingTime: 0,
  });

  useEffect(() => {
    // Real-time calculation
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    const lines = text.split(/\n/).length;
    
    // Time estimates
    const readingTime = Math.ceil(words / 200); // 200 WPM
    const speakingTime = Math.ceil(words / 150); // 150 WPM

    setStats({
      characters, charactersNoSpaces, words, sentences, 
      paragraphs, lines, readingTime, speakingTime,
    });
  }, [text]);

  return (
    <section className="w-full bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Text Input */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-96 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type or paste your text here..."
              />
              <ActionButtons />
            </Card>
          </div>

          {/* Statistics Panels */}
          <div className="space-y-4">
            <StatsCard stats={stats} />
            <TimeEstimatesCard stats={stats} />
            <PlatformLimitsCard stats={stats} />
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 6. Progress and State Components

#### VideoProgress
**Purpose**: File processing progress indication
**Features**: Multi-state indicators, progress bars, error handling

```typescript
interface VideoProgressProps {
  fileName: string;
  progress: number;
  status: 'loading' | 'processing' | 'completed' | 'error';
  message?: string;
}

export function VideoProgress({ fileName, progress, status, message }: VideoProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card className="p-4 mb-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium truncate max-w-[200px]" title={fileName}>
              {fileName}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {getStatusText()}
          </span>
        </div>
        
        <Progress 
          value={progress} 
          className="h-2"
          indicatorClassName={getProgressColor()}
        />
      </div>
    </Card>
  );
}

// Multi-file progress tracking
export function MultiFileProgress({ files }: MultiFileProgressProps) {
  const totalProgress = files.reduce((acc, file) => acc + file.progress, 0) / files.length;
  const completedCount = files.filter(f => f.status === 'completed').length;
  
  return (
    <div className="space-y-4">
      <OverallProgressCard />
      <div className="space-y-2">
        {files.map((file) => (
          <VideoProgress key={file.id} {...file} />
        ))}
      </div>
    </div>
  );
}
```

## TypeScript Integration

### Interface Patterns

All components use strict TypeScript interfaces:

```typescript
// Base tool info
export interface ToolInfo {
  title: string;
  subtitle: string;
  from: string;
  to: string;
  accept?: string;
  requiresFFmpeg?: boolean;
}

// Component prop interfaces
interface HeroConverterProps {
  title: string;
  subtitle?: string;
  from: string;
  to: string;
  accept?: string;
  videoEmbedId?: string;
}

// Content structure interfaces
export interface ToolContent {
  tool: ToolInfo;
  videoSection?: VideoSectionData;
  faqs: FAQ[];
  aboutSection: AboutFormatsSection;
  changelog?: ChangelogEntry[];
  relatedTools?: RelatedTool[];
  blogPosts?: BlogPost[];
}

// UI component props extend HTML element props
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
```

### Generic Patterns

```typescript
// Progress state management
type FileProgressState = {
  name: string;
  progress: number;
  status: 'loading' | 'processing' | 'completed' | 'error';
  message?: string;
};

// Processing results
type ProcessedFile = {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
};

// Capability detection
type Capabilities = {
  supportsVideoConversion: boolean;
  reason?: string;
};
```

## State Management Patterns

### Local State Architecture

Components manage their own state using React hooks:

```typescript
function HeroConverter() {
  // Processing state
  const [busy, setBusy] = useState(false);
  const [currentFile, setCurrentFile] = useState<FileProgressState | null>(null);
  
  // UI interaction state  
  const [hint, setHint] = useState("or drop files here");
  const [dropEffect, setDropEffect] = useState<string>("");
  
  // Browser capability state
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  
  // Refs for DOM and Worker access
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
}
```

### Effect Patterns

```typescript
// Capability detection on mount
useEffect(() => {
  setCapabilities(detectCapabilities());
}, []);

// Cleanup effects for workers
useEffect(() => {
  if (dropEffect) {
    const timer = setTimeout(() => setDropEffect(""), 1000);
    return () => clearTimeout(timer);
  }
}, [dropEffect]);

// Worker cleanup on unmount
useEffect(() => {
  return () => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }
  };
}, []);
```

## Styling Architecture

### Tailwind + CVA Pattern

Components use Tailwind CSS with Class Variance Authority for variant management:

```typescript
const buttonVariants = cva(
  // Base classes
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3", 
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### Dynamic Styling

```typescript
// Tool-specific color generation
const colors = [
  "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899",
  "#14b8a6", "#f97316", "#6366f1", "#f43f5e", "#0ea5e9", "#84cc16",
];

const hashCode = (from + to).split('').reduce((hash, char) => {
  return char.charCodeAt(0) + ((hash << 5) - hash);
}, 0);
const randomColor = colors[Math.abs(hashCode) % colors.length];

// Apply dynamic styles
<div 
  className="border-2 border-dashed rounded-xl p-12 transition-colors"
  style={{
    backgroundColor: randomColor + "15", // 15% opacity
    borderColor: randomColor,
  }}
/>
```

### Animation Classes

```typescript
// Conditional animation classes
<div 
  className={`transition-all ${
    dropEffect ? `animate-${dropEffect}` : ""
  }`}
/>

// Available animations: splash, bounce, spin, pulse, shake, flip, zoom, confetti
```

## Performance Patterns

### Worker Integration

```typescript
function ensureWorker() {
  if (!workerRef.current) {
    workerRef.current = new Worker(
      new URL("../workers/convert.worker.ts", import.meta.url),
      { type: "module" }
    );
    
    // Error handling
    workerRef.current.onerror = (error) => {
      console.error('Worker error:', error);
    };
  }
  return workerRef.current;
}

// Processing with progress updates
async function handleFiles(files: FileList) {
  const worker = ensureWorker();
  
  for (const file of Array.from(files)) {
    const buf = await file.arrayBuffer();
    
    await new Promise<void>((resolve, reject) => {
      worker.onmessage = (ev) => {
        // Handle progress updates
        if (ev.data?.type === 'progress') {
          setCurrentFile(prev => ({ ...prev, progress: ev.data.progress }));
          return;
        }
        
        // Handle completion
        if (ev.data?.ok) {
          const blob = new Blob([ev.data.blob], { type: mimeType });
          saveBlob(blob, outputName);
          resolve();
        } else {
          reject(new Error(ev.data?.error));
        }
      };
      
      worker.postMessage({ op: "convert", from, to, buf }, [buf]);
    });
  }
}
```

### Lazy Loading

```typescript
// Dynamic imports for heavy utilities
async function downloadZip() {
  const { createZipBlob } = await import("@/lib/zipUtils");
  // Process files...
}

// Conditional capability loading
const { detectCapabilities } = await import("@/lib/capabilities");
```

### Memoization

```typescript
// Stable color generation
const randomColor = useMemo(() => {
  const hashCode = (from + to).split('').reduce((hash, char) => {
    return char.charCodeAt(0) + ((hash << 5) - hash);
  }, 0);
  return colors[Math.abs(hashCode) % colors.length];
}, [from, to]);
```

## Page Component Patterns

### Route-based Components

```typescript
// app/tools/character-counter/page.tsx
export default function Page() {
  const content = toolContent["character-counter"];
  
  if (!content) {
    return <div>Tool not found</div>;
  }
  
  return (
    <main className="min-h-screen bg-background">
      <CharacterCounter />
      {content.relatedTools && <RelatedToolsSection relatedTools={content.relatedTools} />}
      {content.faqs && <FAQSection faqs={content.faqs} />}
      {content.blogPosts && <BlogSection blogPosts={content.blogPosts} />}
      {content.changelog && <ChangelogSection changelog={content.changelog} />}
      <ToolsLinkHub />
    </main>
  );
}

// app/tools/(convert)/mp4-to-mp3/page.tsx - Generated tool pages
export default function ToolPage() {
  const content = toolContent["mp4-to-mp3"];
  
  if (!content) {
    return <HeroConverter from="mp4" to="mp3" />;
  }
  
  return <ToolPageTemplate {...content} />;
}
```

### File Type Pages

```typescript
// app/files/[slug]/page.tsx  
export default function FileTypePage({ params }: { params: { slug: string } }) {
  const fileData = getFileTypeData(params.slug);
  
  return (
    <FileTypePageTemplate data={fileData}>
      <FileTypeHero {...fileData} />
      <FileTypeSidebar {...fileData} />
      <TechnicalInfoSection moreInfo={fileData.moreInfo} />
      <HowToOpenSection {...fileData} />
    </FileTypePageTemplate>
  );
}
```

## Error Handling Patterns

### Worker Error Handling

```typescript
// Worker error boundaries
worker.onmessage = (ev) => {
  if (!ev.data) {
    console.error('Received malformed worker message:', ev);
    setCurrentFile(prev => ({ ...prev, status: 'error', message: 'Invalid worker response' }));
    return reject(new Error("Malformed worker response"));
  }
  
  if (!ev.data.ok) {
    setCurrentFile(prev => ({ 
      ...prev, 
      status: 'error', 
      message: ev.data.error || 'Conversion failed' 
    }));
    return reject(new Error(ev.data.error || "Convert failed"));
  }
};

worker.onerror = (error) => {
  reject(new Error(`Worker error: ${error.message || error}`));
};
```

### Capability Warnings

```typescript
// Browser capability detection with user feedback
{capabilities && !capabilities.supportsVideoConversion && (
  (from && ['mp4', 'mkv', 'avi', 'webm', 'mov'].includes(from) || 
   to && ['mp3', 'wav', 'aac', 'm4a', 'ogg'].includes(to)) && (
    <Alert variant="warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Video conversion temporarily disabled: {capabilities.reason}. 
        Deploy to a server environment to enable video processing.
      </AlertDescription>
    </Alert>
  )
)}
```

## Testing Patterns

### Component Testing Structure

```typescript
// Component test patterns (inferred from codebase structure)
describe('HeroConverter', () => {
  it('should render with correct props', () => {
    render(<HeroConverter from="jpg" to="png" title="JPG to PNG" />);
    expect(screen.getByText('JPG to PNG')).toBeInTheDocument();
  });
  
  it('should generate stable colors', () => {
    const { rerender } = render(<HeroConverter from="jpg" to="png" />);
    const firstColor = getComputedStyle(element).borderColor;
    
    rerender(<HeroConverter from="jpg" to="png" />);
    const secondColor = getComputedStyle(element).borderColor;
    
    expect(firstColor).toBe(secondColor);
  });
});
```

## Best Practices

### Component Design Principles

1. **Single Responsibility**: Each component has one clear, focused purpose
2. **Composition over Inheritance**: Use component composition for flexibility
3. **Props over Configuration**: Prefer explicit props over global configuration
4. **Predictable State**: Components manage their own state predictably
5. **Type Safety First**: All components use strict TypeScript interfaces
6. **Performance-Aware**: Use refs, memoization, and lazy loading appropriately

### File Organization

1. **Logical Grouping**: Components grouped by function (ui/, sections/, tools/)
2. **Co-location**: Keep related types, utils, and components together
3. **Clear Exports**: Use named exports for clarity, default exports for main components
4. **Index Files**: Avoid index.ts files that re-export everything

### Styling Guidelines

1. **Tailwind First**: Use utility classes for most styling
2. **Component Variants**: Use CVA for component variants
3. **Dynamic Styles**: Use style objects for dynamic/computed styles
4. **Consistent Spacing**: Follow consistent spacing and sizing patterns
5. **Responsive Design**: Mobile-first responsive design patterns

### State Management

1. **Local State**: Keep state as local as possible
2. **Prop Drilling**: Use prop drilling for simple data flow
3. **Custom Hooks**: Extract complex state logic into custom hooks
4. **Worker Management**: Properly clean up workers and event listeners

## Common Anti-Patterns to Avoid

### ❌ Avoid These Patterns

```typescript
// Don't: Using any types
function BadComponent(props: any) { }

// Don't: Not cleaning up effects
useEffect(() => {
  const worker = new Worker(...);
  // Missing cleanup!
}, []);

// Don't: Mutation of props
function BadComponent({ items }: { items: Item[] }) {
  items.push(newItem); // Don't mutate props
}

// Don't: Complex component hierarchies
<Wrapper>
  <Container>
    <InnerWrapper>
      <Content>
        <ActualContent /> 
      </Content>
    </InnerWrapper>
  </Container>
</Wrapper>
```

### ✅ Use These Patterns Instead

```typescript
// Do: Explicit typing
interface ComponentProps {
  items: Item[];
  onUpdate: (items: Item[]) => void;
}

// Do: Proper cleanup
useEffect(() => {
  const worker = new Worker(...);
  return () => worker.terminate();
}, []);

// Do: Immutable updates
function GoodComponent({ items, onUpdate }: ComponentProps) {
  const handleAdd = (newItem: Item) => {
    onUpdate([...items, newItem]);
  };
}

// Do: Flat component structures
<ComponentWithContent items={items} />
```

## Future Architecture Considerations

### Scalability Patterns

1. **Component Library**: Consider extracting reusable components into a separate library
2. **State Management**: Consider Zustand or Valtio for complex state needs
3. **Route-based Code Splitting**: Implement proper code splitting for large tool sets
4. **Component Documentation**: Use Storybook or similar for component documentation

### Performance Optimizations

1. **Virtual Scrolling**: For large tool lists or file processing results
2. **Suspense Boundaries**: For better loading states with React Suspense
3. **Service Workers**: For offline functionality and background processing
4. **Web Streams**: For large file processing with streaming

## Related Documentation

- [Tool Page Pattern](tool-page-pattern.md) - Page structure and routing
- [Worker Pattern](worker-pattern.md) - Background processing architecture  
- [Code Standards](../code-standards.md) - TypeScript and coding conventions
- [Add New Converter](../recipes/add-new-converter.md) - Implementation guide
- [Component Testing](../testing/component-testing.md) - Testing strategies