/**
 * Dual Taxonomy System for Tools
 * 1. Operation Type - What the tool does
 * 2. Media Type - What kind of files it works with
 */

// ============ OPERATION TYPES ============
export type OperationType = 
  | 'convert'    // Transform format
  | 'compress'   // Reduce size
  | 'combine'    // Merge multiple files
  | 'download';  // Download from external sources

// ============ MEDIA TYPES ============
export type MediaType = 
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'text';

// ============ FILE FORMAT MAPPINGS ============
export const formatToMediaType: Record<string, MediaType> = {
  // Image formats
  'jpg': 'image',
  'jpeg': 'image',
  'png': 'image',
  'gif': 'image',
  'webp': 'image',
  'svg': 'image',
  'bmp': 'image',
  'ico': 'image',
  'tiff': 'image',
  'tif': 'image',
  'heic': 'image',
  'heif': 'image',
  'avif': 'image',
  'jfif': 'image',
  'psd': 'image',
  'ai': 'image',
  'eps': 'image',
  'raw': 'image',
  'cr2': 'image',
  'cr3': 'image',
  'nef': 'image',
  'arw': 'image',
  'dng': 'image',
  'orf': 'image',
  
  // Video formats
  'mp4': 'video',
  'mov': 'video',
  'avi': 'video',
  'mkv': 'video',
  'webm': 'video',
  'flv': 'video',
  'wmv': 'video',
  'mpg': 'video',
  'mpeg': 'video',
  'm4v': 'video',
  '3gp': 'video',
  'vob': 'video',
  'mts': 'video',
  'ts': 'video',
  'rmvb': 'video',
  
  // Audio formats
  'mp3': 'audio',
  'wav': 'audio',
  'flac': 'audio',
  'aac': 'audio',
  'ogg': 'audio',
  'wma': 'audio',
  'm4a': 'audio',
  'opus': 'audio',
  'aiff': 'audio',
  'ape': 'audio',
  'alac': 'audio',
  'dts': 'audio',
  'ac3': 'audio',
  'mid': 'audio',
  'midi': 'audio',
  
  // Document formats
  'pdf': 'document',
  'doc': 'document',
  'docx': 'document',
  'txt': 'text',
  'rtf': 'document',
  'odt': 'document',
  'tex': 'document',
  'wpd': 'document',
  
  // Spreadsheet formats (part of document)
  'xls': 'document',
  'xlsx': 'document',
  'csv': 'text',  // CSV is text
  'ods': 'document',
  'xlsm': 'document',
  
  // Presentation formats (part of document)
  'ppt': 'document',
  'pptx': 'document',
  'odp': 'document',
  'key': 'document',
  
  // Ebook formats (part of document)
  'epub': 'document',
  'mobi': 'document',
  'azw': 'document',
  'azw3': 'document',
  'fb2': 'document',
  'lit': 'document',
  
  // Data formats (mapped to text)
  'json': 'text',
  'xml': 'text',
  'yaml': 'text',
  'yml': 'text',
  'toml': 'text',
  'sql': 'text',
  'db': 'text',
  
  // Archive formats (not categorized as they contain mixed content)
  'zip': 'document',
  'rar': 'document',
  '7z': 'document',
  'tar': 'document',
  'gz': 'document',
  'bz2': 'document',
  'xz': 'document',
  
  // Code formats (mapped to text)
  'html': 'text',
  'css': 'text',
  'js': 'text',
  'ts': 'text',
  'jsx': 'text',
  'tsx': 'text',
  'py': 'text',
  'java': 'text',
  'cpp': 'text',
  'c': 'text',
  'h': 'text',
  'sh': 'text',
  
  // Font formats (not typically converted, mapped to document)
  'ttf': 'document',
  'otf': 'document',
  'woff': 'document',
  'woff2': 'document',
  'eot': 'document',
  
  // CAD formats (mapped to document)
  'dwg': 'document',
  'dxf': 'document',
  'stl': 'document',
  'obj': 'document',
  'fbx': 'document',
};

// ============ METADATA DEFINITIONS ============
export interface OperationInfo {
  id: OperationType;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color
}

export interface MediaTypeInfo {
  id: MediaType;
  name: string;
  pluralName: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color
  commonFormats: string[];
}

export const operationDefinitions: Record<OperationType, OperationInfo> = {
  convert: {
    id: 'convert',
    name: 'Convert',
    description: 'Transform files from one format to another',
    icon: 'ArrowRightLeft',
    color: 'blue'
  },
  compress: {
    id: 'compress',
    name: 'Compress',
    description: 'Reduce file size while maintaining quality',
    icon: 'Minimize2',
    color: 'green'
  },
  combine: {
    id: 'combine',
    name: 'Combine',
    description: 'Merge multiple files into one',
    icon: 'Combine',
    color: 'purple'
  },
  download: {
    id: 'download',
    name: 'Download',
    description: 'Download files from external sources',
    icon: 'Download',
    color: 'indigo'
  }
};

export const mediaTypeDefinitions: Record<MediaType, MediaTypeInfo> = {
  image: {
    id: 'image',
    name: 'Image',
    pluralName: 'Images',
    description: 'Photos, graphics, and visual content',
    icon: 'Image',
    color: 'blue',
    commonFormats: ['jpg', 'png', 'gif', 'webp', 'svg']
  },
  video: {
    id: 'video',
    name: 'Video',
    pluralName: 'Videos',
    description: 'Movies, clips, and animated content',
    icon: 'Film',
    color: 'red',
    commonFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm']
  },
  audio: {
    id: 'audio',
    name: 'Audio',
    pluralName: 'Audio',
    description: 'Music, podcasts, and sound files',
    icon: 'Music',
    color: 'purple',
    commonFormats: ['mp3', 'wav', 'flac', 'aac', 'ogg']
  },
  document: {
    id: 'document',
    name: 'Document',
    pluralName: 'Documents',
    description: 'PDFs, Word docs, spreadsheets, presentations',
    icon: 'FileText',
    color: 'gray',
    commonFormats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
  },
  text: {
    id: 'text',
    name: 'Text',
    pluralName: 'Text Files',
    description: 'Plain text, code, and data files',
    icon: 'FileText',
    color: 'neutral',
    commonFormats: ['txt', 'csv', 'json', 'xml', 'html', 'css', 'js']
  }
};

// ============ HELPER FUNCTIONS ============

/**
 * Determine media types based on file formats
 */
export function getMediaTypes(from?: string, to?: string): { source?: MediaType; target?: MediaType } {
  return {
    source: from ? formatToMediaType[from.toLowerCase()] : undefined,
    target: to ? formatToMediaType[to.toLowerCase()] : undefined
  };
}

/**
 * Determine if a conversion crosses media type boundaries
 */
export function isCrossMediaConversion(from: string, to: string): boolean {
  const sourceType = formatToMediaType[from.toLowerCase()];
  const targetType = formatToMediaType[to.toLowerCase()];
  return sourceType !== targetType;
}

/**
 * Get all formats for a specific media type
 */
export function getFormatsForMediaType(mediaType: MediaType): string[] {
  return Object.entries(formatToMediaType)
    .filter(([_, type]) => type === mediaType)
    .map(([format]) => format);
}