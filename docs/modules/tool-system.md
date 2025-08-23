# Tool System

Tool registration, routing, and content management through centralized configuration.

## Overview

The tool system manages all converter and utility tools through a centralized `tools.json` configuration. It handles routing, content display, categorization, and tool discovery.

## Tool Configuration

### Tool Structure

```typescript
interface Tool {
  id: string;                    // Unique identifier
  name: string;                   // Display name
  route: string;                  // URL path
  from?: string;                  // Source format
  to?: string;                    // Target format
  priority?: number;              // Display order (higher = first)
  tags?: string[];                // Categories and labels
  category?: string;              // Primary category
  description?: string;           // Short description
  content?: ToolContent;          // Rich content
  hidden?: boolean;               // Hide from listings
  experimental?: boolean;         // Mark as experimental
}
```

### Content Structure

```typescript
interface ToolContent {
  tool: {
    title: string;
    subtitle: string;
    from?: string;
    to?: string;
  };
  videoSection?: {
    embedId: string;
    title?: string;
    description?: string;
  };
  faqs?: FAQ[];
  aboutSection?: AboutSection;
  blogPosts?: BlogPost[];
  relatedTools?: RelatedTool[];
  changelog?: ChangelogEntry[];
  features?: Feature[];
  useCases?: UseCase[];
}
```

## Tool Registry

### Loading Tools

```typescript
// lib/tool-utils.ts
import toolsData from '@/data/tools.json';

const toolRegistry = new Map<string, Tool>();
const toolsByRoute = new Map<string, Tool>();
const toolsByCategory = new Map<string, Tool[]>();

// Initialize registry
toolsData.forEach(tool => {
  toolRegistry.set(tool.id, tool);
  toolsByRoute.set(tool.route, tool);
  
  // Index by category
  if (tool.category) {
    const categoryTools = toolsByCategory.get(tool.category) || [];
    categoryTools.push(tool);
    toolsByCategory.set(tool.category, categoryTools);
  }
  
  // Index by tags
  tool.tags?.forEach(tag => {
    const tagTools = toolsByCategory.get(tag) || [];
    tagTools.push(tool);
    toolsByCategory.set(tag, tagTools);
  });
});

export function getTool(id: string): Tool | undefined {
  return toolRegistry.get(id);
}

export function getToolByRoute(route: string): Tool | undefined {
  return toolsByRoute.get(route);
}

export function getAllTools(): Tool[] {
  return Array.from(toolRegistry.values());
}
```

### Tool Discovery

```typescript
export function searchTools(query: string): Tool[] {
  const normalizedQuery = query.toLowerCase();
  
  return getAllTools().filter(tool => {
    // Search in name
    if (tool.name.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Search in formats
    if (tool.from?.includes(normalizedQuery) || 
        tool.to?.includes(normalizedQuery)) {
      return true;
    }
    
    // Search in tags
    if (tool.tags?.some(tag => 
        tag.toLowerCase().includes(normalizedQuery))) {
      return true;
    }
    
    // Search in description
    if (tool.description?.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    return false;
  });
}
```

## Categories

### Category Definitions

```typescript
// data/categories.json
export const categories = {
  "image": {
    "name": "Image Converters",
    "description": "Convert between image formats",
    "icon": "🖼️",
    "priority": 10
  },
  "video": {
    "name": "Video Converters",
    "description": "Convert video and extract audio",
    "icon": "🎬",
    "priority": 9
  },
  "audio": {
    "name": "Audio Converters",
    "description": "Convert between audio formats",
    "icon": "🎵",
    "priority": 8
  },
  "document": {
    "name": "Document Tools",
    "description": "PDF and document processing",
    "icon": "📄",
    "priority": 7
  },
  "utility": {
    "name": "Utility Tools",
    "description": "File utilities and helpers",
    "icon": "🛠️",
    "priority": 6
  }
};
```

### Category Management

```typescript
export function getToolsByCategory(category: string): Tool[] {
  const tools = toolsByCategory.get(category) || [];
  
  // Sort by priority
  return tools.sort((a, b) => {
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;
    return priorityB - priorityA;
  });
}

export function getCategoryInfo(category: string): CategoryInfo {
  return categories[category] || {
    name: category,
    description: '',
    icon: '📁'
  };
}

export function getAllCategories(): string[] {
  return Object.keys(categories).sort((a, b) => {
    const priorityA = categories[a].priority || 0;
    const priorityB = categories[b].priority || 0;
    return priorityB - priorityA;
  });
}
```

## Routing System

### Dynamic Routes

