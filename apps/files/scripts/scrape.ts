#!/usr/bin/env node
/**
 * Main scraper orchestrator
 * 
 * This script coordinates scraping from multiple sources and merges the data
 */

import * as fs from 'fs';
import * as path from 'path';
import { scrapeFileInfo, batchScrapeFileInfo } from './scrapers/fileinfo-scraper';
import { scrapeFilesOrg, batchScrapeFilesOrg } from './scrapers/files-org-scraper';
import { fetchFileFormat, batchFetchFileFormat } from './scrapers/fileformat-api';
import { mergeScrapedData } from './utils/data-merger';
import { normalizeExtension } from './utils/scraper-utils';
import { ScraperResult, MergedFileData } from './types';

interface ScraperOptions {
  extensions?: string[];
  sources?: ('fileinfo' | 'files.org' | 'fileformat')[];
  outputDir?: string;
  updateExisting?: boolean;
  batchSize?: number;
  concurrency?: number;  // Number of parallel workers
  useZyteProxy?: boolean; // Enable Zyte proxy rotation
}

/**
 * Main scraper function
 */
export async function scrapeFileTypes(options: ScraperOptions = {}): Promise<void> {
  const {
    extensions = [],
    sources = ['fileinfo', 'files.org', 'fileformat'],
    outputDir = path.join(process.cwd(), 'public', 'data', 'files', 'individual'),
    updateExisting = false,
    batchSize = 10,
    concurrency = 1,
    useZyteProxy = false
  } = options;
  
  console.log('='.repeat(60));
  console.log('File Type Scraper');
  console.log('='.repeat(60));
  console.log(`Sources: ${sources.join(', ')}`);
  console.log(`Extensions: ${extensions.length > 0 ? extensions.join(', ') : 'all'}`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`Update existing: ${updateExisting}`);
  console.log(`Concurrency: ${concurrency} worker(s)`);
  console.log(`Zyte Proxy: ${useZyteProxy ? 'enabled' : 'disabled'}`);
  console.log('='.repeat(60));
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Get list of extensions to scrape
  let extensionsToScrape: string[];
  
  if (extensions.length > 0) {
    extensionsToScrape = extensions.map(normalizeExtension);
  } else {
    // Load from existing index
    extensionsToScrape = getExistingExtensions(outputDir);
  }
  
  console.log(`Total extensions to process: ${extensionsToScrape.length}`);
  
  // Filter out existing if not updating
  if (!updateExisting) {
    const filtered = extensionsToScrape.filter(ext => {
      const filePath = path.join(outputDir, `${ext}.json`);
      return !fs.existsSync(filePath);
    });
    
    console.log(`Skipping ${extensionsToScrape.length - filtered.length} existing files`);
    extensionsToScrape = filtered;
  }
  
  if (extensionsToScrape.length === 0) {
    console.log('No extensions to scrape. Exiting.');
    return;
  }
  
  // Process in batches
  const batches = createBatches(extensionsToScrape, batchSize);
  
  console.log(`Processing ${batches.length} batches of ~${batchSize} extensions each...`);
  console.log('');
  
  let totalProcessed = 0;
  let totalSuccessful = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Batch ${i + 1}/${batches.length} (${batch.length} extensions)`);
    console.log('='.repeat(60));
    
    const results = await processBatch(batch, sources, concurrency, useZyteProxy);
    
    // Save results
    for (const result of results) {
      if (result.success && result.data) {
        const filePath = path.join(outputDir, `${result.extension}.json`);
        fs.writeFileSync(filePath, JSON.stringify(result.data, null, 2));
        totalSuccessful++;
      }
      totalProcessed++;
    }
    
    console.log(`Batch ${i + 1} complete: ${results.filter(r => r.success).length}/${batch.length} successful`);
    console.log(`Overall progress: ${totalProcessed}/${extensionsToScrape.length} (${totalSuccessful} successful)`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Scraping complete!');
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`Successful: ${totalSuccessful}`);
  console.log(`Failed: ${totalProcessed - totalSuccessful}`);
  console.log('='.repeat(60));
}

/**
 * Process a single extension from all sources
 */
export async function processSingleExtension(
  extension: string,
  sources: ('fileinfo' | 'files.org' | 'fileformat')[],
  useZyteProxy: boolean = false
): Promise<MergedFileData | null> {
  const normalized = normalizeExtension(extension);
  
  console.log(`\nProcessing .${normalized}...`);
  
  // Set proxy configuration globally if Zyte is enabled
  const proxyConfig = useZyteProxy ? {
    useProxy: true,
    apiKey: process.env.ZYTE_API_KEY || ''
  } : undefined;
  
  const results = await Promise.allSettled([
    sources.includes('fileinfo') ? scrapeFileInfo(normalized, proxyConfig) : Promise.resolve(null),
    sources.includes('files.org') ? scrapeFilesOrg(normalized, proxyConfig) : Promise.resolve(null),
    sources.includes('fileformat') ? fetchFileFormat(normalized, proxyConfig) : Promise.resolve(null)
  ]);
  
  // Collect successful results
  const scrapedData = results
    .filter(r => r.status === 'fulfilled' && r.value !== null && r.value.success)
    .map(r => (r as PromiseFulfilledResult<ScraperResult>).value.data!)
    .filter(Boolean);
  
  if (scrapedData.length === 0) {
    console.log(`  ❌ No data collected for .${normalized}`);
    return null;
  }
  
  console.log(`  ✅ Collected data from ${scrapedData.length} source(s)`);
  
  // Merge data from all sources
  const merged = mergeScrapedData(normalized, scrapedData);
  
  return merged;
}

/**
 * Process a batch of extensions with optional concurrency
 */
async function processBatch(
  extensions: string[],
  sources: ('fileinfo' | 'files.org' | 'fileformat')[],
  concurrency: number = 1,
  useZyteProxy: boolean = false
): Promise<Array<{ success: boolean; extension: string; data?: MergedFileData }>> {
  const results: Array<{ success: boolean; extension: string; data?: MergedFileData }> = [];
  
  if (concurrency <= 1) {
    // Sequential processing (original behavior)
    for (const ext of extensions) {
      try {
        const data = await processSingleExtension(ext, sources, useZyteProxy);
        
        if (data) {
          results.push({
            success: true,
            extension: ext,
            data
          });
        } else {
          results.push({
            success: false,
            extension: ext
          });
        }
      } catch (error) {
        console.error(`  ❌ Error processing .${ext}:`, error);
        results.push({
          success: false,
          extension: ext
        });
      }
    }
  } else {
    // Parallel processing with concurrency limit
    console.log(`  ⚡ Processing ${extensions.length} extensions with ${concurrency} concurrent workers...`);
    
    const chunks: string[][] = [];
    for (let i = 0; i < extensions.length; i += concurrency) {
      chunks.push(extensions.slice(i, i + concurrency));
    }
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(ext => processSingleExtension(ext, sources, useZyteProxy))
      );
      
      for (let i = 0; i < chunk.length; i++) {
        const result = chunkResults[i];
        const ext = chunk[i];
        
        if (result.status === 'fulfilled' && result.value) {
          results.push({
            success: true,
            extension: ext,
            data: result.value
          });
        } else {
          const error = result.status === 'rejected' ? result.reason : 'No data collected';
          console.error(`  ❌ Error processing .${ext}:`, error);
          results.push({
            success: false,
            extension: ext
          });
        }
      }
    }
  }
  
  return results;
}

/**
 * Get existing extensions from the output directory
 */
function getExistingExtensions(outputDir: string): string[] {
  if (!fs.existsSync(outputDir)) {
    return [];
  }
  
  const files = fs.readdirSync(outputDir);
  return files
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

/**
 * Create batches from an array
 */
function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  return batches;
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options: ScraperOptions = {
    sources: ['fileinfo', 'files.org', 'fileformat'],
    updateExisting: false,
    batchSize: 10,
    concurrency: 1,
    useZyteProxy: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--extensions' || arg === '-e') {
      options.extensions = args[++i].split(',').map(s => s.trim());
    } else if (arg === '--sources' || arg === '-s') {
      options.sources = args[++i].split(',').map(s => s.trim()) as any;
    } else if (arg === '--output' || arg === '-o') {
      options.outputDir = args[++i];
    } else if (arg === '--update' || arg === '-u') {
      options.updateExisting = true;
    } else if (arg === '--batch-size' || arg === '-b') {
      options.batchSize = parseInt(args[++i], 10);
    } else if (arg === '--concurrency' || arg === '-c') {
      options.concurrency = parseInt(args[++i], 10);
    } else if (arg === '--zyte-proxy' || arg === '-z') {
      options.useZyteProxy = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
File Type Scraper

Usage:
  npm run scrape [options]

Options:
  -e, --extensions <ext1,ext2>  Comma-separated list of extensions to scrape
  -s, --sources <src1,src2>     Sources to use (fileinfo,files.org,fileformat)
  -o, --output <dir>            Output directory for JSON files
  -u, --update                  Update existing files
  -b, --batch-size <n>          Number of extensions per batch (default: 10)
  -c, --concurrency <n>         Number of parallel workers (default: 1, max: 10)
  -z, --zyte-proxy              Enable Zyte rotating proxy (requires ZYTE_API_KEY env var)
  -h, --help                    Show this help message

Examples:
  npm run scrape -e pdf,docx,xlsx
  npm run scrape -s fileinfo,fileformat -u
  npm run scrape -e txt -s fileinfo
  npm run scrape -u -c 5 -z               # Fast A-Z with 5 workers + Zyte proxy
  ZYTE_API_KEY=your_key npm run scrape -u -c 10 -z  # Max speed with proxy
      `);
      process.exit(0);
    }
  }
  
  // Validate and cap concurrency
  if (options.concurrency && options.concurrency > 10) {
    console.warn('⚠️  Concurrency capped at 10 to avoid overwhelming servers');
    options.concurrency = 10;
  }
  
  // Check for Zyte API key if proxy is enabled
  if (options.useZyteProxy && !process.env.ZYTE_API_KEY) {
    console.error('❌ Error: ZYTE_API_KEY environment variable is required when using --zyte-proxy');
    console.log('   Set it with: export ZYTE_API_KEY=your_api_key');
    process.exit(1);
  }
  
  await scrapeFileTypes(options);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
