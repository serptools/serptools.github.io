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

// Tool content structure (landing page data)
export interface ToolContent {
  tool: {
    title: string;
    subtitle: string;
    from?: string;
    to?: string;
  };
  faqs: FAQ[];
  aboutSection: AboutSection;
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