```typescript
// app/tools/(convert)/[from]-to-[to]/page.tsx
export async function generateStaticParams() {
  const tools = getAllTools();
  
  return tools
    .filter(tool => tool.route.includes('-to-'))
    .map(tool => {
      const match = tool.route.match(/\/([^\/]+)-to-([^\/]+)$/);
      if (match) {
        return {
          from: match[1],
          to: match[2]
        };
      }
      return null;
    })
    .filter(Boolean);
}

export default function DynamicToolPage({
  params
}: {
  params: { from: string; to: string }
}) {
  const toolId = `${params.from}-to-${params.to}`;
  const tool = getTool(toolId);
  
  if (!tool) {
    notFound();
  }
  
  return <ToolPageComponent tool={tool} />;
}
```

### Route Patterns

```typescript
export const routePatterns = {
  converter: /^\/tools\/([^\/]+)-to-([^\/]+)$/,
  batch: /^\/tools\/batch-([^\/]+)$/,
  utility: /^\/tools\/([^\/]+)$/
};

export function parseRoute(route: string): RouteInfo {
  // Check converter pattern
  const converterMatch = route.match(routePatterns.converter);
  if (converterMatch) {
    return {
      type: 'converter',
      from: converterMatch[1],
      to: converterMatch[2]
    };
  }
  
  // Check batch pattern
  const batchMatch = route.match(routePatterns.batch);
  if (batchMatch) {
    return {
      type: 'batch',
      tool: batchMatch[1]
    };
  }
  
  // Default to utility
  return {
    type: 'utility',
    tool: route.split('/').pop()
  };
}
```

## Tool Content Management

### Content Loading

```typescript
// lib/tool-content.ts
export const toolContent: Map<string, ToolContent> = new Map();

// Load content from tools.json
toolsData.forEach(tool => {
  if (tool.content) {
    toolContent.set(tool.id, tool.content);
  }
});

export function getToolContent(toolId: string): ToolContent | undefined {
  return toolContent.get(toolId);
}

export function hasContent(toolId: string): boolean {
  return toolContent.has(toolId);
}
```

### Content Validation

```typescript
export function validateToolContent(content: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!content.tool?.title) {
    errors.push('Tool title is required');
  }
  
  // FAQ validation
  if (content.faqs) {
    content.faqs.forEach((faq: any, index: number) => {
      if (!faq.question) {
        errors.push(`FAQ ${index + 1}: question is required`);
      }
      if (!faq.answer) {
        errors.push(`FAQ ${index + 1}: answer is required`);
      }
    });
  }
  
  // Video validation
  if (content.videoSection && !content.videoSection.embedId) {
    warnings.push('Video section missing embedId');
  }
  
  // Format comparison validation
  if (content.aboutSection) {
    if (!content.aboutSection.fromFormat && !content.aboutSection.toFormat) {
      warnings.push('About section missing format information');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

## Tool Generation

### Metadata Generation

```typescript
export function generateToolMetadata(tool: Tool): Metadata {
  const title = tool.content?.tool.title || 
    `${tool.from?.toUpperCase()} to ${tool.to?.toUpperCase()} Converter`;
  
  const description = tool.content?.tool.subtitle || 
    tool.description ||
    `Convert ${tool.from} files to ${tool.to} format online`;
  
  return {
    title: `${title} | SerpTools`,
    description,
    keywords: [
      tool.from && `${tool.from} to ${tool.to}`,
      tool.from && `${tool.from} converter`,
      tool.to && `${tool.to} converter`,
      ...tool.tags || []
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://serptools.com${tool.route}`
    }
  };
}
```

### Sitemap Generation

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tools = getAllTools();
  
  const toolUrls = tools
    .filter(tool => !tool.hidden)
    .map(tool => ({
      url: `https://serptools.com${tool.route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: tool.priority ? tool.priority / 10 : 0.5
    }));
  
  return [
    {
      url: 'https://serptools.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1
    },
    ...toolUrls
  ];
}
```

## Tool Relationships

### Related Tools

```typescript
export function findRelatedTools(tool: Tool, limit = 5): Tool[] {
  const related: Map<string, number> = new Map();
  
  // Same category tools
  if (tool.category) {
    getToolsByCategory(tool.category).forEach(t => {
      if (t.id !== tool.id) {
        related.set(t.id, (related.get(t.id) || 0) + 3);
      }
    });
  }
  
  // Same format tools
  getAllTools().forEach(t => {
    if (t.id === tool.id) return;
    
    // Same source format
    if (t.from === tool.from) {
      related.set(t.id, (related.get(t.id) || 0) + 2);
    }
    
    // Same target format
    if (t.to === tool.to) {
      related.set(t.id, (related.get(t.id) || 0) + 2);
    }
    
    // Reverse converter
    if (t.from === tool.to && t.to === tool.from) {
      related.set(t.id, (related.get(t.id) || 0) + 5);
    }
  });
  
  // Sort by relevance
  const sorted = Array.from(related.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  
  return sorted
    .map(([id]) => getTool(id))
    .filter(Boolean) as Tool[];
}
```

### Tool Chains

```typescript
export function findConversionPath(
  from: string,
  to: string
): Tool[] | null {
  // Direct conversion
  const direct = getTool(`${from}-to-${to}`);
  if (direct) return [direct];
  
  // Find intermediate format
  const fromTools = getAllTools().filter(t => t.from === from);
  const toTools = getAllTools().filter(t => t.to === to);
  
  for (const fromTool of fromTools) {
    for (const toTool of toTools) {
      if (fromTool.to === toTool.from) {
        return [fromTool, toTool];
      }
    }
  }
  
  return null;
}
```

## Tool Statistics

### Usage Tracking

```typescript
export function trackToolUsage(toolId: string, event: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, {
      tool_id: toolId,
      tool_name: getTool(toolId)?.name,
      category: getTool(toolId)?.category
    });
  }
}

