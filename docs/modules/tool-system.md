# Tool System

Comprehensive tool registration, routing, and content management system for conversion and utility tools.

## Overview

The tool system is the core architecture of SerpTools that manages all converter and utility tools through a centralized `tools.json` configuration. It provides a complete solution for tool discovery, dynamic routing, content management, SEO optimization, and user experience features including search, categorization, and related tool recommendations.

## Architecture

The tool system consists of several key components:

- **Tool Registry** (`data/tools.json`) - Central configuration for all tools
- **Type Definitions** (`types/Tools.d.ts`) - TypeScript interfaces for type safety
- **Utility Functions** (`lib/tool-utils.ts`, `lib/tool-content.ts`) - Helper functions
- **UI Components** - Template and component system for consistent tool pages
- **Route Structure** - Dynamic Next.js routing with static generation
- **Search & Discovery** - Tool search, categorization, and recommendation system

## Tool Configuration

### Core Tool Structure

```typescript
interface Tool {
  id: string;                    // Unique identifier (e.g., "heic-to-jpg")
  name: string;                  // Display name (e.g., "HEIC to JPG")
  description: string;           // Short description for listings
  operation: OperationType;      // Tool type: 'convert' | 'compress' | 'combine' | 'download'
  route: string;                 // URL path (e.g., "/tools/heic-to-jpg")
  from?: string;                 // Source format (e.g., "heic")
  to?: string;                   // Target format (e.g., "jpg")
  isActive: boolean;             // Whether tool is enabled
  tags?: string[];               // Keywords for search and categorization
  priority?: number;             // Display order (higher = first, 1-10 scale)
  isBeta?: boolean;              // Mark as beta feature
  isNew?: boolean;               // Mark as new tool
  content?: ToolContent;         // Rich landing page content
}
```

### Operation Types

The system supports four main operation types:

```typescript
export const operationDefinitions: OperationDefinitions = {
  convert: {
    name: 'Convert',
    description: 'Transform files from one format to another',
    color: 'blue',
  },
  compress: {
    name: 'Compress', 
    description: 'Reduce file size while maintaining quality',
    color: 'green',
  },
  combine: {
    name: 'Combine',
    description: 'Merge multiple files into one',
    color: 'purple',
  },
  download: {
    name: 'Download',
    description: 'Download files from external sources',
    color: 'orange',
  },
};
```

### Media Types and Format Classification

Tools are automatically classified by media type based on their source and target formats:

```typescript
export const mediaTypeDefinitions: MediaTypeDefinitions = {
  image: {
    name: 'Image',
    pluralName: 'Images',
    description: 'Photos, graphics, and visual content',
    color: 'blue',
  },
  video: {
    name: 'Video',
    pluralName: 'Videos', 
    description: 'Movies, clips, and animated content',
    color: 'red',
  },
  audio: {
    name: 'Audio',
    pluralName: 'Audio Files',
    description: 'Music, podcasts, and sound recordings',
    color: 'green',
  },
  document: {
    name: 'Document',
    pluralName: 'Documents',
    description: 'Text documents, PDFs, and office files',
    color: 'orange',
  },
  text: {
    name: 'Text',
    pluralName: 'Text Files',
    description: 'Plain text, code, and data files',
    color: 'gray',
  },
};
```

### Rich Content Structure

Tools can include comprehensive landing page content:

```typescript
interface ToolContent {
  tool: {
    title: string;               // Page title
    subtitle: string;            // Hero subtitle
    from?: string;               // Source format for converter UI
    to?: string;                 // Target format for converter UI
    accept?: string;             // File input accept attribute
  };
  videoSection?: {
    embedId: string;             // YouTube video embed ID
  };
  faqs: FAQ[];                   // Frequently asked questions
  aboutSection: AboutFormatsSection;  // Format comparison
  changelog?: ChangelogEntry[];  // Version history
  relatedTools?: RelatedTool[];  // Related tool recommendations
  blogPosts?: BlogPost[];        // Related articles
}
```

## Tool Registry and Data Management

