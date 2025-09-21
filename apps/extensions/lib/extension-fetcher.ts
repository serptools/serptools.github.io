import { ProcessedExtension } from '@/types';

interface ExtensionMetadata {
  name: string;
  description: string;
  version?: string;
  author?: string;
  rating?: number;
  users?: string;
  category?: string;
  topics?: string[];
  tags?: string[];
  iconUrl?: string;
}

/**
 * Extracts Chrome extension ID from various URL formats
 */
export function extractChromeExtensionId(url: string): string | null {
  // Chrome Web Store URL pattern
  const chromeStorePattern = /chrome\.google\.com\/webstore\/detail\/[^\/]+\/([a-z]{32})/i;
  const match = url.match(chromeStorePattern);
  return match ? match[1] : null;
}

/**
 * Fetches extension metadata from Chrome Web Store URL
 * This would need to be called from a server-side API route
 */
export async function fetchChromeExtensionData(url: string): Promise<ExtensionMetadata | null> {
  const extensionId = extractChromeExtensionId(url);
  if (!extensionId) {
    throw new Error('Invalid Chrome Web Store URL');
  }

  // Note: Chrome Web Store doesn't have a public API
  // We'll need to scrape or use a service that provides this data
  // For now, returning a structure that shows what we'd get

  // In production, you'd either:
  // 1. Use a web scraping service
  // 2. Use the Chrome Web Store API (requires OAuth)
  // 3. Use a third-party service that provides this data

  return {
    name: '',
    description: '',
    rating: 0,
    users: '',
    category: '',
    topics: [],
    tags: []
  };
}

/**
 * Analyzes extension data using AI to categorize and tag it
 */
export async function analyzeExtensionWithAI(
  metadata: ExtensionMetadata,
  categories: string[],
  topics: string[]
): Promise<{
  suggestedCategory: string;
  suggestedTopics: string[];
  suggestedTags: string[];
}> {
  // This would call an AI API (OpenAI, Claude, etc.) to:
  // 1. Analyze the extension name and description
  // 2. Suggest the most appropriate category
  // 3. Suggest relevant topics
  // 4. Generate relevant tags

  const prompt = `
    Analyze this browser extension and suggest categorization:

    Name: ${metadata.name}
    Description: ${metadata.description}

    Available categories: ${categories.join(', ')}
    Available topics: ${topics.join(', ')}

    Return:
    1. Most appropriate category (single)
    2. Relevant topics (up to 3)
    3. Search tags (up to 5)
  `;

  // Placeholder for AI response
  return {
    suggestedCategory: 'productivity',
    suggestedTopics: [],
    suggestedTags: []
  };
}

/**
 * Generates a URL-friendly slug from extension name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Main function to process a new extension from URL
 */
export async function processExtensionFromUrl(
  url: string,
  categories: string[],
  topics: string[]
): Promise<Partial<ProcessedExtension>> {
  // 1. Fetch metadata from the store
  const metadata = await fetchChromeExtensionData(url);
  if (!metadata) {
    throw new Error('Could not fetch extension data');
  }

  // 2. Use AI to analyze and categorize
  const aiAnalysis = await analyzeExtensionWithAI(metadata, categories, topics);

  // 3. Generate IDs and slugs
  const slug = generateSlug(metadata.name);
  const id = extractChromeExtensionId(url) || `ext-${Date.now()}`;

  // 4. Return processed extension data
  return {
    id,
    slug,
    name: metadata.name,
    description: metadata.description,
    category: aiAnalysis.suggestedCategory,
    topics: aiAnalysis.suggestedTopics,
    tags: aiAnalysis.suggestedTags,
    chromeStoreUrl: url,
    rating: metadata.rating,
    users: metadata.users,
    isNew: true,
    isPopular: false
  };
}