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
    // Use Zyte Smart Proxy Manager
    const proxyUrl = `http://${proxyConfig.apiKey}:@proxy.zyte.com:8011`;
    
    // For Node.js fetch with proxy, we need to use a proxy agent
    // Since we're using native fetch, we'll use Zyte API instead
    const zyteResponse = await fetch('https://api.zyte.com/v1/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(proxyConfig.apiKey + ':').toString('base64')}`
      },
      body: JSON.stringify({
        url: url,
        httpResponseBody: true,
        httpResponseHeaders: true
      })
    });
    
    if (!zyteResponse.ok) {
      // Fallback to direct request if Zyte fails
      console.warn('Zyte API failed, falling back to direct request');
      return fetch(url, options);
    }
    
    const zyteData = await zyteResponse.json();
    const htmlContent = Buffer.from(zyteData.httpResponseBody, 'base64').toString('utf-8');
    
    // Create a mock Response object
    return new Response(htmlContent, {
      status: zyteData.statusCode || 200,
      statusText: 'OK',
      headers: zyteData.httpResponseHeaders || {}
    });
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
