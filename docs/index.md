# SerpTools Documentation

## Project Overview

SerpTools is a Next.js-based web application providing a collection of file conversion and utility tools. The application features client-side processing for privacy, with optional server-side capabilities for advanced video processing using FFmpeg.wasm.

## Directory Structure

```
docs/
├── index.md                    # This file - main navigation
├── file-inventory.md           # Complete file listing and purposes
├── quick-reference.md          # Common tasks and solutions
├── code-standards.md           # Coding conventions and standards
├── enhancements.md            # Bugs and improvements found
├── patterns/                  # Architectural patterns
│   ├── component-pattern.md   # React component architecture
│   ├── converter-pattern.md   # File conversion pattern
│   ├── tool-page-pattern.md  # Tool page creation pattern
│   └── worker-pattern.md      # Web Worker usage pattern
├── recipes/                    # Step-by-step guides
│   ├── add-new-converter.md   # Add a new file converter
│   ├── add-tool-content.md    # Add content to tools.json
│   ├── add-bulk-tool.md       # Create batch processing tools
│   └── enable-video-mode.md   # Enable video conversion
└── modules/                    # System components
    ├── conversion-system.md    # File conversion architecture
    ├── capability-detection.md # Static vs server mode
    ├── tool-system.md         # Tool registration and routing
    └── worker-system.md       # Web Worker implementation
```

## Quick Links

### I want to...

#### Add New Features
- [Add a new file converter](recipes/add-new-converter.md)
- [Add content to an existing tool](recipes/add-tool-content.md)
- [Create a batch processing tool](recipes/add-bulk-tool.md)
- [Enable video conversion support](recipes/enable-video-mode.md)

#### Understand the System
- [How file conversion works](modules/conversion-system.md)
- [Component architecture](patterns/component-pattern.md)
- [Tool page structure](patterns/tool-page-pattern.md)
- [Worker implementation](patterns/worker-pattern.md)

#### Fix or Improve
- [Known issues and improvements](enhancements.md)
- [Code standards and conventions](code-standards.md)
- [File inventory and purposes](file-inventory.md)

## Patterns

### [Component Pattern](patterns/component-pattern.md)
Describes the React component architecture using template components (`ToolPageTemplate`, `HeroConverter`) and composition patterns for tool pages.

### [Converter Pattern](patterns/converter-pattern.md)
Explains the file conversion architecture using Web Workers, supporting image, document, and video conversions with different processing pipelines.

### [Tool Page Pattern](patterns/tool-page-pattern.md)
Details how tool pages are created, including routing, content management through `tools.json`, and fallback mechanisms.

### [Worker Pattern](patterns/worker-pattern.md)
Documents the Web Worker implementation for CPU-intensive operations, including message passing and file transfer optimization.

## Recipes

### [Add New Converter](recipes/add-new-converter.md)
Step-by-step guide to adding a new file conversion tool, from creating the page component to adding conversion logic.

### [Add Tool Content](recipes/add-tool-content.md)
How to add rich content (FAQs, comparisons, blog posts) to tools through the `tools.json` configuration.

### [Add Bulk Tool](recipes/add-bulk-tool.md)
Creating batch processing tools that handle multiple files simultaneously.

### [Enable Video Mode](recipes/enable-video-mode.md)
Configuring the application for server deployment with video conversion support.

## Modules

### [Conversion System](modules/conversion-system.md)
Core file conversion architecture including image processing, PDF handling, and video conversion with FFmpeg.wasm.

### [Capability Detection](modules/capability-detection.md)
Runtime detection system for determining available features based on deployment mode (static vs server).

### [Tool System](modules/tool-system.md)
Tool registration, routing, and content management through centralized configuration.

### [Worker System](modules/worker-system.md)
Web Worker implementation for offloading CPU-intensive tasks from the main thread.

## Additional Resources

- [File Inventory](file-inventory.md) - Complete listing of all files and their purposes
- [Quick Reference](quick-reference.md) - Common tasks and quick solutions
- [Code Standards](code-standards.md) - Project coding conventions
- [Enhancements](enhancements.md) - Known issues and improvement opportunities

## Key Technologies

- **Next.js 15.1.0** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **FFmpeg.wasm** - Client-side video processing
- **PDF.js** - PDF manipulation
- **Web Workers** - Background processing

## Build Modes

The application supports two build modes:

1. **Static Mode** (default) - For GitHub Pages, static hosting
   - Image and document conversion only
   - No video processing

2. **Server Mode** - For Vercel, Netlify, server deployment
   - Full feature set including video conversion
   - Requires SharedArrayBuffer support

See [Capability Detection](modules/capability-detection.md) for details.