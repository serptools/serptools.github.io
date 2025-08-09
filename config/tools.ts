export type ToolCategory = 'convert' | 'compress' | 'combine';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  route: string;
  from?: string;
  to?: string;
  isActive: boolean;
}

export const tools: Tool[] = [
  // ===== CONVERT TOOLS =====
  // HEIC/HEIF Converters
  { id: 'heic-to-jpg', name: 'HEIC to JPG', description: 'Convert HEIC photos to JPG format', category: 'convert', route: '/tools/heic-to-jpg', from: 'heic', to: 'jpg', isActive: true },
  { id: 'heic-to-jpeg', name: 'HEIC to JPEG', description: 'Convert HEIC photos to JPEG format', category: 'convert', route: '/tools/heic-to-jpeg', from: 'heic', to: 'jpeg', isActive: true },
  { id: 'heic-to-png', name: 'HEIC to PNG', description: 'Convert HEIC photos to PNG format', category: 'convert', route: '/tools/heic-to-png', from: 'heic', to: 'png', isActive: true },
  { id: 'heic-to-pdf', name: 'HEIC to PDF', description: 'Convert HEIC photos to PDF documents', category: 'convert', route: '/tools/heic-to-pdf', from: 'heic', to: 'pdf', isActive: true },
  { id: 'heif-to-jpg', name: 'HEIF to JPG', description: 'Convert HEIF images to JPG format', category: 'convert', route: '/tools/heif-to-jpg', from: 'heif', to: 'jpg', isActive: true },
  { id: 'heif-to-png', name: 'HEIF to PNG', description: 'Convert HEIF images to PNG format', category: 'convert', route: '/tools/heif-to-png', from: 'heif', to: 'png', isActive: true },
  { id: 'heif-to-pdf', name: 'HEIF to PDF', description: 'Convert HEIF images to PDF documents', category: 'convert', route: '/tools/heif-to-pdf', from: 'heif', to: 'pdf', isActive: true },
  
  // PDF Converters
  { id: 'pdf-to-jpg', name: 'PDF to JPG', description: 'Convert PDF pages to JPG images', category: 'convert', route: '/tools/pdf-to-jpg', from: 'pdf', to: 'jpg', isActive: true },
  { id: 'pdf-to-png', name: 'PDF to PNG', description: 'Convert PDF pages to PNG images', category: 'convert', route: '/tools/pdf-to-png', from: 'pdf', to: 'png', isActive: true },
  { id: 'jpg-to-pdf', name: 'JPG to PDF', description: 'Convert JPG images to PDF documents', category: 'convert', route: '/tools/jpg-to-pdf', from: 'jpg', to: 'pdf', isActive: true },
  { id: 'jpeg-to-pdf', name: 'JPEG to PDF', description: 'Convert JPEG images to PDF documents', category: 'convert', route: '/tools/jpeg-to-pdf', from: 'jpeg', to: 'pdf', isActive: true },
  
  // Standard Image Converters
  { id: 'jpg-to-png', name: 'JPG to PNG', description: 'Convert JPG to PNG with transparency', category: 'convert', route: '/tools/jpg-to-png', from: 'jpg', to: 'png', isActive: true },
  { id: 'png-to-jpg', name: 'PNG to JPG', description: 'Convert PNG images to JPG format', category: 'convert', route: '/tools/png-to-jpg', from: 'png', to: 'jpg', isActive: true },
  { id: 'jpeg-to-png', name: 'JPEG to PNG', description: 'Convert JPEG to PNG format', category: 'convert', route: '/tools/jpeg-to-png', from: 'jpeg', to: 'png', isActive: true },
  { id: 'jpeg-to-jpg', name: 'JPEG to JPG', description: 'Convert JPEG to JPG format', category: 'convert', route: '/tools/jpeg-to-jpg', from: 'jpeg', to: 'jpg', isActive: true },
  
  // WebP Converters
  { id: 'webp-to-png', name: 'WebP to PNG', description: 'Convert WebP images to PNG', category: 'convert', route: '/tools/webp-to-png', from: 'webp', to: 'png', isActive: true },
  { id: 'png-to-webp', name: 'PNG to WebP', description: 'Convert PNG to WebP format', category: 'convert', route: '/tools/png-to-webp', from: 'png', to: 'webp', isActive: true },
  { id: 'jpg-to-webp', name: 'JPG to WebP', description: 'Convert JPG to WebP format', category: 'convert', route: '/tools/jpg-to-webp', from: 'jpg', to: 'webp', isActive: true },
  { id: 'jpeg-to-webp', name: 'JPEG to WebP', description: 'Convert JPEG to WebP format', category: 'convert', route: '/tools/jpeg-to-webp', from: 'jpeg', to: 'webp', isActive: true },
  { id: 'gif-to-webp', name: 'GIF to WebP', description: 'Convert animated GIFs to WebP', category: 'convert', route: '/tools/gif-to-webp', from: 'gif', to: 'webp', isActive: true },
  
  // AVIF Converters
  { id: 'avif-to-png', name: 'AVIF to PNG', description: 'Convert AVIF images to PNG', category: 'convert', route: '/tools/avif-to-png', from: 'avif', to: 'png', isActive: true },
  { id: 'avif-to-jpg', name: 'AVIF to JPG', description: 'Convert AVIF to JPG format', category: 'convert', route: '/tools/avif-to-jpg', from: 'avif', to: 'jpg', isActive: true },
  { id: 'avif-to-jpeg', name: 'AVIF to JPEG', description: 'Convert AVIF to JPEG format', category: 'convert', route: '/tools/avif-to-jpeg', from: 'avif', to: 'jpeg', isActive: true },
  
  // Legacy Format Converters
  { id: 'bmp-to-jpg', name: 'BMP to JPG', description: 'Convert BMP images to JPG', category: 'convert', route: '/tools/bmp-to-jpg', from: 'bmp', to: 'jpg', isActive: true },
  { id: 'bmp-to-png', name: 'BMP to PNG', description: 'Convert BMP images to PNG', category: 'convert', route: '/tools/bmp-to-png', from: 'bmp', to: 'png', isActive: true },
  { id: 'ico-to-png', name: 'ICO to PNG', description: 'Convert ICO icons to PNG', category: 'convert', route: '/tools/ico-to-png', from: 'ico', to: 'png', isActive: true },
  { id: 'gif-to-jpg', name: 'GIF to JPG', description: 'Extract first frame as JPG', category: 'convert', route: '/tools/gif-to-jpg', from: 'gif', to: 'jpg', isActive: true },
  { id: 'gif-to-png', name: 'GIF to PNG', description: 'Extract GIF frames as PNG', category: 'convert', route: '/tools/gif-to-png', from: 'gif', to: 'png', isActive: true },
  
  // JFIF Converters
  { id: 'jfif-to-jpg', name: 'JFIF to JPG', description: 'Convert JFIF to JPG format', category: 'convert', route: '/tools/jfif-to-jpg', from: 'jfif', to: 'jpg', isActive: true },
  { id: 'jfif-to-jpeg', name: 'JFIF to JPEG', description: 'Convert JFIF to JPEG format', category: 'convert', route: '/tools/jfif-to-jpeg', from: 'jfif', to: 'jpeg', isActive: true },
  { id: 'jfif-to-png', name: 'JFIF to PNG', description: 'Convert JFIF to PNG format', category: 'convert', route: '/tools/jfif-to-png', from: 'jfif', to: 'png', isActive: true },
  { id: 'jfif-to-pdf', name: 'JFIF to PDF', description: 'Convert JFIF to PDF documents', category: 'convert', route: '/tools/jfif-to-pdf', from: 'jfif', to: 'pdf', isActive: true },
  
  // RAW Format Converters
  { id: 'cr2-to-jpg', name: 'CR2 to JPG', description: 'Convert Canon CR2 RAW to JPG', category: 'convert', route: '/tools/cr2-to-jpg', from: 'cr2', to: 'jpg', isActive: true },
  { id: 'cr3-to-jpg', name: 'CR3 to JPG', description: 'Convert Canon CR3 RAW to JPG', category: 'convert', route: '/tools/cr3-to-jpg', from: 'cr3', to: 'jpg', isActive: true },
  { id: 'dng-to-jpg', name: 'DNG to JPG', description: 'Convert Adobe DNG to JPG', category: 'convert', route: '/tools/dng-to-jpg', from: 'dng', to: 'jpg', isActive: true },
  { id: 'arw-to-jpg', name: 'ARW to JPG', description: 'Convert Sony ARW RAW to JPG', category: 'convert', route: '/tools/arw-to-jpg', from: 'arw', to: 'jpg', isActive: true },
  
  // SVG Converters
  { id: 'jpg-to-svg', name: 'JPG to SVG', description: 'Convert JPG to vector SVG', category: 'convert', route: '/tools/jpg-to-svg', from: 'jpg', to: 'svg', isActive: true },
  
  // Inactive/Placeholder Converters
  { id: 'pdf-to-pdf', name: 'PDF to PDF', description: 'Optimize PDF files', category: 'compress', route: '/tools/pdf-to-pdf', from: 'pdf', to: 'pdf', isActive: false },
  { id: 'pdf-to-svg', name: 'PDF to SVG', description: 'Convert PDF to SVG', category: 'convert', route: '/tools/pdf-to-svg', from: 'pdf', to: 'svg', isActive: false },
  { id: 'pdf-to-tiff', name: 'PDF to TIFF', description: 'Convert PDF to TIFF', category: 'convert', route: '/tools/pdf-to-tiff', from: 'pdf', to: 'tiff', isActive: false },
  { id: 'png-to-svg', name: 'PNG to SVG', description: 'Convert PNG to SVG', category: 'convert', route: '/tools/png-to-svg', from: 'png', to: 'svg', isActive: false },
  { id: 'png-to-tiff', name: 'PNG to TIFF', description: 'Convert PNG to TIFF', category: 'convert', route: '/tools/png-to-tiff', from: 'png', to: 'tiff', isActive: false },
  { id: 'jpeg-to-svg', name: 'JPEG to SVG', description: 'Convert JPEG to SVG', category: 'convert', route: '/tools/jpeg-to-svg', from: 'jpeg', to: 'svg', isActive: false },
  { id: 'eps-to-jpg', name: 'EPS to JPG', description: 'Convert EPS to JPG', category: 'convert', route: '/tools/eps-to-jpg', from: 'eps', to: 'jpg', isActive: false },
  { id: 'eps-to-png', name: 'EPS to PNG', description: 'Convert EPS to PNG', category: 'convert', route: '/tools/eps-to-png', from: 'eps', to: 'png', isActive: false },
  { id: 'eps-to-pdf', name: 'EPS to PDF', description: 'Convert EPS to PDF', category: 'convert', route: '/tools/eps-to-pdf', from: 'eps', to: 'pdf', isActive: false },
  { id: 'eps-to-svg', name: 'EPS to SVG', description: 'Convert EPS to SVG', category: 'convert', route: '/tools/eps-to-svg', from: 'eps', to: 'svg', isActive: false },
  { id: 'dds-to-png', name: 'DDS to PNG', description: 'Convert DDS to PNG', category: 'convert', route: '/tools/dds-to-png', from: 'dds', to: 'png', isActive: false },
  { id: 'avif-to-gif', name: 'AVIF to GIF', description: 'Convert AVIF to GIF', category: 'convert', route: '/tools/avif-to-gif', from: 'avif', to: 'gif', isActive: false },
  
  // ===== COMPRESS TOOLS =====
  { id: 'png-to-png', name: 'PNG Optimizer', description: 'Compress and optimize PNG files', category: 'compress', route: '/tools/png-to-png', from: 'png', to: 'png', isActive: true },
  
  // ===== COMBINE TOOLS =====
  { id: 'csv-combiner', name: 'CSV Combiner', description: 'Combine multiple CSV files into one', category: 'combine', route: '/tools/csv-combiner', isActive: true },
  
  // ===== OTHER TOOLS =====
  { id: 'json-to-csv', name: 'JSON to CSV', description: 'Convert JSON data to CSV format', category: 'convert', route: '/tools/json-to-csv', from: 'json', to: 'csv', isActive: true },
  { id: 'character-counter', name: 'Character Counter', description: 'Count characters, words, and lines', category: 'convert', route: '/tools/character-counter', isActive: true },
];

// Helper functions
export const getToolsByCategory = (category: ToolCategory): Tool[] => {
  return tools.filter(tool => tool.category === category && tool.isActive);
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

// Category metadata
export const categoryMetadata = {
  convert: {
    name: 'Convert',
    description: 'Transform files from one format to another',
    icon: '🔄',
  },
  compress: {
    name: 'Compress',
    description: 'Reduce file sizes while maintaining quality',
    icon: '🗜️',
  },
  combine: {
    name: 'Combine',
    description: 'Merge multiple files into one',
    icon: '🔗',
  },
};