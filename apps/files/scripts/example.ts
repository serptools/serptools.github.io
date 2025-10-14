#!/usr/bin/env node
/**
 * Example usage of the scraper system
 * 
 * This demonstrates how to use the scraper programmatically
 */

import { processSingleExtension } from './scrape';
import * as fs from 'fs';
import * as path from 'path';

async function example() {
  console.log('Scraper System Example');
  console.log('='.repeat(60));
  
  // Example 1: Scrape a single extension
  console.log('\nExample 1: Scrape PDF file type information');
  console.log('-'.repeat(60));
  
  const pdfData = await processSingleExtension('pdf', ['fileinfo', 'files.org', 'fileformat']);
  
  if (pdfData) {
    console.log('✅ Successfully scraped PDF information');
    console.log(`   Name: ${pdfData.name}`);
    console.log(`   Category: ${pdfData.category || 'N/A'}`);
    console.log(`   Summary: ${pdfData.summary?.substring(0, 100)}...`);
    console.log(`   Sources: ${pdfData.sources?.length || 0} source(s)`);
    
    // Save to temp file
    const tempPath = path.join('/tmp', 'pdf-example.json');
    fs.writeFileSync(tempPath, JSON.stringify(pdfData, null, 2));
    console.log(`   Saved to: ${tempPath}`);
  } else {
    console.log('❌ Failed to scrape PDF information');
  }
  
  // Example 2: Demonstrate data structure
  console.log('\n\nExample 2: Data Structure');
  console.log('-'.repeat(60));
  console.log('The scraped data includes:');
  console.log('  - Basic info: extension, name, summary, category');
  console.log('  - Developer information');
  console.log('  - Popularity/rating data');
  console.log('  - Detailed descriptions and technical info');
  console.log('  - How to open instructions');
  console.log('  - Programs that support the file type');
  console.log('  - Source URLs and timestamps');
  
  // Example 3: Show data merger in action
  console.log('\n\nExample 3: Data Merging');
  console.log('-'.repeat(60));
  console.log('When multiple sources provide data:');
  console.log('  ✓ Best information from each source is selected');
  console.log('  ✓ Content is deduplicated');
  console.log('  ✓ All sources are tracked');
  console.log('  ✓ Ratings are averaged');
  console.log('  ✓ Programs are combined by platform');
  
  console.log('\n\n' + '='.repeat(60));
  console.log('Example complete!');
  console.log('\nNext steps:');
  console.log('  1. Run: npm run test-scraper test <extension>');
  console.log('  2. Run: npm run scrape -- -e <extensions>');
  console.log('  3. Run: npm run generate-indexes');
  console.log('='.repeat(60));
}

// Run example
example().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
