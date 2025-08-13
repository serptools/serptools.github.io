import type { OperationType, MediaType } from './tool-taxonomy';
import { formatToMediaType } from './tool-taxonomy';

export interface Tool {
  id: string;
  name: string;
  description: string;
  
  // Dual taxonomy
  operation: OperationType;  // What it does: convert, compress, etc.
  mediaTypes?: {
    source?: MediaType;      // Input media type
    target?: MediaType;      // Output media type
  };
  
  // File formats
  from?: string;
  to?: string;
  
  // Metadata
  route: string;
  isActive: boolean;
  tags?: string[];
  priority?: number;
  isBeta?: boolean;
  isNew?: boolean;
}

export const tools: Tool[] = [
  // ===== CONVERT TOOLS =====
  // HEIC/HEIF Converters
  { id: 'heic-to-jpg', name: 'HEIC to JPG', description: 'Convert HEIC photos to JPG format', operation: 'convert' as OperationType, route: '/tools/heic-to-jpg', from: 'heic', to: 'jpg', isActive: true, tags: ['heic', 'jpg', 'image', 'photo', 'apple'], priority: 9 },
  { id: 'heic-to-jpeg', name: 'HEIC to JPEG', description: 'Convert HEIC photos to JPEG format', operation: 'convert' as OperationType, route: '/tools/heic-to-jpeg', from: 'heic', to: 'jpeg', isActive: true },
  { id: 'heic-to-png', name: 'HEIC to PNG', description: 'Convert HEIC photos to PNG format', operation: 'convert' as OperationType, route: '/tools/heic-to-png', from: 'heic', to: 'png', isActive: true },
  { id: 'heic-to-pdf', name: 'HEIC to PDF', description: 'Convert HEIC photos to PDF documents', operation: 'convert' as OperationType, route: '/tools/heic-to-pdf', from: 'heic', to: 'pdf', isActive: true },
  { id: 'heif-to-jpg', name: 'HEIF to JPG', description: 'Convert HEIF images to JPG format', operation: 'convert' as OperationType, route: '/tools/heif-to-jpg', from: 'heif', to: 'jpg', isActive: true },
  { id: 'heif-to-png', name: 'HEIF to PNG', description: 'Convert HEIF images to PNG format', operation: 'convert' as OperationType, route: '/tools/heif-to-png', from: 'heif', to: 'png', isActive: true },
  { id: 'heif-to-pdf', name: 'HEIF to PDF', description: 'Convert HEIF images to PDF documents', operation: 'convert' as OperationType, route: '/tools/heif-to-pdf', from: 'heif', to: 'pdf', isActive: true },
  
  // PDF Converters
  { id: 'pdf-to-jpg', name: 'PDF to JPG', description: 'Convert PDF pages to JPG images', operation: 'convert' as OperationType, route: '/tools/pdf-to-jpg', from: 'pdf', to: 'jpg', isActive: true },
  { id: 'pdf-to-png', name: 'PDF to PNG', description: 'Convert PDF pages to PNG images', operation: 'convert' as OperationType, route: '/tools/pdf-to-png', from: 'pdf', to: 'png', isActive: true },
  { id: 'jpg-to-pdf', name: 'JPG to PDF', description: 'Convert JPG images to PDF documents', operation: 'convert' as OperationType, route: '/tools/jpg-to-pdf', from: 'jpg', to: 'pdf', isActive: true },
  { id: 'jpeg-to-pdf', name: 'JPEG to PDF', description: 'Convert JPEG images to PDF documents', operation: 'convert' as OperationType, route: '/tools/jpeg-to-pdf', from: 'jpeg', to: 'pdf', isActive: true },
  
  // Standard Image Converters
  { id: 'jpg-to-png', name: 'JPG to PNG', description: 'Convert JPG to PNG with transparency', operation: 'convert' as OperationType, route: '/tools/jpg-to-png', from: 'jpg', to: 'png', isActive: true },
  { id: 'png-to-jpg', name: 'PNG to JPG', description: 'Convert PNG images to JPG format', operation: 'convert' as OperationType, route: '/tools/png-to-jpg', from: 'png', to: 'jpg', isActive: true },
  { id: 'jpeg-to-png', name: 'JPEG to PNG', description: 'Convert JPEG to PNG format', operation: 'convert' as OperationType, route: '/tools/jpeg-to-png', from: 'jpeg', to: 'png', isActive: true },
  { id: 'jpeg-to-jpg', name: 'JPEG to JPG', description: 'Convert JPEG to JPG format', operation: 'convert' as OperationType, route: '/tools/jpeg-to-jpg', from: 'jpeg', to: 'jpg', isActive: true },
  
  // WebP Converters
  { id: 'webp-to-png', name: 'WebP to PNG', description: 'Convert WebP images to PNG', operation: 'convert' as OperationType, route: '/tools/webp-to-png', from: 'webp', to: 'png', isActive: true },
  { id: 'png-to-webp', name: 'PNG to WebP', description: 'Convert PNG to WebP format', operation: 'convert' as OperationType, route: '/tools/png-to-webp', from: 'png', to: 'webp', isActive: true },
  { id: 'jpg-to-webp', name: 'JPG to WebP', description: 'Convert JPG to WebP format', operation: 'convert' as OperationType, route: '/tools/jpg-to-webp', from: 'jpg', to: 'webp', isActive: true },
  { id: 'jpeg-to-webp', name: 'JPEG to WebP', description: 'Convert JPEG to WebP format', operation: 'convert' as OperationType, route: '/tools/jpeg-to-webp', from: 'jpeg', to: 'webp', isActive: true },
  { id: 'gif-to-webp', name: 'GIF to WebP', description: 'Convert animated GIFs to WebP', operation: 'convert' as OperationType, route: '/tools/gif-to-webp', from: 'gif', to: 'webp', isActive: true },
  
  // AVIF Converters
  { id: 'avif-to-png', name: 'AVIF to PNG', description: 'Convert AVIF images to PNG', operation: 'convert' as OperationType, route: '/tools/avif-to-png', from: 'avif', to: 'png', isActive: true },
  { id: 'avif-to-jpg', name: 'AVIF to JPG', description: 'Convert AVIF to JPG format', operation: 'convert' as OperationType, route: '/tools/avif-to-jpg', from: 'avif', to: 'jpg', isActive: true },
  { id: 'avif-to-jpeg', name: 'AVIF to JPEG', description: 'Convert AVIF to JPEG format', operation: 'convert' as OperationType, route: '/tools/avif-to-jpeg', from: 'avif', to: 'jpeg', isActive: true },
  
  // Legacy Format Converters
  { id: 'bmp-to-jpg', name: 'BMP to JPG', description: 'Convert BMP images to JPG', operation: 'convert' as OperationType, route: '/tools/bmp-to-jpg', from: 'bmp', to: 'jpg', isActive: true },
  { id: 'bmp-to-png', name: 'BMP to PNG', description: 'Convert BMP images to PNG', operation: 'convert' as OperationType, route: '/tools/bmp-to-png', from: 'bmp', to: 'png', isActive: true },
  { id: 'ico-to-png', name: 'ICO to PNG', description: 'Convert ICO icons to PNG', operation: 'convert' as OperationType, route: '/tools/ico-to-png', from: 'ico', to: 'png', isActive: true },
  { id: 'gif-to-jpg', name: 'GIF to JPG', description: 'Extract first frame as JPG', operation: 'convert' as OperationType, route: '/tools/gif-to-jpg', from: 'gif', to: 'jpg', isActive: true },
  { id: 'gif-to-png', name: 'GIF to PNG', description: 'Extract GIF frames as PNG', operation: 'convert' as OperationType, route: '/tools/gif-to-png', from: 'gif', to: 'png', isActive: true },
  
  // JFIF Converters
  { id: 'jfif-to-jpg', name: 'JFIF to JPG', description: 'Convert JFIF to JPG format', operation: 'convert' as OperationType, route: '/tools/jfif-to-jpg', from: 'jfif', to: 'jpg', isActive: true },
  { id: 'jfif-to-jpeg', name: 'JFIF to JPEG', description: 'Convert JFIF to JPEG format', operation: 'convert' as OperationType, route: '/tools/jfif-to-jpeg', from: 'jfif', to: 'jpeg', isActive: true },
  { id: 'jfif-to-png', name: 'JFIF to PNG', description: 'Convert JFIF to PNG format', operation: 'convert' as OperationType, route: '/tools/jfif-to-png', from: 'jfif', to: 'png', isActive: true },
  { id: 'jfif-to-pdf', name: 'JFIF to PDF', description: 'Convert JFIF to PDF documents', operation: 'convert' as OperationType, route: '/tools/jfif-to-pdf', from: 'jfif', to: 'pdf', isActive: true },
  
  // RAW Format Converters
  { id: 'cr2-to-jpg', name: 'CR2 to JPG', description: 'Convert Canon CR2 RAW to JPG', operation: 'convert' as OperationType, route: '/tools/cr2-to-jpg', from: 'cr2', to: 'jpg', isActive: true },
  { id: 'cr3-to-jpg', name: 'CR3 to JPG', description: 'Convert Canon CR3 RAW to JPG', operation: 'convert' as OperationType, route: '/tools/cr3-to-jpg', from: 'cr3', to: 'jpg', isActive: true },
  { id: 'dng-to-jpg', name: 'DNG to JPG', description: 'Convert Adobe DNG to JPG', operation: 'convert' as OperationType, route: '/tools/dng-to-jpg', from: 'dng', to: 'jpg', isActive: true },
  { id: 'arw-to-jpg', name: 'ARW to JPG', description: 'Convert Sony ARW RAW to JPG', operation: 'convert' as OperationType, route: '/tools/arw-to-jpg', from: 'arw', to: 'jpg', isActive: true },
  
  // SVG Converters
  { id: 'jpg-to-svg', name: 'JPG to SVG', description: 'Convert JPG to vector SVG', operation: 'convert' as OperationType, route: '/tools/jpg-to-svg', from: 'jpg', to: 'svg', isActive: true },
  
  // ===== COMPRESS TOOLS =====
  { id: 'png-to-png', name: 'PNG Optimizer', description: 'Compress and optimize PNG files', operation: 'compress' as OperationType, route: '/tools/png-to-png', from: 'png', to: 'png', isActive: true, tags: ['png', 'compress', 'optimize', 'image'], priority: 8 },
  
  // ===== COMBINE TOOLS =====
  { id: 'csv-combiner', name: 'CSV Combiner', description: 'Combine multiple CSV files into one', operation: 'combine' as OperationType, route: '/tools/csv-combiner', from: 'csv', to: 'csv', isActive: true, tags: ['csv', 'merge', 'combine', 'data'], priority: 7 },
  
  // ===== OTHER TOOLS =====
  { id: 'json-to-csv', name: 'JSON to CSV', description: 'Convert JSON data to CSV format', operation: 'convert' as OperationType, route: '/tools/json-to-csv', from: 'json', to: 'csv', isActive: true },
  { id: 'character-counter', name: 'Character Counter', description: 'Count characters, words, and lines', operation: 'convert' as OperationType, route: '/tools/character-counter', isActive: true, tags: ['text', 'count', 'analyze', 'words', 'characters'], priority: 6 },
];

// Helper functions
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

// Populate media types for all tools
export const toolsWithMediaTypes: Tool[] = tools.map(tool => ({
  ...tool,
  mediaTypes: {
    source: tool.from ? formatToMediaType[tool.from.toLowerCase()] : undefined,
    target: tool.to ? formatToMediaType[tool.to.toLowerCase()] : undefined,
  }
}));