### Central Configuration

All tools are defined in `/data/tools.json`:

```json
[
  {
    "id": "heic-to-jpg",
    "name": "HEIC to JPG",
    "description": "Convert HEIC photos to JPG format",
    "operation": "convert",
    "route": "/tools/heic-to-jpg",
    "from": "heic",
    "to": "jpg",
    "isActive": true,
    "tags": ["heic", "jpg", "image", "photo", "apple"],
    "priority": 9,
    "content": {
      "tool": {
        "title": "HEIC to JPG",
        "subtitle": "Convert Apple HEIC images to universally compatible JPG format.",
        "from": "heic",
        "to": "jpg"
      },
      "faqs": [...],
      "aboutSection": {...}
    }
  }
]
```

### Utility Functions

The system provides several utility functions for working with tools:

```typescript
// lib/tool-utils.ts
export const tools = toolsData as Tool[];

export const getToolsByOperation = (operation: OperationType): Tool[] => {
  return tools.filter(tool => tool.operation === operation && tool.isActive);
};

export const getToolsByMediaType = (mediaType: MediaType): Tool[] => {
  return tools.filter(tool => {
    if (!tool.isActive) return false;
    const sourceType = tool.from ? formatToMediaType[tool.from.toLowerCase()] : undefined;
    const targetType = tool.to ? formatToMediaType[tool.to.toLowerCase()] : undefined;
    return sourceType === mediaType || targetType === mediaType;
  });
};

export const getActiveTools = (): Tool[] => {
  return tools.filter(tool => tool.isActive);
};

export const getToolById = (id: string): Tool | undefined => {
  return tools.find(tool => tool.id === id);
};

export const getToolByRoute = (route: string): Tool | undefined => {
  return tools.find(tool => tool.route === route);
};
```

### Content Management

Tool content is managed separately for better organization:

```typescript
// lib/tool-content.ts
export const toolContent: Record<string, ToolContent | undefined> = {};

tools.forEach(tool => {
  if (tool.content) {
    toolContent[tool.id] = tool.content;
  }
});

export function getToolContent(toolId: string): ToolContent | undefined {
  return toolContent[toolId];
}
```

## Tool Page System

### Route Structure

The application uses a structured routing system in `/app/tools/`:

```
app/tools/
├── page.tsx                    # Main tools listing page
├── (convert)/                  # Conversion tools group
│   ├── heic-to-jpg/
│   │   └── page.tsx
│   ├── mp4-to-mp3/
│   │   └── page.tsx
│   └── [format-conversions]/
├── (compress)/                 # Compression tools group
│   └── (batch)/
│       └── batch-compress-png/
│           └── page.tsx
├── character-counter/          # Utility tools
│   └── page.tsx
└── csv-combiner/
    └── page.tsx
```

### Tool Page Template System

All tool pages use the `ToolPageTemplate` component for consistency:

```typescript
// components/ToolPageTemplate.tsx
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
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section with Tool */}
      {useTwoColumnLayout && videoSection?.embedId ? (
        <LanderHeroTwoColumn
          title={tool.title}
          subtitle={tool.subtitle}
          from={tool.from}
          to={tool.to}
          videoEmbedId={videoSection.embedId}
        />
      ) : (
        <HeroConverter
          title={tool.title}
          subtitle={tool.subtitle}
          from={tool.from}
          to={tool.to}
        />
      )}
      
      {/* About Formats Section */}
      {aboutSection && (
        <AboutFormatsSection
          fromFormat={aboutSection.fromFormat}
          toFormat={aboutSection.toFormat}
        />
      )}
      
      {/* Related Tools */}
      {tool.from && tool.to && (
        <RelatedToolsSection 
          currentFrom={tool.from} 
          currentTo={tool.to}
          currentPath={`/tools/${tool.from.toLowerCase()}-to-${tool.to.toLowerCase()}`}
        />
      )}
      
      {/* Additional Sections */}
      {faqs && <FAQSection faqs={faqs} />}
      {blogPosts && <BlogSection blogPosts={blogPosts} />}
      {changelog && <ChangelogSection changelog={changelog} />}
      
      {/* Footer with all tools */}
      <ToolsLinkHub />
    </main>
  );
}
```

