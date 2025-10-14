#!/usr/bin/env node
/**
 * Test and validate scraper functionality
 */

import { processSingleExtension } from './scrape';
import { validateScrapedData } from './utils/scraper-utils';
import { MergedFileData } from './types';

/**
 * Test scraping a single extension
 */
async function testSingleExtension(extension: string): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log(`Testing scraper for .${extension}`);
  console.log('='.repeat(60));
  
  try {
    const result = await processSingleExtension(extension, ['fileinfo', 'files.org', 'fileformat']);
    
    if (!result) {
      console.error('❌ Failed to scrape data');
      return;
    }
    
    console.log('\n✅ Scraped successfully!');
    console.log('\n--- Results ---');
    console.log(`Extension: .${result.extension}`);
    console.log(`Name: ${result.name}`);
    console.log(`Category: ${result.category || 'N/A'}`);
    console.log(`Developer: ${result.developer || 'N/A'}`);
    console.log(`Summary: ${result.summary?.substring(0, 100)}...`);
    console.log(`Sources: ${result.sources?.length || 0}`);
    
    if (result.sources) {
      console.log('\nData sources:');
      for (const source of result.sources) {
        console.log(`  - ${source.scraper} (${source.url})`);
      }
    }
    
    if (result.more_information?.content) {
      console.log(`\nMore information sections: ${result.more_information.content.length}`);
    }
    
    if (result.how_to_open?.programs) {
      console.log(`Programs: ${result.how_to_open.programs.length}`);
    }
    
    if (result.programs) {
      const platforms = Object.keys(result.programs);
      console.log(`Platforms: ${platforms.join(', ')}`);
    }
    
    // Validate
    const validation = validateScrapedData(result);
    if (validation.valid) {
      console.log('\n✅ Data validation passed');
    } else {
      console.log('\n⚠️  Data validation warnings:');
      validation.errors.forEach(err => console.log(`  - ${err}`));
    }
    
    // Show full JSON
    console.log('\n--- Full JSON ---');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Test multiple extensions
 */
async function testMultipleExtensions(extensions: string[]): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log(`Testing scraper for ${extensions.length} extensions`);
  console.log('='.repeat(60));
  
  const results: Array<{ extension: string; success: boolean; error?: string }> = [];
  
  for (const ext of extensions) {
    console.log(`\nTesting .${ext}...`);
    
    try {
      const result = await processSingleExtension(ext, ['fileinfo', 'files.org', 'fileformat']);
      
      if (result) {
        console.log(`  ✅ Success - collected data from ${result.sources?.length || 0} sources`);
        results.push({ extension: ext, success: true });
      } else {
        console.log(`  ❌ Failed - no data collected`);
        results.push({ extension: ext, success: false, error: 'No data collected' });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ Error - ${errorMsg}`);
      results.push({ extension: ext, success: false, error: errorMsg });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${results.length - successful}`);
  
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('\nFailed extensions:');
    failed.forEach(r => {
      console.log(`  - .${r.extension}: ${r.error || 'Unknown error'}`);
    });
  }
}

/**
 * Validate existing data files
 */
async function validateExistingData(directory: string): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('Validating existing data files');
  console.log('='.repeat(60));
  
  const fs = require('fs');
  const path = require('path');
  
  const files = fs.readdirSync(directory).filter((f: string) => f.endsWith('.json'));
  console.log(`Found ${files.length} files to validate`);
  
  let validCount = 0;
  let invalidCount = 0;
  const errors: Array<{ file: string; errors: string[] }> = [];
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      const validation = validateScrapedData(data);
      
      if (validation.valid) {
        validCount++;
      } else {
        invalidCount++;
        errors.push({
          file,
          errors: validation.errors
        });
      }
    } catch (error) {
      invalidCount++;
      errors.push({
        file,
        errors: [`Parse error: ${error}`]
      });
    }
  }
  
  console.log('\n--- Validation Results ---');
  console.log(`Valid: ${validCount}`);
  console.log(`Invalid: ${invalidCount}`);
  
  if (errors.length > 0) {
    console.log('\nValidation errors:');
    errors.slice(0, 10).forEach(e => {
      console.log(`\n${e.file}:`);
      e.errors.forEach(err => console.log(`  - ${err}`));
    });
    
    if (errors.length > 10) {
      console.log(`\n... and ${errors.length - 10} more files with errors`);
    }
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
File Type Scraper Tests

Usage:
  npm run test-scraper <command> [options]

Commands:
  test <ext>              Test scraping a single extension
  test-batch <ext1,ext2>  Test scraping multiple extensions
  validate <directory>    Validate existing data files

Examples:
  npm run test-scraper test pdf
  npm run test-scraper test-batch pdf,docx,xlsx
  npm run test-scraper validate ./public/data/files/individual
    `);
    return;
  }
  
  const command = args[0];
  
  if (command === 'test' && args[1]) {
    await testSingleExtension(args[1]);
  } else if (command === 'test-batch' && args[1]) {
    const extensions = args[1].split(',').map(s => s.trim());
    await testMultipleExtensions(extensions);
  } else if (command === 'validate' && args[1]) {
    await validateExistingData(args[1]);
  } else {
    console.error('Invalid command or missing arguments');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
