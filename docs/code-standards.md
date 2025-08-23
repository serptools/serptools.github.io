# Code Standards

Coding conventions and best practices for the SerpTools project.

## File Naming Conventions

### Components
- **React Components**: `PascalCase.tsx`
  - Example: `HeroConverter.tsx`, `ToolPageTemplate.tsx`
- **Component directories**: Match component name
  - Example: `components/HeroConverter.tsx`

### Pages (Next.js App Router)
- **Route segments**: `kebab-case`
  - Example: `app/tools/mp4-to-mp3/page.tsx`
- **Dynamic routes**: `[param]`
  - Example: `app/tools/(convert)/[from]-to-[to]/page.tsx`

### Utilities and Libraries
- **Utility files**: `kebab-case.ts`
  - Example: `tool-utils.ts`, `files-transformer.ts`
- **Workers**: `[name].worker.ts`
  - Example: `convert.worker.ts`

### Data Files
- **JSON data**: `kebab-case.json`
  - Example: `tools.json`, `files.json`

## TypeScript Conventions

### Type Definitions
```typescript
// Use interfaces for object shapes
interface ToolContent {
  id: string;
  name: string;
  route: string;
}

// Use type aliases for unions and primitives
type BuildMode = 'static' | 'server';
type Operation = 'raster' | 'video' | 'pdf-pages';
```

### Props Interfaces
```typescript
// Name props interfaces as Props or [Component]Props
type Props = {
  title: string;
  subtitle?: string; // Optional props marked with ?
  from: string;
  to: string;
};

// Or component-specific
interface HeroConverterProps {
  // ...
}
```

### Function Signatures
```typescript
// Async functions with explicit return types
async function convertVideo(
  inputBuffer: ArrayBuffer,
  fromFormat: string,
  toFormat: string,
  options: ConversionOptions = {}
): Promise<ArrayBuffer> {
  // ...
}
```

## React Component Patterns

### Functional Components
```typescript
// Default export for pages
export default function ToolPage() {
  // Component logic
  return <div>...</div>;
}

// Named export for reusable components
export function ToolCard({ title, description }: Props) {
  // Component logic
  return <div>...</div>;
}
```

### Component Structure
```typescript
// 1. Imports
import { useState, useEffect } from "react";
import { ComponentName } from "@/components/ComponentName";

// 2. Type definitions
type Props = {
  // ...
};

// 3. Component function
export default function Component({ prop1, prop2 }: Props) {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 6. Handler functions
  function handleClick() {
    // ...
  }
  
  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Use of "use client"
```typescript
"use client"; // Only when needed for client-side features

import { useState } from "react";
// Component that needs client-side state
```

## Import Conventions

### Path Aliases
```typescript
// Use @ alias for src directory
import { Component } from "@/components/Component";
import { utility } from "@/lib/utility";

// Relative imports for same directory
import { helper } from "./helper";
```

### Import Order
```typescript
// 1. React/Next imports
import { useState } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party libraries
import { motion } from "framer-motion";

// 3. Internal components
import { Button } from "@/components/ui/button";

// 4. Utilities and helpers
import { cn } from "@/lib/utils";

// 5. Types
import type { ToolContent } from "@/types";

// 6. Styles (if any)
import styles from "./styles.module.css";
```

## State Management

### Local State
```typescript
// Use descriptive state names
const [isLoading, setIsLoading] = useState(false);
const [hasError, setHasError] = useState(false);

// Group related state
const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
```

### Refs
```typescript
// Type refs properly
const inputRef = useRef<HTMLInputElement | null>(null);
const workerRef = useRef<Worker | null>(null);
```

## Error Handling

### Try-Catch Blocks
```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Descriptive error message:', error);
  // Handle error appropriately
  throw new Error(`Operation failed: ${error?.message || error}`);
}
```

### Worker Error Handling
```typescript
worker.onerror = (error) => {
  console.error('Worker error:', error);
};

worker.onmessage = (ev) => {
  if (!ev.data) {
    console.error('Malformed worker message:', ev);
    return;
  }
  
  if (!ev.data.ok) {
    console.error('Operation failed:', ev.data.error);
    return;
  }
};
```

## Styling Conventions

### Tailwind Classes
```typescript
// Use className for static classes
<div className="flex items-center justify-center">

// Use cn() for conditional classes
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  hasError && "error-classes"
)}>
```

### Dynamic Styles
```typescript
// Use style prop for dynamic values
<div 
  style={{
    backgroundColor: `${color}15`, // Dynamic with opacity
    borderColor: color,
  }}
/>
```

## Comments and Documentation

### Function Comments
```typescript
/**
 * Converts a video file from one format to another using FFmpeg.wasm
 * @param inputBuffer - The input file as ArrayBuffer
 * @param fromFormat - Source format (e.g., 'mp4')
 * @param toFormat - Target format (e.g., 'webm')
 * @param options - Optional conversion settings
 * @returns Promise resolving to converted file ArrayBuffer
 */
async function convertVideo(
  inputBuffer: ArrayBuffer,
  fromFormat: string,
  toFormat: string,
  options: ConversionOptions = {}
): Promise<ArrayBuffer> {
  // Implementation
}
```

### Inline Comments
```typescript
// Use inline comments for complex logic
if (videoFormats.includes(from) || audioFormats.includes(to)) {
  // Check if video conversion is supported before attempting
  if (!capabilities?.supportsVideoConversion) {
    throw new Error(`Video conversion not supported`);
  }
  op = "video";
}
```

## Constants and Configuration

### Constants
```typescript
// Use UPPER_SNAKE_CASE for constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const SUPPORTED_FORMATS = ['jpg', 'png', 'webp'];

// Use const arrays/objects
const VIDEO_FORMATS = [
  'mp4', 'mkv', 'avi', 'webm'
] as const;
```

## Async/Await

### Prefer async/await over promises
```typescript
// Good
async function loadData() {
  try {
    const data = await fetchData();
    return processData(data);
  } catch (error) {
    handleError(error);
  }
}

// Avoid promise chains when possible
fetchData()
  .then(processData)
  .catch(handleError);
```

## Performance Considerations

### Web Workers
```typescript
// Transfer ArrayBuffers instead of copying
worker.postMessage(
  { op: 'convert', buffer },
  [buffer] // Transfer ownership
);
```

### Lazy Loading
```typescript
// Dynamic imports for heavy libraries
const { convertVideo } = await import("../lib/convert/video");
```

### Memoization
```typescript
// Use useMemo for expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(input);
}, [input]);
```

## Testing Conventions

### Test File Naming
- Test files: `[component].test.tsx` or `[utility].test.ts`
- Test directories: `__tests__/` or `tests/`

### Test Structure
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });
  
  it('should handle user interaction', () => {
    // Test implementation
  });
});
```

## Git Commit Messages

### Format
```
type: brief description

Longer explanation if needed
```

### Types
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting, no code change
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

## Environment Variables

### Naming
```bash
# Use UPPERCASE with underscores
BUILD_MODE=static
SUPPORTS_VIDEO_CONVERSION=true
NEXT_PUBLIC_API_URL=https://api.example.com
```

### Usage
```typescript
// Access in code
const buildMode = process.env.BUILD_MODE;

// Public variables (exposed to browser)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

## See Also

- [Quick Reference](quick-reference.md) - Common patterns
- [Component Pattern](patterns/component-pattern.md) - Component architecture
- [File Inventory](file-inventory.md) - File organization