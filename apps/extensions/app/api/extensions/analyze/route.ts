import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories, getAllTopics } from '@/lib/extensions';

interface AnalyzeRequest {
  url: string;
  name?: string;
  description?: string;
}

/**
 * Extracts extension info from URL
 * Note: Chrome Web Store doesn't allow direct scraping due to CORS
 * In production, you'd need to use:
 * 1. A proxy service
 * 2. Chrome Web Store API with OAuth
 * 3. A third-party API service
 */
async function scrapeExtensionData(url: string) {
  try {
    // Chrome extension IDs are 32 lowercase letters only (a-p)
    // Formats:
    // - https://chrome.google.com/webstore/detail/extension-name/abcdefghijklmnop...
    // - https://chromewebstore.google.com/detail/extension-name/abcdefghijklmnop...
    const urlParts = url.match(/(?:chrome\.google\.com\/webstore|chromewebstore\.google\.com)\/detail\/([^\/]+)\/([a-p]{32})/i);

    if (!urlParts) {
      // Try without the name part
      const altMatch = url.match(/(?:chrome\.google\.com\/webstore|chromewebstore\.google\.com)\/detail\/([a-p]{32})/i);
      if (altMatch) {
        return {
          id: altMatch[1],
          name: 'Chrome Extension',
          description: 'Chrome Web Store Extension',
          url: url
        };
      }

      // Log the URL to see what format we're getting
      console.log('URL format not recognized:', url);

      // Try a more flexible pattern for both domains
      const flexMatch = url.match(/(?:chrome\.google\.com\/webstore|chromewebstore\.google\.com)\/detail\/(?:([^\/]+)\/)?([a-z]+)/i);
      if (flexMatch) {
        const name = flexMatch[1] ?
          flexMatch[1].split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ') :
          'Chrome Extension';

        return {
          id: flexMatch[2],
          name: name,
          description: `Browser extension: ${name}`,
          url: url
        };
      }

      throw new Error('Invalid Chrome Web Store URL format. Expected format: https://chromewebstore.google.com/detail/extension-name/extensionid or https://chrome.google.com/webstore/detail/extension-name/extensionid');
    }

    const extensionSlug = urlParts[1];
    const extensionId = urlParts[2];

    // Convert slug to readable name
    const name = extensionSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return {
      id: extensionId,
      name: name,
      description: `Browser extension: ${name}`,
      url: url
    };
  } catch (error) {
    console.error('Error processing extension URL:', error);
    return null;
  }
}

/**
 * Uses AI to categorize the extension
 * This is where you'd integrate with OpenAI/Claude API
 */
async function categorizeWithAI(
  name: string,
  description: string,
  categories: string[],
  topics: string[]
) {
  // This is a placeholder - in production, you'd call an AI API here
  // For example, using OpenAI:
  /*
  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are an expert at categorizing browser extensions..."
      },
      {
        role: "user",
        content: `Categorize this extension...`
      }
    ]
  });
  */

  // For now, return a mock response showing the structure
  return {
    category: determineCategoryFromKeywords(name, description),
    topics: determineTopicsFromKeywords(name, description, topics),
    tags: generateTags(name, description),
    slug: generateSlug(name)
  };
}

/**
 * Simple keyword-based category determination
 */
function determineCategoryFromKeywords(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();

  const categoryKeywords: Record<string, string[]> = {
    'privacy': ['privacy', 'security', 'vpn', 'block', 'tracker', 'cookie'],
    'productivity': ['productivity', 'task', 'todo', 'time', 'focus', 'organize'],
    'developer': ['developer', 'debug', 'code', 'api', 'json', 'github'],
    'shopping': ['shopping', 'price', 'coupon', 'deal', 'discount', 'amazon'],
    'social': ['social', 'twitter', 'facebook', 'instagram', 'linkedin'],
    'entertainment': ['video', 'music', 'youtube', 'netflix', 'game'],
    'education': ['learn', 'study', 'course', 'tutorial', 'education'],
    'communication': ['chat', 'email', 'message', 'call', 'meeting'],
    'tools': ['tool', 'utility', 'converter', 'calculator', 'translator']
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }

  return 'other';
}

/**
 * Determine relevant topics from keywords
 */
function determineTopicsFromKeywords(name: string, description: string, availableTopics: string[]): string[] {
  const text = `${name} ${description}`.toLowerCase();
  const matchedTopics: string[] = [];

  const topicKeywords: Record<string, string[]> = {
    'screenshot-tool': ['screenshot', 'capture', 'screen'],
    'password-generator': ['password', 'secure', 'generate'],
    'color-picker': ['color', 'picker', 'palette', 'eyedropper'],
    'ad-blocker': ['ad', 'block', 'advertising'],
    'video-downloader': ['download', 'video', 'save'],
    'grammar-checker': ['grammar', 'spelling', 'writing'],
    'tab-manager': ['tab', 'manage', 'organize'],
    'translation-tool': ['translate', 'translation', 'language'],
    'pdf-reader': ['pdf', 'document', 'reader'],
    'clipboard-history': ['clipboard', 'copy', 'paste'],
    'volume-booster': ['volume', 'audio', 'sound', 'boost'],
    'dark': ['dark', 'night', 'theme', 'mode'],
    'note-taking': ['note', 'memo', 'writing']
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      matchedTopics.push(topic);
      if (matchedTopics.length >= 3) break; // Limit to 3 topics
    }
  }

  return matchedTopics;
}

/**
 * Generate search tags from name and description
 */
function generateTags(name: string, description: string): string[] {
  const text = `${name} ${description}`.toLowerCase();
  const words = text.split(/\s+/);

  // Filter out common words and return unique meaningful words
  const stopWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'for', 'to', 'in', 'of', 'with'];
  const tags = words
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .filter((word, index, self) => self.indexOf(word) === index) // unique only
    .slice(0, 5);

  return tags;
}

/**
 * Generate URL-friendly slug
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { url, name: providedName, description: providedDescription } = body;

    if (!url && (!providedName || !providedDescription)) {
      return NextResponse.json(
        { error: 'Either URL or name+description must be provided' },
        { status: 400 }
      );
    }

    let extensionData;

    if (url) {
      // Try to extract data from URL
      extensionData = await scrapeExtensionData(url);
      if (!extensionData) {
        return NextResponse.json(
          { error: 'Invalid Chrome Web Store URL format. Expected: https://chrome.google.com/webstore/detail/extension-name/extensionid' },
          { status: 400 }
        );
      }
    } else {
      // Use provided data
      extensionData = {
        id: `manual-${Date.now()}`,
        name: providedName!,
        description: providedDescription!,
        url: null
      };
    }

    // Get available categories and topics
    const categories = getAllCategories().map(c => c.id);
    const topics = getAllTopics().map(t => t.id);

    // Analyze with AI (or keyword matching for now)
    const analysis = await categorizeWithAI(
      extensionData.name,
      extensionData.description,
      categories,
      topics
    );

    // Return the analyzed data
    return NextResponse.json({
      id: extensionData.id,
      slug: analysis.slug,
      name: extensionData.name,
      description: extensionData.description,
      category: analysis.category,
      topics: analysis.topics,
      tags: analysis.tags,
      chromeStoreUrl: url || null,
      isActive: true,
      isNew: true,
      isPopular: false
    });

  } catch (error) {
    console.error('Error analyzing extension:', error);
    return NextResponse.json(
      { error: 'Failed to analyze extension' },
      { status: 500 }
    );
  }
}