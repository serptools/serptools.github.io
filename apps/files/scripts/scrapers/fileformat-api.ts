/**
 * Client for fileformat.com API
 * 
 * This client interacts with the fileformat.com API to get file type information
 */

import { ScraperConfig, ScrapedFileData, ScraperResult } from '../types';
import {
  cleanText,
  normalizeExtension,
  getCurrentTimestamp,
  applyRateLimit,
  withRetry,
  validateScrapedData
} from '../utils/scraper-utils';

const FILEFORMAT_CONFIG: ScraperConfig = {
  name: 'fileformat.com',
  baseUrl: 'https://api.fileformat.com',
  rateLimit: 1000, // 1 second between requests (API might have rate limits)
  maxRetries: 3,
  timeout: 10000
};

/**
 * Fetch file type information from fileformat.com API
 */
export async function fetchFileFormat(extension: string): Promise<ScraperResult> {
  const normalized = normalizeExtension(extension);
  
  console.log(`Fetching fileformat.com API for .${normalized}...`);
  
  try {
    await applyRateLimit(FILEFORMAT_CONFIG);
    
    const data = await withRetry(
      async () => await callFileFormatApi(normalized),
      FILEFORMAT_CONFIG
    );
    
    const validation = validateScrapedData(data);
    if (!validation.valid) {
      console.warn(`Validation warnings for .${normalized}:`, validation.errors);
    }
    
    return {
      success: true,
      data,
      source: 'fileformat.com',
      extension: normalized
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching fileformat.com API for .${normalized}:`, errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      source: 'fileformat.com',
      extension: normalized
    };
  }
}

/**
 * Call the fileformat.com API
 * 
 * Note: The actual API endpoint structure may vary. This is a placeholder
 * that shows the expected structure. You may need to adjust based on the
 * actual API documentation.
 */
async function callFileFormatApi(extension: string): Promise<ScrapedFileData> {
  // Try the API endpoint
  // The actual endpoint might be different - common patterns:
  // - https://api.fileformat.com/v1/format/{extension}
  // - https://fileformat.com/api/extension/{extension}
  // - https://www.fileformat.com/api/v1/file-extension/{extension}
  
  const endpoints = [
    `https://www.fileformat.com/api/v1/file-extension/${extension}`,
    `https://fileformat.com/api/extension/${extension}`,
    `${FILEFORMAT_CONFIG.baseUrl}/v1/format/${extension}`
  ];
  
  let lastError: Error | null = null;
  
  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(FILEFORMAT_CONFIG.timeout)
      });
      
      if (response.ok) {
        const json = await response.json();
        return parseFileFormatResponse(json, extension, url);
      }
      
      // If 404, try next endpoint
      if (response.status === 404) {
        continue;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }
  
  // If API doesn't work, try scraping the website
  console.log(`API endpoints failed, trying web scraping for .${extension}...`);
  return await scrapeFileFormatWebsite(extension);
}

/**
 * Parse the API response from fileformat.com
 */
function parseFileFormatResponse(json: any, extension: string, url: string): ScrapedFileData {
  const data: ScrapedFileData = {
    extension,
    name: cleanText(json.name || json.title || json.fullName || ''),
    summary: cleanText(json.description || json.summary || ''),
    sources: [{
      url,
      retrieved_at: getCurrentTimestamp(),
      scraper: 'fileformat.com-api'
    }],
    scraped_at: getCurrentTimestamp()
  };
  
  // Extract category
  if (json.category) {
    data.category = cleanText(json.category);
  }
  
  // Extract developer/creator
  if (json.developer || json.creator || json.company) {
    data.developer = cleanText(json.developer || json.creator || json.company);
    data.developer_name = data.developer;
  }
  
  // Extract MIME type
  if (json.mimeType || json.mime_type) {
    data.mime_type = cleanText(json.mimeType || json.mime_type);
  }
  
  // Extract technical information
  if (json.technicalInfo || json.specifications) {
    const techInfo = json.technicalInfo || json.specifications;
    data.technical_info = {
      content: Array.isArray(techInfo) ? techInfo : [String(techInfo)]
    };
  }
  
  // Extract programs/applications
  if (json.programs || json.applications || json.software) {
    const programsList = json.programs || json.applications || json.software;
    
    if (Array.isArray(programsList)) {
      data.programs = {};
      
      for (const program of programsList) {
        const platform = program.platform || program.os || 'cross-platform';
        
        if (!data.programs[platform]) {
          data.programs[platform] = [];
        }
        
        data.programs[platform].push({
          name: cleanText(program.name || program.title),
          url: program.url,
          license: program.license
        });
      }
    }
  }
  
  return data;
}

/**
 * Scrape fileformat.com website as fallback
 */
async function scrapeFileFormatWebsite(extension: string): Promise<ScrapedFileData> {
  const url = `https://docs.fileformat.com/extension/${extension}/`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    signal: AbortSignal.timeout(FILEFORMAT_CONFIG.timeout)
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
      scraper: 'fileformat.com-web'
    }],
    scraped_at: getCurrentTimestamp()
  };
  
  // Extract title
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (titleMatch) {
    data.name = cleanText(titleMatch[1]).replace(/^\./, '').replace(/\s+File$/, ' File');
  }
  
  // Extract description from meta tag
  const metaDescMatch = html.match(/<meta name="description" content="([^"]+)"/i);
  if (metaDescMatch) {
    data.summary = cleanText(metaDescMatch[1]);
  }
  
  // Extract category
  const categoryMatch = html.match(/<span class="category"[^>]*>([^<]+)<\/span>/i);
  if (categoryMatch) {
    data.category = cleanText(categoryMatch[1]);
  }
  
  // Extract main content
  const contentMatch = html.match(/<div class="content"[^>]*>([\s\S]*?)<\/div>/i);
  if (contentMatch) {
    const paragraphs = Array.from(contentMatch[1].matchAll(/<p[^>]*>([^<]+)<\/p>/gi));
    const content: string[] = [];
    
    for (const match of paragraphs) {
      const text = cleanText(match[1]);
      if (text && text.length > 20) {
        content.push(text);
      }
    }
    
    if (content.length > 0) {
      data.more_information = { content };
    }
  }
  
  return data;
}

/**
 * Batch fetch multiple extensions from fileformat.com
 */
export async function batchFetchFileFormat(extensions: string[]): Promise<ScraperResult[]> {
  const results: ScraperResult[] = [];
  
  console.log(`Starting batch fetch of ${extensions.length} extensions from fileformat.com...`);
  
  for (let i = 0; i < extensions.length; i++) {
    const ext = extensions[i];
    console.log(`[${i + 1}/${extensions.length}] Fetching .${ext}...`);
    
    const result = await fetchFileFormat(ext);
    results.push(result);
    
    // Show progress
    if ((i + 1) % 10 === 0) {
      const successful = results.filter(r => r.success).length;
      console.log(`Progress: ${i + 1}/${extensions.length} (${successful} successful)`);
    }
  }
  
  const successful = results.filter(r => r.success).length;
  console.log(`Batch fetch complete: ${successful}/${extensions.length} successful`);
  
  return results;
}
