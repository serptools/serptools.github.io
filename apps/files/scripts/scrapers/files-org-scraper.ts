/**
 * Scraper for file.org (files.org)
 * 
 * This scraper extracts file type information from file.org
 */

import * as cheerio from 'cheerio';
import { ScraperConfig, ScrapedFileData, ScraperResult } from '../types';
import {
  cleanText,
  normalizeExtension,
  getCurrentTimestamp,
  applyRateLimit,
  withRetry,
  validateScrapedData,
  fetchWithProxy,
  ProxyConfig
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
export async function scrapeFilesOrg(extension: string, proxyConfig?: ProxyConfig): Promise<ScraperResult> {
  const normalized = normalizeExtension(extension);
  const url = `${FILES_ORG_CONFIG.baseUrl}/extension/${normalized}`;
  
  console.log(`Scraping file.org for .${normalized}...`);
  
  try {
    // Skip rate limiting when using concurrent workers with proxy
    if (!proxyConfig?.useProxy) {
      await applyRateLimit(FILES_ORG_CONFIG);
    }
    
    const data = await withRetry(
      async () => await fetchAndParseFilesOrg(url, normalized, proxyConfig),
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
 * Fetch and parse data from file.org using Cheerio
 */
async function fetchAndParseFilesOrg(url: string, extension: string, proxyConfig?: ProxyConfig): Promise<ScrapedFileData> {
  const response = await fetchWithProxy(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    signal: AbortSignal.timeout(FILES_ORG_CONFIG.timeout)
  }, proxyConfig);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
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
  const h1Text = $('h1').first().text();
  if (h1Text) {
    // file.org typically uses format ".EXT - File Name"
    const nameMatch = h1Text.match(/^\.?[A-Z]+\s*[-–]\s*(.+)$/i);
    if (nameMatch) {
      data.name = cleanText(nameMatch[1]);
    } else {
      data.name = cleanText(h1Text).replace(/^\./, '').replace(/\s+File$/, ' File');
    }
  }
  
  // Extract description/summary
  const descText = $('.extension-description p').first().text();
  if (descText) {
    data.summary = cleanText(descText);
  } else {
    // Try meta description as fallback
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc) {
      data.summary = cleanText(metaDesc);
    }
  }
  
  // Extract category
  const categoryText = $('.category').first().text();
  if (categoryText) {
    data.category = cleanText(categoryText);
  }
  
  // Extract developer
  const developerMatch = $('body:contains("Developer:")').text().match(/Developer:\s*([^\n]+)/i);
  if (developerMatch) {
    data.developer = cleanText(developerMatch[1]);
    data.developer_name = data.developer;
  }
  
  // Extract more information sections
  const moreInfoContent: string[] = [];
  const technicalContent: string[] = [];
  const howToOpenContent: string[] = [];
  
  // Look for section headers and content
  $('h2, h3').each((_, elem) => {
    const heading = cleanText($(elem).text()).toLowerCase();
    const contentElem = $(elem).next();
    
    if (contentElem.is('p') || contentElem.is('div')) {
      const text = cleanText(contentElem.text());
      if (text && text.length > 20) {
        if (heading.includes('what is') || heading.includes('about') || heading.includes('description')) {
          moreInfoContent.push(text);
        } else if (heading.includes('technical') || heading.includes('format') || heading.includes('specification')) {
          technicalContent.push(text);
        } else if (heading.includes('how to open') || heading.includes('programs')) {
          howToOpenContent.push(text);
        }
      }
    }
  });
  
  // Also extract from all paragraphs as fallback
  $('p').each((_, elem) => {
    const text = cleanText($(elem).text());
    if (text && text.length > 50 && !moreInfoContent.includes(text)) {
      moreInfoContent.push(text);
    }
  });
  
  if (moreInfoContent.length > 0) {
    data.more_information = { content: moreInfoContent };
  }
  
  if (technicalContent.length > 0) {
    data.technical_info = { content: technicalContent };
  }
  
  if (howToOpenContent.length > 0) {
    data.how_to_open = { instructions: howToOpenContent };
  }
  
  // Extract programs
  const programs: Array<{ name: string; url?: string }> = [];
  const seen = new Set<string>();
  
  $('li a').each((_, elem) => {
    const name = cleanText($(elem).text());
    const url = $(elem).attr('href');
    
    if (name && name.length > 2 && name.length < 100) {
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        programs.push({ name, url: url || undefined });
      }
    }
  });
  
  if (programs.length > 0 && data.how_to_open) {
    data.how_to_open.programs = programs;
  }
  
  // Extract MIME type
  const mimeMatch = $('body:contains("MIME Type:")').text().match(/MIME Type:\s*([^\n]+)/i);
  if (mimeMatch) {
    data.mime_type = cleanText(mimeMatch[1]);
  }
  
  return data;
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
