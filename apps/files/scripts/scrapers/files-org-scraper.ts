/**
 * Scraper for file.org (files.org)
 * 
 * This scraper extracts file type information from file.org
 */

import { ScraperConfig, ScrapedFileData, ScraperResult } from '../types';
import {
  cleanText,
  extractTextFromHtml,
  normalizeExtension,
  getCurrentTimestamp,
  applyRateLimit,
  withRetry,
  validateScrapedData
} from '../utils/scraper-utils';

const FILES_ORG_CONFIG: ScraperConfig = {
  name: 'file.org',
  baseUrl: 'https://file.org',
  rateLimit: 2000, // 2 seconds between requests
  maxRetries: 3,
  timeout: 10000
};

/**
 * Scrape file type information from file.org
 */
export async function scrapeFilesOrg(extension: string): Promise<ScraperResult> {
  const normalized = normalizeExtension(extension);
  const url = `${FILES_ORG_CONFIG.baseUrl}/extension/${normalized}`;
  
  console.log(`Scraping file.org for .${normalized}...`);
  
  try {
    await applyRateLimit(FILES_ORG_CONFIG);
    
    const data = await withRetry(
      async () => await fetchAndParseFilesOrg(url, normalized),
      FILES_ORG_CONFIG
    );
    
    const validation = validateScrapedData(data);
    if (!validation.valid) {
      console.warn(`Validation warnings for .${normalized}:`, validation.errors);
    }
    
    return {
      success: true,
      data,
      source: 'file.org',
      extension: normalized
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error scraping file.org for .${normalized}:`, errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      source: 'file.org',
      extension: normalized
    };
  }
}

/**
 * Fetch and parse data from file.org
 */
async function fetchAndParseFilesOrg(url: string, extension: string): Promise<ScrapedFileData> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    signal: AbortSignal.timeout(FILES_ORG_CONFIG.timeout)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const html = await response.text();
  
  const data: ScrapedFileData = {
    extension,
    name: '',
    sources: [{
      url,
      retrieved_at: getCurrentTimestamp(),
      scraper: 'file.org'
    }],
    scraped_at: getCurrentTimestamp()
  };
  
  // Extract title/name
  const titleMatch = html.match(/<h1[^>]*>\.([A-Z]+)\s+-\s+([^<]+)<\/h1>/i);
  if (titleMatch) {
    data.name = cleanText(titleMatch[2]);
  } else {
    // Try alternative pattern
    const altTitleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (altTitleMatch) {
      data.name = cleanText(altTitleMatch[1]).replace(/^\./, '').replace(/\s+File$/, ' File');
    }
  }
  
  // Extract description/summary
  const descMatch = html.match(/<div class="extension-description"[^>]*>\s*<p>([^<]+)<\/p>/i);
  if (descMatch) {
    data.summary = cleanText(descMatch[1]);
  } else {
    // Try meta description
    const metaDescMatch = html.match(/<meta name="description" content="([^"]+)"/i);
    if (metaDescMatch) {
      data.summary = cleanText(metaDescMatch[1]);
    }
  }
  
  // Extract category
  const categoryMatch = html.match(/<span class="category"[^>]*>([^<]+)<\/span>/i);
  if (categoryMatch) {
    data.category = cleanText(categoryMatch[1]);
  }
  
  // Extract developer
  const developerMatch = html.match(/Developer:\s*<[^>]*>([^<]+)<\//i);
  if (developerMatch) {
    data.developer = cleanText(developerMatch[1]);
    data.developer_name = data.developer;
  }
  
  // Extract more information sections
  const sections = extractSections(html);
  if (sections.moreInfo.length > 0) {
    data.more_information = {
      content: sections.moreInfo
    };
  }
  
  if (sections.technical.length > 0) {
    data.technical_info = {
      content: sections.technical
    };
  }
  
  // Extract how to open
  if (sections.howToOpen.length > 0) {
    data.how_to_open = {
      instructions: sections.howToOpen
    };
  }
  
  // Extract programs
  const programs = extractPrograms(html);
  if (programs.length > 0 && data.how_to_open) {
    data.how_to_open.programs = programs;
  }
  
  // Extract MIME type
  const mimeMatch = html.match(/MIME Type:\s*<[^>]*>([^<]+)<\//i);
  if (mimeMatch) {
    data.mime_type = cleanText(mimeMatch[1]);
  }
  
  return data;
}

/**
 * Extract different sections from HTML
 */
function extractSections(html: string): {
  moreInfo: string[];
  technical: string[];
  howToOpen: string[];
} {
  const sections = {
    moreInfo: [] as string[],
    technical: [] as string[],
    howToOpen: [] as string[]
  };
  
  // Extract all section content
  const sectionMatches = Array.from(html.matchAll(/<div class="section"[^>]*>\s*<h2>([^<]+)<\/h2>([\s\S]*?)<\/div>/gi));
  
  for (const match of sectionMatches) {
    const title = cleanText(match[1]).toLowerCase();
    const content = extractTextFromHtml(match[2]);
    
    if (!content || content.length < 10) continue;
    
    if (title.includes('what is') || title.includes('about') || title.includes('description')) {
      sections.moreInfo.push(content);
    } else if (title.includes('technical') || title.includes('format') || title.includes('specification')) {
      sections.technical.push(content);
    } else if (title.includes('how to open') || title.includes('programs')) {
      sections.howToOpen.push(content);
    }
  }
  
  // Also extract from paragraphs
  const paragraphs = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
  
  for (const match of paragraphs) {
    const text = extractTextFromHtml(match[1]);
    if (text && text.length > 50 && !sections.moreInfo.includes(text)) {
      sections.moreInfo.push(text);
    }
  }
  
  return sections;
}

/**
 * Extract program names from HTML
 */
function extractPrograms(html: string): Array<{ name: string; url?: string }> {
  const programs: Array<{ name: string; url?: string }> = [];
  const seen = new Set<string>();
  
  // Extract from program lists
  const programMatches = Array.from(html.matchAll(/<li[^>]*>\s*<a href="([^"]*)"[^>]*>([^<]+)<\/a>/gi));
  
  for (const match of programMatches) {
    const name = cleanText(match[2]);
    const url = match[1];
    
    if (name && name.length > 2 && name.length < 100) {
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        programs.push({ name, url: url || undefined });
      }
    }
  }
  
  return programs;
}

/**
 * Batch scrape multiple extensions from file.org
 */
export async function batchScrapeFilesOrg(extensions: string[]): Promise<ScraperResult[]> {
  const results: ScraperResult[] = [];
  
  console.log(`Starting batch scrape of ${extensions.length} extensions from file.org...`);
  
  for (let i = 0; i < extensions.length; i++) {
    const ext = extensions[i];
    console.log(`[${i + 1}/${extensions.length}] Scraping .${ext}...`);
    
    const result = await scrapeFilesOrg(ext);
    results.push(result);
    
    // Show progress
    if ((i + 1) % 10 === 0) {
      const successful = results.filter(r => r.success).length;
      console.log(`Progress: ${i + 1}/${extensions.length} (${successful} successful)`);
    }
  }
  
  const successful = results.filter(r => r.success).length;
  console.log(`Batch scrape complete: ${successful}/${extensions.length} successful`);
  
  return results;
}
