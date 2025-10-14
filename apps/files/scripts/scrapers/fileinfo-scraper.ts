/**
 * Scraper for fileinfo.com
 * 
 * This scraper extracts file type information from fileinfo.com
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

const FILEINFO_CONFIG: ScraperConfig = {
  name: 'fileinfo.com',
  baseUrl: 'https://fileinfo.com',
  rateLimit: 2000, // 2 seconds between requests
  maxRetries: 3,
  timeout: 10000
};

/**
 * Scrape file type information from fileinfo.com
 */
export async function scrapeFileInfo(extension: string): Promise<ScraperResult> {
  const normalized = normalizeExtension(extension);
  const url = `${FILEINFO_CONFIG.baseUrl}/extension/${normalized}`;
  
  console.log(`Scraping fileinfo.com for .${normalized}...`);
  
  try {
    await applyRateLimit(FILEINFO_CONFIG);
    
    const data = await withRetry(
      async () => await fetchAndParseFileInfo(url, normalized),
      FILEINFO_CONFIG
    );
    
    const validation = validateScrapedData(data);
    if (!validation.valid) {
      console.warn(`Validation warnings for .${normalized}:`, validation.errors);
    }
    
    return {
      success: true,
      data,
      source: 'fileinfo.com',
      extension: normalized
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error scraping fileinfo.com for .${normalized}:`, errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      source: 'fileinfo.com',
      extension: normalized
    };
  }
}

/**
 * Fetch and parse data from fileinfo.com
 */
async function fetchAndParseFileInfo(url: string, extension: string): Promise<ScrapedFileData> {
  // Note: In a real implementation, this would use fetch() or axios
  // For now, we'll create a placeholder that shows the structure
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    signal: AbortSignal.timeout(FILEINFO_CONFIG.timeout)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const html = await response.text();
  
  // Parse the HTML (this would use cheerio or similar in real implementation)
  // For now, we'll use regex patterns to extract information
  
  const data: ScrapedFileData = {
    extension,
    name: '',
    sources: [{
      url,
      retrieved_at: getCurrentTimestamp(),
      scraper: 'fileinfo.com'
    }],
    scraped_at: getCurrentTimestamp()
  };
  
  // Extract title/name
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (titleMatch) {
    data.name = cleanText(titleMatch[1]).replace(/^\./, '').replace(/\s+File$/, ' File');
  }
  
  // Extract summary/description
  const summaryMatch = html.match(/<div class="infoBox"[^>]*>\s*<p>([^<]+)<\/p>/i);
  if (summaryMatch) {
    data.summary = cleanText(summaryMatch[1]);
  }
  
  // Extract category
  const categoryMatch = html.match(/<a href="\/filetypes\/[^"]+">([^<]+)<\/a>/i);
  if (categoryMatch) {
    data.category = cleanText(categoryMatch[1]);
  }
  
  // Extract developer
  const developerMatch = html.match(/Developer:<\/strong>\s*<a[^>]*>([^<]+)<\/a>/i);
  if (developerMatch) {
    data.developer = cleanText(developerMatch[1]);
    data.developer_name = data.developer;
  }
  
  // Extract rating and votes
  const ratingMatch = html.match(/class="rating"[^>]*>([0-9.]+)<\/span>/i);
  const votesMatch = html.match(/\(([0-9,]+)\s+votes?\)/i);
  
  if (ratingMatch) {
    data.rating = parseFloat(ratingMatch[1]);
  }
  
  if (votesMatch) {
    data.votes = parseInt(votesMatch[1].replace(/,/g, ''));
  }
  
  // Extract more information sections
  const moreInfoMatch = html.match(/<div class="moreInfo"[^>]*>([\s\S]*?)<\/div>/i);
  if (moreInfoMatch) {
    const content = extractContentSections(moreInfoMatch[1]);
    if (content.length > 0) {
      data.more_information = {
        content
      };
    }
  }
  
  // Extract how to open section
  const howToOpenMatch = html.match(/<div class="howToOpen"[^>]*>([\s\S]*?)<\/div>/i);
  if (howToOpenMatch) {
    const instructions = extractContentSections(howToOpenMatch[1]);
    if (instructions.length > 0) {
      data.how_to_open = {
        instructions
      };
    }
  }
  
  // Extract programs
  const programsMatch = Array.from(html.matchAll(/<li[^>]*>\s*<a[^>]*>([^<]+)<\/a>/gi));
  const programs: Array<{ name: string; url?: string }> = [];
  
  for (const match of programsMatch) {
    const programName = cleanText(match[1]);
    if (programName && programName.length > 2) {
      programs.push({ name: programName });
    }
  }
  
  if (programs.length > 0 && data.how_to_open) {
    data.how_to_open.programs = programs;
  }
  
  return data;
}

/**
 * Extract content sections from HTML
 */
function extractContentSections(html: string): string[] {
  const sections: string[] = [];
  
  // Extract paragraphs
  const paragraphMatches = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
  
  for (const match of paragraphMatches) {
    const text = extractTextFromHtml(match[1]);
    if (text && text.length > 10) {
      sections.push(text);
    }
  }
  
  return sections;
}

/**
 * Batch scrape multiple extensions from fileinfo.com
 */
export async function batchScrapeFileInfo(extensions: string[]): Promise<ScraperResult[]> {
  const results: ScraperResult[] = [];
  
  console.log(`Starting batch scrape of ${extensions.length} extensions from fileinfo.com...`);
  
  for (let i = 0; i < extensions.length; i++) {
    const ext = extensions[i];
    console.log(`[${i + 1}/${extensions.length}] Scraping .${ext}...`);
    
    const result = await scrapeFileInfo(ext);
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
