/**
 * Tool Category Schema
 * Defines categories and subcategories for all tools
 */

export type MainCategory = 'convert' | 'compress' | 'combine' | 'edit' | 'analyze' | 'generate';

export type SubCategory = 
  // Convert subcategories
  | 'image-to-image'
  | 'image-to-document' 
  | 'document-to-image'
  | 'video-to-video'
  | 'video-to-audio'
  | 'audio-to-audio'
  | 'data-format'
  // Compress subcategories
  | 'image-compress'
  | 'video-compress'
  | 'document-compress'
  // Combine subcategories
  | 'merge-files'
  | 'batch-process'
  // Edit subcategories
  | 'image-edit'
  | 'document-edit'
  // Analyze subcategories
  | 'file-info'
  | 'text-analysis'
  // Generate subcategories
  | 'create-document'
  | 'create-data';

export interface CategoryInfo {
  id: MainCategory;
  name: string;
  description: string;
  icon: string; // Icon name from lucide-react or similar
  color: string; // Tailwind color class
  subcategories?: SubCategory[];
}

export const categoryDefinitions: Record<MainCategory, CategoryInfo> = {
  convert: {
    id: 'convert',
    name: 'Convert',
    description: 'Transform files from one format to another',
    icon: 'ArrowRightLeft',
    color: 'blue',
    subcategories: [
      'image-to-image',
      'image-to-document',
      'document-to-image',
      'video-to-video',
      'video-to-audio',
      'audio-to-audio',
      'data-format'
    ]
  },
  compress: {
    id: 'compress',
    name: 'Compress',
    description: 'Reduce file size while maintaining quality',
    icon: 'Minimize2',
    color: 'green',
    subcategories: [
      'image-compress',
      'video-compress',
      'document-compress'
    ]
  },
  combine: {
    id: 'combine',
    name: 'Combine',
    description: 'Merge multiple files into one',
    icon: 'Combine',
    color: 'purple',
    subcategories: [
      'merge-files',
      'batch-process'
    ]
  },
  edit: {
    id: 'edit',
    name: 'Edit',
    description: 'Modify and enhance files',
    icon: 'Edit',
    color: 'orange',
    subcategories: [
      'image-edit',
      'document-edit'
    ]
  },
  analyze: {
    id: 'analyze',
    name: 'Analyze',
    description: 'Extract information and insights from files',
    icon: 'BarChart',
    color: 'cyan',
    subcategories: [
      'file-info',
      'text-analysis'
    ]
  },
  generate: {
    id: 'generate',
    name: 'Generate',
    description: 'Create new files and content',
    icon: 'Sparkles',
    color: 'pink',
    subcategories: [
      'create-document',
      'create-data'
    ]
  }
};

// Helper function to determine subcategory based on tool properties
export function getSubcategory(from?: string, to?: string, operation?: string): SubCategory | undefined {
  if (!from || !to) return undefined;
  
  const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic', 'heif', 'avif', 'tiff'];
  const documentFormats = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
  const videoFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'];
  const audioFormats = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'];
  const dataFormats = ['json', 'csv', 'xml', 'yaml', 'sql'];
  
  const fromIsImage = imageFormats.includes(from.toLowerCase());
  const toIsImage = imageFormats.includes(to.toLowerCase());
  const fromIsDoc = documentFormats.includes(from.toLowerCase());
  const toIsDoc = documentFormats.includes(to.toLowerCase());
  const fromIsVideo = videoFormats.includes(from.toLowerCase());
  const toIsVideo = videoFormats.includes(to.toLowerCase());
  const fromIsAudio = audioFormats.includes(from.toLowerCase());
  const toIsAudio = audioFormats.includes(to.toLowerCase());
  const fromIsData = dataFormats.includes(from.toLowerCase());
  const toIsData = dataFormats.includes(to.toLowerCase());
  
  // Determine subcategory
  if (fromIsImage && toIsImage) return 'image-to-image';
  if (fromIsImage && toIsDoc) return 'image-to-document';
  if (fromIsDoc && toIsImage) return 'document-to-image';
  if (fromIsVideo && toIsVideo) return 'video-to-video';
  if (fromIsVideo && toIsAudio) return 'video-to-audio';
  if (fromIsAudio && toIsAudio) return 'audio-to-audio';
  if (fromIsData || toIsData) return 'data-format';
  
  return undefined;
}

// Tool metadata including category information
export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: MainCategory;
  subcategory?: SubCategory;
  from?: string;
  to?: string;
  tags?: string[]; // Additional tags for search/filtering
  priority?: number; // Display priority (higher = more prominent)
  isNew?: boolean; // Flag for newly added tools
  isBeta?: boolean; // Flag for tools in beta
}

// Example usage for categorizing existing tools
export function categorizeTools(tools: any[]): ToolMetadata[] {
  return tools.map(tool => {
    const subcategory = getSubcategory(tool.from, tool.to);
    
    return {
      ...tool,
      subcategory,
      tags: generateTags(tool),
      priority: calculatePriority(tool)
    };
  });
}

function generateTags(tool: any): string[] {
  const tags: string[] = [];
  
  if (tool.from) tags.push(tool.from);
  if (tool.to) tags.push(tool.to);
  
  // Add format type tags
  if (['jpg', 'jpeg', 'png', 'gif'].includes(tool.from?.toLowerCase() || '')) {
    tags.push('image', 'photo');
  }
  if (tool.to === 'pdf' || tool.from === 'pdf') {
    tags.push('document', 'pdf');
  }
  
  return tags;
}

function calculatePriority(tool: any): number {
  // Popular conversions get higher priority
  const popularConversions = [
    'jpg-to-pdf',
    'png-to-jpg',
    'pdf-to-jpg',
    'heic-to-jpg',
    'webp-to-jpg'
  ];
  
  if (popularConversions.includes(tool.id)) {
    return 10;
  }
  
  return 5; // Default priority
}

export default categoryDefinitions;