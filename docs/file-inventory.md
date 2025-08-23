# File Inventory

Complete listing of project files and their purposes.

## Root Configuration Files

| File | Purpose |
|------|---------|
| `next.config.mjs` | Next.js configuration with build mode support |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `tsconfig.json` | TypeScript compiler configuration |
| `package.json` | Project dependencies and scripts |
| `postcss.config.mjs` | PostCSS configuration for Tailwind |
| `next-sitemap.config.js` | Sitemap generation configuration |
| `components.json` | shadcn/ui component configuration |

## Application Structure

### `/app` - Next.js App Router

| Path | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with providers and metadata |
| `app/page.tsx` | Homepage component |
| `app/globals.css` | Global styles and Tailwind imports |
| `app/sitemap.ts` | Dynamic sitemap generation |
| `app/manifest.ts` | PWA manifest generation |

### `/app/tools` - Tool Pages

| Pattern | Purpose | Example |
|---------|---------|---------|
| `(convert)/[from]-to-[to]/page.tsx` | Conversion tool pages | `mp4-to-mp3/page.tsx` |
| `[tool-name]/page.tsx` | Utility tool pages | `csv-combiner/page.tsx` |

## Components

### Core Components

| File | Purpose | Key Features |
|------|---------|--------------|
| `HeroConverter.tsx` | Main conversion UI component | File upload, drag-drop, conversion |
| `LanderHeroTwoColumn.tsx` | Two-column converter layout | Video tutorial + converter |
| `BatchHeroConverter.tsx` | Bulk file processing | Multiple file handling |
| `ToolPageTemplate.tsx` | Tool page wrapper | Content display with fallback |

### UI Components

| File | Purpose |
|------|---------|
| `Navbar.tsx` | Site navigation |
| `ToolCard.tsx` | Tool grid display card |
| `VideoProgress.tsx` | Video conversion progress |
| `GoogleTagManager.tsx` | Analytics integration |

### Template Components

| File | Purpose |
|------|---------|
| `CategoryPageTemplate.tsx` | Category listing pages |
| `FileTypePageTemplate.tsx` | File type information pages |
| `ToolsByCategory.tsx` | Tools grouped by category |
| `ToolsByTaxonomy.tsx` | Tools grouped by taxonomy |

## Libraries (`/lib`)

### Conversion System

| File | Purpose | Exports |
|------|---------|---------|
| `convert/video.ts` | Video conversion with FFmpeg | `convertVideo()`, `cleanupFFmpeg()` |
| `convert/decode.ts` | Image decoding | `decodeToRGBA()` |
| `convert/encode.ts` | Image encoding | `encodeFromRGBA()` |
| `convert/heif.ts` | HEIF/HEIC processing | `decodeHeifToRGBA()` |
| `convert/pdf.ts` | PDF processing | `renderPdfPages()` |
| `convert/gif.ts` | GIF optimization | `optimizeGif()` |

### Utilities

| File | Purpose | Key Functions |
|------|---------|---------------|
| `capabilities.ts` | Feature detection | `detectCapabilities()`, `isStaticCompatible()` |
| `tool-utils.ts` | Tool management | `getToolsByCategory()`, `getAllTools()` |
| `tool-content.ts` | Content loading | Tool content from `tools.json` |
| `files-transformer.ts` | File data processing | File type information |
| `files-categories.ts` | File categorization | Category definitions |
| `utils.ts` | General utilities | `cn()` for className merging |
| `zipUtils.ts` | ZIP file handling | ZIP creation utilities |

## Workers (`/workers`)

| File | Purpose | Operations |
|------|---------|------------|
| `convert.worker.ts` | File conversion worker | `raster`, `video`, `pdf-pages` operations |
| `compress.worker.ts` | File compression worker | ZIP compression operations |

## Data Files (`/data`)

| File | Purpose | Size |
|------|---------|------|
| `tools.json` | Tool definitions and content | ~9,700 lines |
| `files.json` | File type information | Large reference database |
| `categories.json` | Category definitions | Tool categorization |

## Public Assets (`/public`)

| Directory | Contents |
|-----------|----------|
| `/public/images/` | Site images and icons |
| `/public/vendor/pdfjs/` | PDF.js library files |

## Scripts (`/scripts`)

| File | Purpose |
|------|---------|
| `gen-manifest.mjs` | Generate PWA manifest |
| `update-readme.mjs` | Update README with tool list |
| Additional build scripts | Various automation tasks |

## Type Definitions (`/types`)

| File | Purpose |
|------|---------|
| Type definition files | TypeScript interfaces and types |

## Component Subdirectories

### `/components/ui` - shadcn/ui Components

Reusable UI components from shadcn/ui library including:
- Button, Card, Dialog
- Form controls
- Layout components

### `/components/files` - File Type Components

| Directory | Purpose |
|-----------|---------|
| Category pages | File type category displays |
| Individual file pages | Specific file type information |

## Test Files (`/tests`)

| File | Purpose |
|------|---------|
| Test specifications | Unit and integration tests |

## Key Patterns Observed

1. **Tool Page Pattern**: Simple page components that check for content in `tools.json` and fall back to `HeroConverter`
2. **Worker Pattern**: Offloading CPU-intensive tasks to Web Workers
3. **Capability Pattern**: Runtime detection of available features
4. **Template Pattern**: Reusable templates for different page types

## File Naming Conventions

- **Pages**: `[feature]/page.tsx` (Next.js App Router)
- **Components**: `PascalCase.tsx`
- **Utilities**: `kebab-case.ts`
- **Workers**: `[name].worker.ts`
- **Data**: `[name].json`

## Build Outputs

| Directory | Purpose |
|-----------|---------|
| `.next/` | Next.js build output |
| `out/` | Static export output |

## Configuration Files

| File | Purpose |
|------|---------|
| `.eslintrc.json` | ESLint configuration |
| `.gitignore` | Git ignore patterns |
| `.husky/` | Git hooks configuration |

## See Also

- [Quick Reference](quick-reference.md) - Common tasks
- [Code Standards](code-standards.md) - Coding conventions
- [Component Pattern](patterns/component-pattern.md) - Component architecture