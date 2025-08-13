// Actual filetype data structure (what's in the JSON files)
export interface FileTypeRawData {
  slug: string;
  extension: string;
  name: string;
  category?: string;
  category_slug?: string;
  summary?: string;
  developer?: string;
  developer_org?: string;
  developer_name?: string;
  developer_slug?: string;
  popularity?: {
    rating: number;
    votes: number;
  };
  more_information?: {
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
  how_to_open?: {
    instructions?: string[];
    programs?: Array<{
      name: string;
      url?: string;
    }>;
  };
  programs?: {
    [platform: string]: Array<{
      name: string;
      url?: string;
      license?: string;
    }>;
  };
  images?: Array<{
    url: string;
    alt: string;
    caption: string;
  }>;
  updated_at?: string;
  sources?: Array<{
    url: string;
    retrieved_at: string;
  }>;
}

// What the FileTypePageTemplate expects
export interface FileTypeTemplateData {
  extension: string;
  name: string;
  title: string;
  description: string;
  summary: string;
  category?: string;
  categorySlug?: string;
  developer?: string;
  popularity?: {
    rating: number;
    votes: number;
  };
  image: {
    icon?: string;
    screenshot?: string;
    screenshotCaption?: string;
  };
  whatIs: string;
  moreInfo: string;
  howToOpen: string;
  programsThatOpen: Record<string, Array<{
    name: string;
    license?: string;
    url?: string;
  }>>;
  additionalSections: Array<{
    title: string;
    content: string;
  }>;
  relevantTools: Array<{
    category: string;
    description: string;
    tools: Array<{
      title: string;
      href: string;
      description: string;
    }>;
  }>;
  lastUpdated: string;
}