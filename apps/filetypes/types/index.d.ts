export interface FileTypeRawData {
  // identity
  slug: string;
  extension: string;
  name: string;

  // taxonomy
  category?: string;
  category_slug?: string;

  // summaries / descriptions
  summary?: string;

  // developer (normalized)
  developer_info?: {
    name?: string;
    org?: string;
    url?: string;
  };

  // popularity
  popularity?: {
    rating: number;
    votes: number;
  };

  // long-form info
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

  // open/convert
  how_to_open?: {
    instructions?: string[];
    programs?: Array<{
      name: string;
      url?: string;
      license?: string;
      platform?: string;
    }>;
  };

  programs?: {
    [platform: string]: Array<{
      name: string;
      url?: string;
      license?: string;
    }>;
  };

  how_to_convert?: {
    instructions?: string[];
  };

  // media enrichments
  mime?: string[];              // ["image/heic"]
  containers?: string[];        // ["heif"]
  related?: string[];           // ["heif","avif"]
  magic?: Array<{ hex: string; offset?: number }>;
  support?: {
    browsers?: Record<string, "yes"|"no"|"partial">;
    oses?:     Record<string, "yes"|"no"|"partial">;
    devices?:  Record<string, "yes"|"no"|"partial">;
  };

  // assets
  images?: Array<{
    url: string;
    alt: string;
    caption: string;
  }>;
  common_filenames?: string[];

  // seo
  seo?: {
    title?: string;
    meta_description?: string;
    canonical?: string;
  };

  // bookkeeping
  last_updated?: string;  // ISO 8601
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