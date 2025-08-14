import type { Tool, OperationType, MediaType } from '@/types';
import type { OperationDefinitions, MediaTypeDefinitions } from '@/types';
import toolsData from '@/data/tools.json';

// Cast the imported JSON to our Tool type
export const tools = toolsData as Tool[];

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

// Operation type definitions
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

// Media type definitions
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

// Format to media type mapping
export const formatToMediaType: Record<string, MediaType> = {
  // Image formats
  'jpg': 'image',
  'jpeg': 'image',
  'png': 'image',
  'gif': 'image',
  'webp': 'image',
  'svg': 'image',
  'ico': 'image',
  'bmp': 'image',
  'tiff': 'image',
  'tif': 'image',
  'heic': 'image',
  'heif': 'image',
  'avif': 'image',
  'jfif': 'image',
  'pjpeg': 'image',
  'pjp': 'image',
  'apng': 'image',
  'ai': 'image',
  'eps': 'image',
  'ps': 'image',
  'psd': 'image',
  'raw': 'image',
  'arw': 'image',
  'cr2': 'image',
  'cr3': 'image',
  'nrw': 'image',
  'k25': 'image',
  'dng': 'image',
  'nef': 'image',
  
  // Video formats
  'mp4': 'video',
  'avi': 'video',
  'mov': 'video',
  'wmv': 'video',
  'flv': 'video',
  'mkv': 'video',
  'webm': 'video',
  'm4v': 'video',
  'mpg': 'video',
  'mpeg': 'video',
  '3gp': 'video',
  '3g2': 'video',
  'f4v': 'video',
  'f4p': 'video',
  'f4a': 'video',
  'f4b': 'video',
  'vob': 'video',
  'ogv': 'video',
  'ogg': 'video',
  'mts': 'video',
  'm2ts': 'video',
  'ts': 'video',
  'qt': 'video',
  'asf': 'video',
  'rm': 'video',
  'rmvb': 'video',
  'viv': 'video',
  'amv': 'video',
  
  // Audio formats
  'mp3': 'audio',
  'wav': 'audio',
  'flac': 'audio',
  'aac': 'audio',
  'oga': 'audio',
  'wma': 'audio',
  'm4a': 'audio',
  'opus': 'audio',
  'aiff': 'audio',
  'ape': 'audio',
  'alac': 'audio',
  'dsd': 'audio',
  'dsf': 'audio',
  'dff': 'audio',
  'pcm': 'audio',
  'au': 'audio',
  'amr': 'audio',
  'awb': 'audio',
  'ac3': 'audio',
  'ec3': 'audio',
  'mka': 'audio',
  'mpc': 'audio',
  'tta': 'audio',
  'wv': 'audio',
  'shn': 'audio',
  'voc': 'audio',
  'ra': 'audio',
  'gsm': 'audio',
  'dts': 'audio',
  'spx': 'audio',
  'caf': 'audio',
  
  // Document formats
  'pdf': 'document',
  'doc': 'document',
  'docx': 'document',
  'odt': 'document',
  'rtf': 'document',
  'tex': 'document',
  'wpd': 'document',
  'wps': 'document',
  'pages': 'document',
  'xls': 'document',
  'xlsx': 'document',
  'ods': 'document',
  'xlsm': 'document',
  'ppt': 'document',
  'pptx': 'document',
  'odp': 'document',
  'key': 'document',
  'epub': 'document',
  'mobi': 'document',
  'azw': 'document',
  'azw3': 'document',
  'fb2': 'document',
  'lit': 'document',
  'zip': 'document',
  'rar': 'document',
  '7z': 'document',
  'tar': 'document',
  'gz': 'document',
  'bz2': 'document',
  'xz': 'document',
  
  // Text formats
  'txt': 'text',
  'md': 'text',
  'markdown': 'text',
  'csv': 'text',
  'tsv': 'text',
  'json': 'text',
  'xml': 'text',
  'yaml': 'text',
  'yml': 'text',
  'toml': 'text',
  'ini': 'text',
  'cfg': 'text',
  'conf': 'text',
  'log': 'text',
  'sql': 'text',
  'html': 'text',
  'css': 'text',
  'js': 'text',
  'jsx': 'text',
  'tsx': 'text',
  'py': 'text',
  'java': 'text',
  'cpp': 'text',
  'c': 'text',
  'h': 'text',
  'sh': 'text',
  'bash': 'text',
  'zsh': 'text',
  'fish': 'text',
  'ps1': 'text',
  'bat': 'text',
  'cmd': 'text',
  'vbs': 'text',
  'rb': 'text',
  'go': 'text',
  'rs': 'text',
  'php': 'text',
  'pl': 'text',
  'swift': 'text',
  'kt': 'text',
  'scala': 'text',
  'r': 'text',
  'lua': 'text',
  'dart': 'text',
  'vim': 'text',
  'emacs': 'text',
};