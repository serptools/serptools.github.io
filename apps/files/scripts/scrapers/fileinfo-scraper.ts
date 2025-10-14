/**
 * Scraper for fileinfo.com
 * 
 * This scraper extracts file type information from fileinfo.com
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
export async function scrapeFileInfo(extension: string, proxyConfig?: ProxyConfig): Promise<ScraperResult> {
  const normalized = normalizeExtension(extension);
  const url = `${FILEINFO_CONFIG.baseUrl}/extension/${normalized}`;
  
  console.log(`Scraping fileinfo.com for .${normalized}...`);
  
  try {
    // Skip rate limiting when using concurrent workers with proxy
    if (!proxyConfig?.useProxy) {
      await applyRateLimit(FILEINFO_CONFIG);
    }
    
    const data = await withRetry(
      async () => await fetchAndParseFileInfo(url, normalized, proxyConfig),
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
 * Fetch and parse data from fileinfo.com using Cheerio
 */
async function fetchAndParseFileInfo(url: string, extension: string, proxyConfig?: ProxyConfig): Promise<ScrapedFileData> {
  const response = await fetchWithProxy(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    signal: AbortSignal.timeout(FILEINFO_CONFIG.timeout)
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
      scraper: 'fileinfo.com'
    }],
    scraped_at: getCurrentTimestamp()
  };
  
  // Extract title/name - fileinfo.com uses h1 with the format ".EXT - File Name"
  const h1Text = $('h1').first().text();
  if (h1Text) {
    // Remove the extension prefix if present
    const nameMatch = h1Text.match(/^\.?[A-Za-z0-9]+\s*[-–]\s*(.+)$/);
    if (nameMatch) {
      data.name = cleanText(nameMatch[1]);
    } else {
      data.name = cleanText(h1Text);
    }
  }
  
  // Extract summary/description from the main info box
  const infoBoxText = $('.infoBox p').first().text();
  if (infoBoxText) {
    data.summary = cleanText(infoBoxText);
  }
  
  // Extract category
  const categoryLink = $('a[href*="/filetypes/"]').first();
  if (categoryLink.length) {
    data.category = cleanText(categoryLink.text());
  }
  
  // Extract developer
  const developerSection = $('td:contains("Developer:")').next('td');
  if (developerSection.length) {
    const developerLink = developerSection.find('a').first();
    if (developerLink.length) {
      data.developer = cleanText(developerLink.text());
      data.developer_name = data.developer;
    }
  }
  
  // Extract rating and votes
  const ratingText = $('.rating').first().text();
  if (ratingText) {
    const rating = parseFloat(ratingText);
    if (!isNaN(rating)) {
      data.rating = rating;
    }
  }
  
  const votesMatch = $('body').text().match(/\(([0-9,]+)\s+votes?\)/i);
  if (votesMatch) {
    data.votes = parseInt(votesMatch[1].replace(/,/g, ''));
  }
  
  // Extract more information sections
  const moreInfoContent: string[] = [];
  $('.moreInfo p').each((_, elem) => {
    const text = cleanText($(elem).text());
    if (text && text.length > 10) {
      moreInfoContent.push(text);
    }
  });
  
  if (moreInfoContent.length > 0) {
    data.more_information = { content: moreInfoContent };
  }
  
  // Extract how to open section
  const howToOpenContent: string[] = [];
  $('section:contains("How to open"), .howToOpen, div:contains("open")').find('p').each((_, elem) => {
    const text = cleanText($(elem).text());
    if (text && text.length > 20) {
      howToOpenContent.push(text);
    }
  });
  
  if (howToOpenContent.length > 0) {
    data.how_to_open = { instructions: howToOpenContent };
  }
  
  // Extract programs
  const programs: Array<{ name: string; url?: string }> = [];
  $('ul li a, .programs a').each((_, elem) => {
    const programName = cleanText($(elem).text());
    const programUrl = $(elem).attr('href');
    
    if (programName && programName.length > 2 && programName.length < 100) {
      programs.push({ 
        name: programName,
        url: programUrl || undefined
      });
    }
  });
  
  if (programs.length > 0 && data.how_to_open) {
    data.how_to_open.programs = programs;
  }
  
  return data;
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