export function getPopularTools(limit = 10): Tool[] {
  // In real implementation, this would query analytics
  return getAllTools()
    .filter(tool => tool.priority && tool.priority > 5)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, limit);
}
```

### Performance Metrics

```typescript
interface ToolMetrics {
  toolId: string;
  loadTime: number;
  conversionTime?: number;
  fileSize?: number;
  success: boolean;
  error?: string;
}

export function reportToolMetrics(metrics: ToolMetrics) {
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', 'tool_performance', {
      ...metrics,
      custom_map: {
        metric1: 'loadTime',
        metric2: 'conversionTime',
        metric3: 'fileSize'
      }
    });
  }
  
  // Log for debugging
  console.debug('Tool metrics:', metrics);
}
```

## Tool Filtering

### Capability-Based Filtering

```typescript
export function getAvailableTools(capabilities: Capabilities): Tool[] {
  return getAllTools().filter(tool => {
    // Check if tool requires video support
    if (requiresVideoConversion(tool.from, tool.to)) {
      return capabilities.supportsVideoConversion;
    }
    
    return true;
  });
}
```

### Search and Filter

```typescript
interface ToolFilter {
  category?: string;
  tags?: string[];
  formats?: string[];
  search?: string;
  capabilities?: Capabilities;
}

export function filterTools(filter: ToolFilter): Tool[] {
  let tools = getAllTools();
  
  // Filter by category
  if (filter.category) {
    tools = tools.filter(t => t.category === filter.category);
  }
  
  // Filter by tags
  if (filter.tags?.length) {
    tools = tools.filter(t => 
      filter.tags!.some(tag => t.tags?.includes(tag))
    );
  }
  
  // Filter by formats
  if (filter.formats?.length) {
    tools = tools.filter(t =>
      filter.formats!.includes(t.from!) || 
      filter.formats!.includes(t.to!)
    );
  }
  
  // Filter by search
  if (filter.search) {
    tools = searchTools(filter.search);
  }
  
  // Filter by capabilities
  if (filter.capabilities) {
    tools = tools.filter(t =>
      isToolAvailable(t, filter.capabilities!)
    );
  }
  
  return tools;
}
```

## Configuration Management

### Tool Configuration

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

### Dynamic Configuration

```typescript
export function getToolConfig(toolId: string): ToolConfig {
  const tool = getTool(toolId);
  if (!tool) throw new Error(`Tool not found: ${toolId}`);
  
  return {
    ...TOOL_CONFIG,
    // Tool-specific overrides
    maxFileSize: getMaxFileSize(tool),
    supportedFormats: getSupportedFormats(tool),
    requiresAuth: false,
    rateLimit: getRateLimit(tool)
  };
}
```

## Best Practices

1. **Centralized Configuration**: Keep all tool data in tools.json
2. **Validation**: Validate tool content on load
3. **Lazy Loading**: Load tool content on demand
4. **Caching**: Cache tool data for performance
5. **Categorization**: Use consistent categories and tags
6. **Prioritization**: Set priorities for important tools
7. **Documentation**: Document tool configurations

## See Also

- [Tool Page Pattern](../patterns/tool-page-pattern.md) - Page implementation
- [Add New Converter](../recipes/add-new-converter.md) - Adding tools
- [Add Tool Content](../recipes/add-tool-content.md) - Content management
- [File Inventory](../file-inventory.md) - File structure