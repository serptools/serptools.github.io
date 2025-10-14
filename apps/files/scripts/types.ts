/**
 * Types for the file scraper system
 */

export interface ScraperConfig {
  name: string;
  baseUrl: string;
  rateLimit: number; // ms between requests
  maxRetries: number;
  timeout: number; // ms
}

export interface ScrapedFileData {
  // Core fields
  extension: string;
  name: string;
  summary?: string;
  description?: string;
  
  // Developer/Creator info
  developer?: string;
  developer_org?: string;
  developer_name?: string;
  
  // Categorization
  category?: string;
  category_slug?: string;
  
  // Popularity/Rating
  rating?: number;
  votes?: number;
  popularity?: {
    rating: number;
    votes: number;
    source?: string;
  };
  
  // Content sections
  more_information?: {
    content?: string[];
    description?: string[];
    screenshot?: {
      url: string;
      alt: string;
      caption: string;
    };
  };
  
  technical_info?: {
    content?: string[];
  };
  
  // How-to sections
  how_to_open?: {
    instructions?: string[];
    programs?: Array<{
      name: string;
      url?: string;
      platform?: string;
    }>;
  };
  
  how_to_convert?: {
    instructions?: string[];
  };
  
  // Programs that support this file type
  programs?: {
    [platform: string]: Array<{
      name: string;
      url?: string;
      license?: string;
    }>;
  };
  
  // Media
  images?: Array<{
    url: string;
    alt: string;
    caption: string;
  }>;
  
  // Metadata
  common_filenames?: string[];
  mime_type?: string;
  file_format?: string;
  
  // Source tracking
  sources?: Array<{
    url: string;
    retrieved_at: string;
    scraper: string;
  }>;
  
  scraped_at?: string;
  last_updated?: string;
}

export interface ScraperResult {
  success: boolean;
  data?: ScrapedFileData;
  error?: string;
  source: string;
  extension: string;
}

export interface MergedFileData extends ScrapedFileData {
  slug: string;
  updated_at: string;
  developer_slug?: string;
}
