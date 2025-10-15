/**
 * Utility functions for scrapers
 */

import { ScraperConfig } from '../types';

export interface ProxyConfig {
  useProxy: boolean;
  apiKey?: string;
}

/**
 * Make HTTP request with optional Zyte proxy
 */
export async function fetchWithProxy(
  url: string,
  options: RequestInit = {},
  proxyConfig?: ProxyConfig
): Promise<Response> {
  if (proxyConfig?.useProxy && proxyConfig.apiKey) {
    try {
      // Use Zyte API Automatic Extraction
      // Documentation: https://docs.zyte.com/zyte-api/usage/extract.html
      const zyteResponse = await fetch('https://api.zyte.com/v1/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(proxyConfig.apiKey + ':').toString('base64')}`
        },
        body: JSON.stringify({
          url: url,
          httpResponseBody: true,
          httpResponseHeaders: true,
          // Use browser rendering for better compatibility
          browserHtml: true,
          // Add custom headers if provided
          customHttpRequestHeaders: options.headers ? 
            Object.entries(options.headers).map(([name, value]) => ({ name, value: String(value) })) : 
            undefined
        }),
        signal: options.signal
      });
      
      if (!zyteResponse.ok) {
        const errorText = await zyteResponse.text();
        console.warn(`Zyte API error (${zyteResponse.status}): ${errorText.slice(0, 200)}`);
        console.warn('Falling back to direct request');
        return fetch(url, options);
      }
      
      const zyteData = await zyteResponse.json();
      
      // Extract HTML content - check both browserHtml and httpResponseBody
      let htmlContent = '';
      if (zyteData.browserHtml) {
        htmlContent = zyteData.browserHtml;
      } else if (zyteData.httpResponseBody) {
        htmlContent = Buffer.from(zyteData.httpResponseBody, 'base64').toString('utf-8');
      } else {
        throw new Error('No content in Zyte response');
      }
      
      // Create a Response object with the extracted content
      return new Response(htmlContent, {
        status: zyteData.statusCode || 200,
        statusText: 'OK',
        headers: new Headers(zyteData.httpResponseHeaders || {})
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`Zyte proxy error: ${errorMsg}, falling back to direct request`);
      return fetch(url, options);
    }
  }
  
  // Direct request without proxy
  return fetch(url, options);
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Apply rate limiting between requests
 */
export async function applyRateLimit(config: ScraperConfig): Promise<void> {
  await sleep(config.rateLimit);
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: ScraperConfig,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (attempt >= config.maxRetries) {
      throw error;
    }
    
    const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
    console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${backoffMs}ms...`);
    await sleep(backoffMs);
    
    return withRetry(fn, config, attempt + 1);
  }
}

/**
 * Clean and normalize text
 */
export function cleanText(text: string | undefined | null): string {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .replace(/[\r\t]/g, '');
}

/**
 * Extract text content from HTML
 */
export function extractTextFromHtml(html: string | undefined | null): string {
  if (!html) return '';
  
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
  
  return cleanText(text);
}

/**
 * Create a slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalize file extension (remove dot, lowercase)
 */
export function normalizeExtension(ext: string): string {
  return ext.replace(/^\./, '').toLowerCase().trim();
}

/**
 * Parse programs from text
 */
export function parsePrograms(text: string): Array<{ name: string; url?: string }> {
  const programs: Array<{ name: string; url?: string }> = [];
  
  // Try to extract program names (simplified parsing)
  const lines = text.split(/\n|,|;/);
  
  for (const line of lines) {
    const cleaned = cleanText(line);
    if (cleaned && cleaned.length > 2 && cleaned.length < 100) {
      programs.push({ name: cleaned });
    }
  }
  
  return programs;
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Validate scraped data
 */
export function validateScrapedData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.extension) {
    errors.push('Missing required field: extension');
  }
  
  if (!data.name) {
    errors.push('Missing required field: name');
  }
  
  if (!data.summary && !data.description) {
    errors.push('Missing both summary and description');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format current timestamp for metadata
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
