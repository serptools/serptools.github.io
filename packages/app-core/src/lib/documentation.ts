/**
 * Documentation Generation System
 * 
 * Automatically generates documentation for tools, APIs,
 * and system architecture.
 */

import fs from 'fs/promises';
import path from 'path';
import { Tool } from './tool-generator';
import { ToolRegistryManager } from './tool-registry';

export interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  subsections?: DocumentationSection[];
  metadata?: {
    lastUpdated: Date;
    author?: string;
    version?: string;
  };
}

export interface APIDocumentation {
  endpoint: string;
  method: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  responses?: Array<{
    status: number;
    description: string;
    example?: any;
  }>;
  examples?: Array<{
    title: string;
    request: any;
    response: any;
  }>;
}

export class DocumentationGenerator {
  private registryManager: ToolRegistryManager;
  private outputDir: string;

  constructor(registryManager: ToolRegistryManager, outputDir: string) {
    this.registryManager = registryManager;
    this.outputDir = outputDir;
  }

  /**
   * Generate complete documentation
   */
  async generateAllDocumentation(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });

    // Generate different types of documentation
    await this.generateToolsDocumentation();
    await this.generateAPIDocumentation();
    await this.generateArchitectureDocumentation();
    await this.generateDeveloperGuide();
    await this.generateUserGuide();
    await this.generateIndexPage();

    console.log(`Documentation generated in: ${this.outputDir}`);
  }

  /**
   * Generate tools documentation
   */
  async generateToolsDocumentation(): Promise<void> {
    const tools = await this.registryManager.getAllTools();
    const activeTools = tools.filter(t => t.isActive);

    const toolsDir = path.join(this.outputDir, 'tools');
    await fs.mkdir(toolsDir, { recursive: true });

    // Generate individual tool pages
    for (const tool of activeTools) {
      await this.generateToolPage(tool, toolsDir);
    }

    // Generate tools index
    await this.generateToolsIndex(activeTools, toolsDir);

    console.log(`Generated documentation for ${activeTools.length} tools`);
  }

  /**
   * Generate individual tool page
   */
  async generateToolPage(tool: Tool, outputDir: string): Promise<void> {
    const content = this.generateToolMarkdown(tool);
    const filename = `${tool.id}.md`;
    await fs.writeFile(path.join(outputDir, filename), content);
  }

  /**
   * Generate tool markdown content
   */
  private generateToolMarkdown(tool: Tool): string {
    let md = `# ${tool.name}\n\n`;
    md += `${tool.description}\n\n`;

    // Metadata
    md += `## Tool Information\n\n`;
    md += `- **ID**: \`${tool.id}\`\n`;
    md += `- **Operation**: ${tool.operation}\n`;
    md += `- **Route**: ${tool.route}\n`;
    if (tool.from && tool.to) {
      md += `- **Conversion**: ${tool.from.toUpperCase()} → ${tool.to.toUpperCase()}\n`;
    }
    md += `- **Status**: ${tool.isActive ? '🟢 Active' : '🔴 Inactive'}\n`;
    if (tool.isBeta) {
      md += `- **Beta**: Yes\n`;
    }
    if (tool.requiresFFmpeg) {
      md += `- **Requires FFmpeg**: Yes\n`;
    }
    md += `\n`;

    // Tags
    if (tool.tags && tool.tags.length > 0) {
      md += `## Tags\n\n`;
      md += tool.tags.map(tag => `\`${tag}\``).join(', ') + '\n\n';
    }

    // Content sections
    if (tool.content) {
      if (tool.content.faqs && tool.content.faqs.length > 0) {
        md += `## Frequently Asked Questions\n\n`;
        tool.content.faqs.forEach((faq: any) => {
          md += `### ${faq.question}\n\n`;
          md += `${faq.answer}\n\n`;
        });
      }

      if (tool.content.aboutSection) {
        md += `## About the Formats\n\n`;
        md += `### ${tool.content.aboutSection.fromFormat.name}\n\n`;
        md += `${tool.content.aboutSection.fromFormat.description}\n\n`;
        if (tool.content.aboutSection.fromFormat.details) {
          md += `**Features:**\n`;
          tool.content.aboutSection.fromFormat.details.forEach((detail: string) => {
            md += `- ${detail}\n`;
          });
          md += `\n`;
        }

        md += `### ${tool.content.aboutSection.toFormat.name}\n\n`;
        md += `${tool.content.aboutSection.toFormat.description}\n\n`;
        if (tool.content.aboutSection.toFormat.details) {
          md += `**Features:**\n`;
          tool.content.aboutSection.toFormat.details.forEach((detail: string) => {
            md += `- ${detail}\n`;
          });
          md += `\n`;
        }
      }

      if (tool.content.relatedTools && tool.content.relatedTools.length > 0) {
        md += `## Related Tools\n\n`;
        tool.content.relatedTools.forEach((related: any) => {
          md += `- [${related.title}](${related.href}): ${related.description}\n`;
        });
        md += `\n`;
      }
    }

    // Usage section
    md += `## Usage\n\n`;
    md += `1. Visit [${tool.route}](${tool.route})\n`;
    md += `2. Upload your ${tool.from?.toUpperCase()} file\n`;
    md += `3. Click convert to download your ${tool.to?.toUpperCase()} file\n\n`;

    // Technical details
    md += `## Technical Details\n\n`;
    md += `This tool processes files locally in your browser for privacy and security.\n`;
    if (tool.requiresFFmpeg) {
      md += `Note: This tool requires FFmpeg for processing and is only available in desktop versions.\n`;
    }
    md += `\n`;

    return md;
  }

  /**
   * Generate tools index page
   */
  async generateToolsIndex(tools: Tool[], outputDir: string): Promise<void> {
    let md = `# Tools Documentation\n\n`;
    md += `This section contains documentation for all available conversion tools.\n\n`;

    // Group tools by category
    const toolsByCategory: Record<string, Tool[]> = {};
    for (const tool of tools) {
      const category = this.getToolCategory(tool);
      if (!toolsByCategory[category]) {
        toolsByCategory[category] = [];
      }
      toolsByCategory[category].push(tool);
    }

    // Generate index
    md += `## Categories\n\n`;
    for (const [category, categoryTools] of Object.entries(toolsByCategory)) {
      md += `### ${category}\n\n`;
      for (const tool of categoryTools.sort((a, b) => a.name.localeCompare(b.name))) {
        const status = tool.isActive ? '🟢' : '🔴';
        const beta = tool.isBeta ? ' 🧪' : '';
        md += `- ${status} [${tool.name}](./tools/${tool.id}.md)${beta} - ${tool.description}\n`;
      }
      md += `\n`;
    }

    // Statistics
    md += `## Statistics\n\n`;
    md += `- Total tools: ${tools.length}\n`;
    md += `- Active tools: ${tools.filter(t => t.isActive).length}\n`;
    md += `- Categories: ${Object.keys(toolsByCategory).length}\n`;
    md += `- Operations: ${new Set(tools.map(t => t.operation)).size}\n\n`;

    await fs.writeFile(path.join(outputDir, 'index.md'), md);
  }

  /**
   * Generate API documentation
   */
  async generateAPIDocumentation(): Promise<void> {
    const apiDir = path.join(this.outputDir, 'api');
    await fs.mkdir(apiDir, { recursive: true });

    // Define API endpoints
    const endpoints: APIDocumentation[] = [
      {
        endpoint: '/api/tools',
        method: 'GET',
        description: 'Get list of all available tools',
        parameters: [
          {
            name: 'category',
            type: 'string',
            required: false,
            description: 'Filter tools by category'
          },
          {
            name: 'active',
            type: 'boolean',
            required: false,
            description: 'Filter by active status'
          }
        ],
        responses: [
          {
            status: 200,
            description: 'Success',
            example: {
              tools: [
                {
                  id: 'heic-to-jpg',
                  name: 'HEIC to JPG',
                  description: 'Convert HEIC photos to JPG format'
                }
              ]
            }
          }
        ]
      },
      {
        endpoint: '/api/tools/{toolId}',
        method: 'GET',
        description: 'Get specific tool information',
        parameters: [
          {
            name: 'toolId',
            type: 'string',
            required: true,
            description: 'The unique tool identifier'
          }
        ],
        responses: [
          {
            status: 200,
            description: 'Success',
            example: {
              id: 'heic-to-jpg',
              name: 'HEIC to JPG',
              description: 'Convert HEIC photos to JPG format',
              operation: 'convert',
              from: 'heic',
              to: 'jpg'
            }
          },
          {
            status: 404,
            description: 'Tool not found'
          }
        ]
      },
      {
        endpoint: '/api/convert',
        method: 'POST',
        description: 'Convert a file using specified tool',
        parameters: [
          {
            name: 'toolId',
            type: 'string',
            required: true,
            description: 'The tool to use for conversion'
          },
          {
            name: 'file',
            type: 'file',
            required: true,
            description: 'The file to convert'
          },
          {
            name: 'options',
            type: 'object',
            required: false,
            description: 'Conversion options (quality, compression, etc.)'
          }
        ],
        responses: [
          {
            status: 200,
            description: 'Conversion successful',
            example: {
              success: true,
              filename: 'converted-file.jpg',
              size: 1024768
            }
          },
          {
            status: 400,
            description: 'Invalid input'
          },
          {
            status: 500,
            description: 'Conversion failed'
          }
        ]
      }
    ];

    // Generate API documentation
    let apiMd = `# API Documentation\n\n`;
    apiMd += `This section documents the REST API endpoints available in SerpTools.\n\n`;

    for (const endpoint of endpoints) {
      apiMd += `## ${endpoint.method} ${endpoint.endpoint}\n\n`;
      apiMd += `${endpoint.description}\n\n`;

      if (endpoint.parameters) {
        apiMd += `### Parameters\n\n`;
        apiMd += `| Name | Type | Required | Description |\n`;
        apiMd += `|------|------|----------|-------------|\n`;
        endpoint.parameters.forEach(param => {
          apiMd += `| ${param.name} | ${param.type} | ${param.required ? 'Yes' : 'No'} | ${param.description} |\n`;
        });
        apiMd += `\n`;
      }

      if (endpoint.responses) {
        apiMd += `### Responses\n\n`;
        endpoint.responses.forEach(response => {
          apiMd += `**${response.status}**: ${response.description}\n\n`;
          if (response.example) {
            apiMd += `\`\`\`json\n${JSON.stringify(response.example, null, 2)}\n\`\`\`\n\n`;
          }
        });
      }

      apiMd += `---\n\n`;
    }

    await fs.writeFile(path.join(apiDir, 'index.md'), apiMd);
  }

  /**
   * Generate architecture documentation
   */
  async generateArchitectureDocumentation(): Promise<void> {
    const archDir = path.join(this.outputDir, 'architecture');
    await fs.mkdir(archDir, { recursive: true });

    let md = `# Architecture Documentation\n\n`;
    md += `This document describes the overall architecture of the SerpTools system.\n\n`;

    md += `## Overview\n\n`;
    md += `SerpTools is built as a scalable monorepo with the following key components:\n\n`;
    md += `- **Tool Generation System**: Automatically generates tool pages from configurations\n`;
    md += `- **Plugin Architecture**: Modular system for extending functionality\n`;
    md += `- **Registry System**: Central management of tool metadata and dependencies\n`;
    md += `- **Validation Framework**: Automated testing and quality assurance\n`;
    md += `- **Analytics System**: Usage tracking and performance monitoring\n`;
    md += `- **Shared Business Logic**: Common functionality for web and desktop versions\n\n`;

    md += `## Directory Structure\n\n`;
    md += `\`\`\`\n`;
    md += `serptools/\n`;
    md += `├── apps/                    # Application packages\n`;
    md += `│   ├── tools/              # Tools web application\n`;
    md += `│   ├── files/              # File types application\n`;
    md += `│   └── extensions/         # Extensions application\n`;
    md += `├── packages/               # Shared packages\n`;
    md += `│   ├── app-core/          # Core functionality and data\n`;
    md += `│   ├── ui/                # UI components\n`;
    md += `│   ├── eslint-config/     # ESLint configuration\n`;
    md += `│   └── typescript-config/ # TypeScript configuration\n`;
    md += `└── tools/                  # Development tools\n`;
    md += `\`\`\`\n\n`;

    md += `## Key Systems\n\n`;

    md += `### Tool Generation System\n\n`;
    md += `Located in \`packages/app-core/src/lib/tool-generator.ts\`, this system:\n`;
    md += `- Automatically generates React pages for tools based on JSON configuration\n`;
    md += `- Validates tool configurations and routes\n`;
    md += `- Provides statistics and insights about the tool ecosystem\n\n`;

    md += `### Plugin Architecture\n\n`;
    md += `The plugin system (\`packages/app-core/src/lib/plugin-system.ts\`) enables:\n`;
    md += `- Modular extension of functionality\n`;
    md += `- Different converter implementations for different formats\n`;
    md += `- Hook system for intercepting and modifying operations\n`;
    md += `- Dependency management between plugins\n\n`;

    md += `### Registry Management\n\n`;
    md += `The registry system (\`packages/app-core/src/lib/tool-registry.ts\`) provides:\n`;
    md += `- Centralized tool metadata storage\n`;
    md += `- Dependency tracking between tools\n`;
    md += `- Usage metrics and analytics\n`;
    md += `- Search and categorization capabilities\n\n`;

    md += `### Data Flow\n\n`;
    md += `1. Tool configurations are stored in \`packages/app-core/src/data/tools.json\`\n`;
    md += `2. The tool generator creates React pages based on these configurations\n`;
    md += `3. The registry manager tracks tool relationships and metrics\n`;
    md += `4. Plugins handle the actual file processing\n`;
    md += `5. Analytics system tracks usage and performance\n\n`;

    md += `## Scalability Considerations\n\n`;
    md += `The architecture is designed to handle thousands of tools efficiently:\n\n`;
    md += `- **Lazy Loading**: Tools are loaded on demand\n`;
    md += `- **Caching**: Aggressive caching of generated content and metrics\n`;
    md += `- **Modular Plugins**: New functionality can be added without affecting existing tools\n`;
    md += `- **Batch Operations**: Support for processing multiple files simultaneously\n`;
    md += `- **Performance Monitoring**: Real-time tracking of system performance\n\n`;

    await fs.writeFile(path.join(archDir, 'index.md'), md);
  }

  /**
   * Generate developer guide
   */
  async generateDeveloperGuide(): Promise<void> {
    let md = `# Developer Guide\n\n`;
    md += `This guide explains how to develop and extend SerpTools.\n\n`;

    md += `## Getting Started\n\n`;
    md += `### Prerequisites\n\n`;
    md += `- Node.js 20+\n`;
    md += `- pnpm (latest)\n\n`;

    md += `### Installation\n\n`;
    md += `\`\`\`bash\n`;
    md += `# Clone the repository\n`;
    md += `git clone https://github.com/serptools/serptools.github.io.git\n`;
    md += `cd serptools.github.io\n\n`;
    md += `# Install dependencies\n`;
    md += `pnpm install\n\n`;
    md += `# Start development server\n`;
    md += `pnpm dev\n`;
    md += `\`\`\`\n\n`;

    md += `## CLI Usage\n\n`;
    md += `The SerpTools CLI provides commands for managing tools:\n\n`;
    md += `\`\`\`bash\n`;
    md += `# Generate all tool pages\n`;
    md += `pnpm serptools generate\n\n`;
    md += `# Create a new tool interactively\n`;
    md += `pnpm serptools create\n\n`;
    md += `# Validate tool configurations\n`;
    md += `pnpm serptools validate\n\n`;
    md += `# Show statistics\n`;
    md += `pnpm serptools stats\n\n`;
    md += `# Search for tools\n`;
    md += `pnpm serptools search "image"\n`;
    md += `\`\`\`\n\n`;

    md += `## Adding New Tools\n\n`;
    md += `### Method 1: Using the CLI\n\n`;
    md += `\`\`\`bash\n`;
    md += `pnpm serptools create\n`;
    md += `\`\`\`\n\n`;
    md += `This will interactively prompt you for tool details and automatically generate the necessary files.\n\n`;

    md += `### Method 2: Manual Configuration\n\n`;
    md += `1. Add tool configuration to \`packages/app-core/src/data/tools.json\`\n`;
    md += `2. Run \`pnpm serptools generate\` to create the page\n`;
    md += `3. Test the new tool\n\n`;

    md += `### Tool Configuration Schema\n\n`;
    md += `\`\`\`typescript\n`;
    md += `interface Tool {\n`;
    md += `  id: string;                    // Unique identifier\n`;
    md += `  name: string;                  // Display name\n`;
    md += `  description: string;           // Brief description\n`;
    md += `  operation: string;             // Type of operation\n`;
    md += `  route: string;                 // URL route\n`;
    md += `  from?: string;                 // Input format\n`;
    md += `  to?: string;                   // Output format\n`;
    md += `  isActive: boolean;             // Whether tool is active\n`;
    md += `  tags?: string[];               // Search tags\n`;
    md += `  priority?: number;             // Display priority\n`;
    md += `  isBeta?: boolean;              // Beta status\n`;
    md += `  requiresFFmpeg?: boolean;      // FFmpeg requirement\n`;
    md += `  content?: ToolContent;         // Landing page content\n`;
    md += `}\n`;
    md += `\`\`\`\n\n`;

    md += `## Creating Plugins\n\n`;
    md += `Plugins extend the functionality of tools:\n\n`;
    md += `\`\`\`typescript\n`;
    md += `import { BasePlugin, PluginContext } from '@serp-tools/app-core/lib/plugin-system';\n\n`;
    md += `export class MyConverterPlugin extends BasePlugin {\n`;
    md += `  async initialize(context: PluginContext): Promise<void> {\n`;
    md += `    // Setup plugin\n`;
    md += `  }\n\n`;
    md += `  async execute(input: File, options?: any): Promise<Blob> {\n`;
    md += `    // Convert file\n`;
    md += `    return new Blob([converted]);\n`;
    md += `  }\n`;
    md += `}\n`;
    md += `\`\`\`\n\n`;

    md += `## Testing\n\n`;
    md += `Run validation and tests:\n\n`;
    md += `\`\`\`bash\n`;
    md += `# Validate all tools\n`;
    md += `pnpm serptools validate\n\n`;
    md += `# Build project\n`;
    md += `pnpm build\n\n`;
    md += `# Run linting\n`;
    md += `pnpm lint\n`;
    md += `\`\`\`\n\n`;

    await fs.writeFile(path.join(this.outputDir, 'developer-guide.md'), md);
  }

  /**
   * Generate user guide
   */
  async generateUserGuide(): Promise<void> {
    let md = `# User Guide\n\n`;
    md += `Learn how to use SerpTools for file conversion and processing.\n\n`;

    md += `## Getting Started\n\n`;
    md += `SerpTools provides free online file conversion tools that work directly in your browser.\n\n`;

    md += `### Basic Usage\n\n`;
    md += `1. **Select a Tool**: Choose the appropriate conversion tool for your needs\n`;
    md += `2. **Upload File**: Drag and drop or click to select your file\n`;
    md += `3. **Convert**: Click the convert button to process your file\n`;
    md += `4. **Download**: Your converted file will be automatically downloaded\n\n`;

    md += `### Privacy and Security\n\n`;
    md += `- All conversions happen locally in your browser\n`;
    md += `- Files are never uploaded to our servers\n`;
    md += `- Your data remains completely private\n`;
    md += `- No registration or account required\n\n`;

    md += `### Supported Formats\n\n`;
    const tools = await this.registryManager.getAllTools();
    const formats = new Set<string>();
    tools.forEach(tool => {
      if (tool.from) formats.add(tool.from);
      if (tool.to) formats.add(tool.to);
    });

    md += `We support over ${formats.size} different file formats including:\n\n`;
    
    const formatsByType = {
      'Image': ['jpg', 'png', 'gif', 'bmp', 'webp', 'heic', 'heif', 'svg'],
      'Video': ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv'],
      'Audio': ['mp3', 'wav', 'aac', 'flac', 'ogg'],
      'Document': ['pdf', 'doc', 'docx', 'txt']
    };

    for (const [type, typeFormats] of Object.entries(formatsByType)) {
      const supported = typeFormats.filter(f => formats.has(f));
      if (supported.length > 0) {
        md += `**${type}**: ${supported.map(f => f.toUpperCase()).join(', ')}\n\n`;
      }
    }

    md += `### Tips and Tricks\n\n`;
    md += `- **Batch Processing**: Many tools support converting multiple files at once\n`;
    md += `- **Quality Settings**: Adjust quality settings for optimal file size vs quality\n`;
    md += `- **File Size Limits**: Most tools support files up to 50MB\n`;
    md += `- **Browser Compatibility**: Works best in modern browsers (Chrome, Firefox, Safari, Edge)\n\n`;

    md += `### Troubleshooting\n\n`;
    md += `**File won't convert?**\n`;
    md += `- Check that your file format is supported\n`;
    md += `- Ensure your file isn't corrupted\n`;
    md += `- Try with a smaller file size\n\n`;
    md += `**Slow conversion?**\n`;
    md += `- Large files take more time to process\n`;
    md += `- Close other browser tabs to free up memory\n`;
    md += `- Try a different browser\n\n`;

    await fs.writeFile(path.join(this.outputDir, 'user-guide.md'), md);
  }

  /**
   * Generate main index page
   */
  async generateIndexPage(): Promise<void> {
    let md = `# SerpTools Documentation\n\n`;
    md += `Welcome to the SerpTools documentation. Here you'll find everything you need to use and develop with SerpTools.\n\n`;

    md += `## Quick Links\n\n`;
    md += `- [User Guide](./user-guide.md) - Learn how to use the tools\n`;
    md += `- [Developer Guide](./developer-guide.md) - Learn how to develop and extend SerpTools\n`;
    md += `- [Tools Documentation](./tools/index.md) - Documentation for all available tools\n`;
    md += `- [API Documentation](./api/index.md) - REST API reference\n`;
    md += `- [Architecture](./architecture/index.md) - System architecture overview\n\n`;

    md += `## What is SerpTools?\n\n`;
    md += `SerpTools is a collection of free online file conversion and processing tools. `;
    md += `Our tools work directly in your browser, ensuring your files remain private and secure.\n\n`;

    // Get statistics
    const stats = await this.registryManager.getRegistryStats();
    md += `## Statistics\n\n`;
    md += `- **${stats.totalTools}** total tools\n`;
    md += `- **${stats.activeTools}** active tools\n`;
    md += `- **${Object.keys(stats.categoryCounts).length}** categories\n`;
    md += `- **Privacy-focused** - all processing happens locally\n\n`;

    md += `## Popular Tools\n\n`;
    if (stats.topUsedTools.length > 0) {
      for (const tool of stats.topUsedTools.slice(0, 5)) {
        md += `- [${tool.toolId}](./tools/${tool.toolId}.md) - ${tool.usage} uses\n`;
      }
    } else {
      md += `- Image converters (HEIC to JPG, PNG to JPG, etc.)\n`;
      md += `- Video converters (MP4 to GIF, etc.)\n`;
      md += `- Document converters (PDF to JPG, etc.)\n`;
    }
    md += `\n`;

    md += `## Getting Help\n\n`;
    md += `- Check the [User Guide](./user-guide.md) for common usage questions\n`;
    md += `- Review [Tool Documentation](./tools/index.md) for specific tool help\n`;
    md += `- See [Troubleshooting](./user-guide.md#troubleshooting) for common issues\n\n`;

    await fs.writeFile(path.join(this.outputDir, 'README.md'), md);
  }

  /**
   * Get tool category for organization
   */
  private getToolCategory(tool: Tool): string {
    if (tool.operation === 'convert') {
      const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'heic', 'heif', 'ico', 'tiff'];
      const videoFormats = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv', 'mpeg'];
      const audioFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma'];
      
      if (tool.from && tool.to) {
        if (imageFormats.includes(tool.from) || imageFormats.includes(tool.to)) {
          return 'Image Converters';
        } else if (videoFormats.includes(tool.from) || videoFormats.includes(tool.to)) {
          return 'Video Converters';
        } else if (audioFormats.includes(tool.from) || audioFormats.includes(tool.to)) {
          return 'Audio Converters';
        }
      }
    } else if (tool.operation === 'compress') {
      return 'Compression Tools';
    }
    
    return 'Other Tools';
  }
}

/**
 * Create documentation generator
 */
export function createDocumentationGenerator(
  registryManager: ToolRegistryManager,
  outputDir: string
): DocumentationGenerator {
  return new DocumentationGenerator(registryManager, outputDir);
}