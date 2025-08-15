// Tool operation types - what the tool does
export type OperationType = 
  | 'convert'    // Transform from one format to another
  | 'compress'   // Reduce file size
  | 'combine'    // Merge multiple files
  | 'download';  // Download from external sources

// Media types - what kind of content the tool works with
export type MediaType =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'text';

// FAQ item structure
export interface FAQ {
  question: string;
  answer: string;
}

// Related tool structure
export interface RelatedTool {
  href: string;
  title: string;
  description: string;
}

// About section structure
export interface AboutSection {
  title: string;
  content: string;
  features?: string[];
  relatedTools?: RelatedTool[];
}

// Tool info for page templates
export interface ToolInfo {
  title: string;
  subtitle: string;
  from: string;
  to: string;
  accept?: string;
}

// Video section data
export interface VideoSectionData {
  embedId?: string;
}

// Format info for about section
export interface FormatInfo {
  name: string;
  fullName: string;
  description: string;
  details?: string[];
}

// About formats section
export interface AboutFormatsSection {
  title?: string;
  fromFormat: FormatInfo;
  toFormat: FormatInfo;
}

// Changelog entry
export interface ChangelogEntry {
  date: string;
  changes: string[];
}

// Blog post
export interface BlogPost {
  title: string;
  subtitle?: string;
  description?: string;
  href: string;
  category?: string;
}

// Tool content structure (landing page data)
export interface ToolContent {
  tool: ToolInfo;
  videoSection?: VideoSectionData;
  faqs: FAQ[];
  aboutSection: AboutFormatsSection;
  changelog?: ChangelogEntry[];
  relatedTools?: RelatedTool[];
  blogPosts?: BlogPost[];
}

// Main tool interface
export interface Tool {
  id: string;
  name: string;
  description: string;
  
  // Taxonomy
  operation: OperationType;
  
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
  
  // Landing page content
  content?: ToolContent;
}

// Format to media type mapping
export interface FormatMediaMapping {
  [format: string]: MediaType;
}