### Sample Tool Page Implementation

Individual tool pages follow this pattern:

```typescript
// app/tools/(convert)/mp4-to-mp3/page.tsx
"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import LanderHeroTwoColumn from "@/components/LanderHeroTwoColumn";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["mp4-to-mp3"];
  
  if (!content) {
    // Fallback for tools without rich content
    return (
      <LanderHeroTwoColumn
        title="MP4 to MP3"
        subtitle="Convert MP4 video files to MP3 format"
        from="mp4"
        to="mp3"
      />
    );
  }
  
  return (
    <ToolPageTemplate
      tool={content.tool}
      videoSection={content.videoSection}
      faqs={content.faqs}
      aboutSection={content.aboutSection}
      changelog={content.changelog}
      relatedTools={content.relatedTools}
      blogPosts={content.blogPosts}
    />
  );
}
```

## Search and Discovery System

### Main Tools Page

The main tools page (`/app/tools/page.tsx`) provides comprehensive search and filtering:

```typescript
export default function ToolsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tools, setTools] = useState(processedTools);

  // Filter tools based on category and search
  const filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.tags.some((tag: string) => tag?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-12">
        <ToolsSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>
      
      <ToolsLinkHub />
    </main>
  );
}
```

### Search Bar Component

The search bar provides real-time filtering:

```typescript
// components/ToolsSearchBar.tsx
export function ToolsSearchBar({
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
}: ToolsSearchBarProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Category Dropdown */}
        <CategoryDropdown />
        
        {/* Clear Filters Button */}
        {(searchQuery || selectedCategory !== 'all') && (
          <ClearFiltersButton />
        )}
      </div>
    </div>
  );
}
```

## Related Tools and Recommendations

### Related Tools Algorithm

The system automatically finds related tools based on shared formats:

```typescript
// components/sections/RelatedToolsSection.tsx
export function RelatedToolsSection({ currentFrom, currentTo, currentPath }: RelatedToolsSectionProps) {
  const allTools = (toolsData as any[]).filter(tool => tool.isActive);
  
  // Find tools that involve either format
  const relatedTools = allTools.filter(tool => 
    ((tool.from === currentFrom || tool.to === currentFrom || 
      tool.from === currentTo || tool.to === currentTo)) && 
    tool.route !== currentPath
  );

  // Remove duplicates
  const uniqueTools = Array.from(new Set(relatedTools.map(t => t.id)))
    .map(id => relatedTools.find(t => t.id === id))
    .filter(Boolean);

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-2xl font-bold text-center mb-8">Related Tools</h2>
        
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

### Comprehensive Tool Hub

The ToolsLinkHub provides organized access to all tools:

```typescript
// components/sections/ToolsLinkHub.tsx
const CATEGORY_MAP: Record<string, string> = {
  'heic': 'Image Formats',
  'jpg': 'Image Formats',
  'mp4': 'Video Formats',
  'mp3': 'Audio Formats',
  'pdf': 'Document Formats',
  'csv': 'Data Formats',
  // ... more format mappings
};

