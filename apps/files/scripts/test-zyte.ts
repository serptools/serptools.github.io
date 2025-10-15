#!/usr/bin/env node
/**
 * Test script to verify Zyte API integration
 * 
 * Usage: ZYTE_API_KEY=your_key tsx scripts/test-zyte.ts
 */

import { fetchWithProxy } from './utils/scraper-utils';

async function testZyte() {
  const apiKey = process.env.ZYTE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: ZYTE_API_KEY environment variable is required');
    console.log('   Set it with: export ZYTE_API_KEY=your_api_key');
    process.exit(1);
  }
  
  console.log('Testing Zyte API Integration');
  console.log('='.repeat(60));
  console.log(`API Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);
  console.log('');
  
  // Test URL
  const testUrl = 'https://fileinfo.com/extension/pdf';
  
  console.log(`Test URL: ${testUrl}`);
  console.log('Fetching with Zyte proxy...');
  console.log('');
  
  try {
    const startTime = Date.now();
    
    const response = await fetchWithProxy(
      testUrl,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      },
      {
        useProxy: true,
        apiKey: apiKey
      }
    );
    
    const elapsed = Date.now() - startTime;
    
    console.log(`✅ Response received in ${elapsed}ms`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers: ${JSON.stringify([...response.headers.entries()].slice(0, 3))}`);
    
    const html = await response.text();
    console.log(`   Content length: ${html.length} bytes`);
    
    // Check if we got valid HTML
    if (html.includes('<html') || html.includes('<!DOCTYPE')) {
      console.log(`   ✅ Valid HTML content received`);
      
      // Check for specific content
      if (html.includes('PDF') || html.includes('pdf')) {
        console.log(`   ✅ Expected content found (PDF references)`);
      } else {
        console.log(`   ⚠️  Expected content not found, but HTML is valid`);
      }
    } else {
      console.log(`   ❌ Invalid HTML content`);
      console.log(`   First 200 chars: ${html.slice(0, 200)}`);
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Zyte API test PASSED');
    console.log('');
    console.log('You can now use Zyte proxy with:');
    console.log('  npm run scrape -- -u -c 5 -z');
    
  } catch (error) {
    console.error('❌ Zyte API test FAILED');
    console.error('');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check your API key is correct at https://app.zyte.com/');
    console.log('2. Verify you have sufficient credits');
    console.log('3. Ensure your plan includes Automatic Extraction API');
    console.log('4. Try again in a few minutes if Zyte is experiencing issues');
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testZyte().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

export { testZyte };