function generateAllTools() {
  const allTools = (toolsData as Tool[]).filter(tool => tool.isActive);
  
  // Group tools by smart categories
  const groupedTools = allTools.reduce((groups, tool) => {
    let category = 'Other Tools';
    
    // Categorize based on formats and tags
    if (tool.from && CATEGORY_MAP[tool.from]) {
      category = CATEGORY_MAP[tool.from];
    } else if (tool.to && CATEGORY_MAP[tool.to]) {
      category = CATEGORY_MAP[tool.to];
    }
    
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push({
      title: tool.name,
      href: tool.route
    });
    return groups;
  }, {} as Record<string, Array<{ title: string; href: string }>>);

  return groupedTools;
}
```

## SEO and Performance Optimization

### Sitemap Generation

Tools are automatically included in the sitemap via `next-sitemap.config.js`:

```javascript
module.exports = {
  siteUrl: 'https://serptools.github.io',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 50,
  transform: async (config, path) => {
    // Set higher priority for tool pages
    if (path.startsWith('/tools/')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      };
    }
    
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
```

### Static Generation

All active tool pages are statically generated at build time for optimal performance.

## Adding New Tools

### Step 1: Define the Tool

Add a new entry to `/data/tools.json`:

```json
{
  "id": "webp-to-avif",
  "name": "WebP to AVIF",
  "description": "Convert WebP images to AVIF format",
  "operation": "convert",
  "route": "/tools/webp-to-avif",
  "from": "webp",
  "to": "avif",
  "isActive": true,
  "tags": ["webp", "avif", "image", "next-gen"],
  "priority": 7
}
```

### Step 2: Create the Tool Page

Create `/app/tools/(convert)/webp-to-avif/page.tsx`:

```typescript
"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import LanderHeroTwoColumn from "@/components/LanderHeroTwoColumn";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["webp-to-avif"];
  
  if (!content) {
    return (
      <LanderHeroTwoColumn
        title="WebP to AVIF"
        subtitle="Convert WebP images to next-generation AVIF format"
        from="webp"
        to="avif"
      />
    );
  }
  
  return (
    <ToolPageTemplate
      tool={content.tool}
      videoSection={content.videoSection}
      faqs={content.faqs}
      aboutSection={content.aboutSection}
      relatedTools={content.relatedTools}
    />
  );
}
```

### Step 3: Add Rich Content (Optional)

Enhance the tool definition with rich content:

```json
{
  "id": "webp-to-avif",
  "name": "WebP to AVIF",
  "description": "Convert WebP images to AVIF format",
  "operation": "convert",
  "route": "/tools/webp-to-avif",
  "from": "webp",
  "to": "avif",
  "isActive": true,
  "tags": ["webp", "avif", "image", "next-gen"],
  "priority": 7,
  "content": {
    "tool": {
      "title": "WebP to AVIF",
      "subtitle": "Convert WebP images to next-generation AVIF format for better compression",
      "from": "webp",
      "to": "avif"
    },
    "faqs": [
      {
        "question": "What is AVIF format?",
        "answer": "AVIF is a modern image format that provides better compression than WebP while maintaining high quality."
      }
    ],
    "aboutSection": {
      "fromFormat": {
        "name": "WebP",
        "fullName": "Web Picture Format",
        "description": "Google's modern image format with excellent compression",
        "details": [
          "Smaller than JPEG and PNG",
          "Supports transparency",
          "Wide browser support"
        ]
      },
      "toFormat": {
        "name": "AVIF",
        "fullName": "AV1 Image File Format", 
        "description": "Next-generation image format with superior compression",
        "details": [
          "50% smaller than JPEG",
          "Better quality than WebP",
          "Growing browser support"
        ]
      }
    }
  }
}
```

### Step 4: Update Icon Mapping

Add icon mapping in `/app/tools/page.tsx`:

```typescript
const iconMap: { [key: string]: any } = {
  // ... existing mappings
  'webp-to-avif': Image,
};
```

## Tool System Configuration

### Environment Configuration

The system supports different configurations based on environment:

```typescript
export const TOOL_CONFIG = {
  // Maximum tools to display per page
  pageSize: 20,
  
  // Default priority for new tools
  defaultPriority: 5,
  
  // Cache duration for tool data
  cacheDuration: 3600000, // 1 hour
  
  // Enable experimental tools
  showExperimental: process.env.NODE_ENV === 'development',
  
  // Tool categories
  categories: ['image', 'video', 'audio', 'document', 'utility']
};
```

### Format Classification

The system automatically classifies formats into media types:

```typescript
export const formatToMediaType: Record<string, MediaType> = {
  // Image formats
  'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
  'webp': 'image', 'svg': 'image', 'ico': 'image', 'bmp': 'image',
  'heic': 'image', 'heif': 'image', 'avif': 'image', 'ai': 'image',
  
  // Video formats  
  'mp4': 'video', 'avi': 'video', 'mov': 'video', 'mkv': 'video',
  'webm': 'video', 'flv': 'video', 'm4v': 'video', 'wmv': 'video',
  
  // Audio formats
  'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio',
  'm4a': 'audio', 'ogg': 'audio', 'wma': 'audio', 'opus': 'audio',
  
  // Document formats
  'pdf': 'document', 'doc': 'document', 'docx': 'document',
  
  // Text formats
  'txt': 'text', 'csv': 'text', 'json': 'text', 'xml': 'text',
  // ... comprehensive format mapping
};
```

## Current Tool Inventory

The system currently supports:

### Image Converters (50+ tools)
- **HEIC/HEIF Converters**: HEIC to JPG/PNG/PDF, HEIF to JPG/PNG/PDF
- **Common Format Converters**: JPG ↔ PNG, WebP ↔ JPG/PNG, PDF ↔ JPG/PNG
- **Specialized Formats**: AI to PNG/SVG, BMP to JPG/PNG, ICO to PNG/JPG
- **Raw Image Formats**: CR2/CR3/DNG/ARW to JPG

### Video Converters (30+ tools)  
- **MP4 Converters**: MP4 to 30+ formats (MKV, AVI, MOV, WebM, FLV, etc.)
- **MKV Converters**: MKV to MP4/WebM/AVI/MOV/GIF and audio extraction
- **Video to Audio**: MP4/MKV to MP3/WAV/OGG/AAC/FLAC

### Utility Tools
- **Character Counter**: Text analysis tool
- **CSV Combiner**: Merge CSV files
- **JSON to CSV**: Data format conversion
- **Batch Operations**: Batch PNG compression

### Compression Tools
- **Image Compression**: PNG optimization with batch processing

## Best Practices

### 1. Tool Naming Conventions
- Use lowercase format names in IDs: `heic-to-jpg`
- Use proper format names in display: `HEIC to JPG`
- Be specific about formats: `jpeg` vs `jpg`, `mpeg` vs `mpg`

### 2. Content Organization
- Keep tool definitions lean in JSON
- Use rich content sparingly for high-priority tools
- Ensure all active tools have basic metadata

### 3. SEO Optimization
- Include relevant keywords in tags array
- Write descriptive tool descriptions
- Set appropriate priority levels (1-10 scale)

### 4. Performance Considerations
- Mark development tools with `isActive: false`
- Use appropriate priority levels to control visibility
- Implement lazy loading for heavy content sections

### 5. User Experience
- Provide fallback layouts for tools without rich content
- Use consistent naming and descriptions
- Include relevant tags for better search results

### 6. Maintenance
- Regularly audit tool data for accuracy
- Update priorities based on usage analytics
- Keep format mappings up to date

## Type Definitions Reference

Key TypeScript interfaces used throughout the system:

```typescript
// Core types
export type OperationType = 'convert' | 'compress' | 'combine' | 'download';
export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'text';

// Content structure types
export interface FAQ {
  question: string;
  answer: string;
}

export interface FormatInfo {
  name: string;
  fullName: string;
  description: string;
  details?: string[];
}

export interface AboutFormatsSection {
  title?: string;
  fromFormat: FormatInfo;
  toFormat: FormatInfo;
}

export interface ChangelogEntry {
  date: string;
  changes: string[];
}

export interface RelatedTool {
  href: string;
  title: string;
  description: string;
}

export interface BlogPost {
  title: string;
  subtitle?: string;
  description?: string;
  href: string;
  category?: string;
}
```

## See Also

- [Tool Page Pattern](../patterns/tool-page-pattern.md) - Page implementation patterns
- [Add New Converter](../recipes/add-new-converter.md) - Step-by-step tool creation
- [Component Pattern](../patterns/component-pattern.md) - UI component architecture
- [Conversion System](./conversion-system.md) - File processing implementation
- [File Inventory](../file-inventory.md) - Complete file structure reference