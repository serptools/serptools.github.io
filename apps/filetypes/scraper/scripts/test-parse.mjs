import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const filePath = path.resolve('..', 'raw', '4b94fa7678cfd92a.html');
const html = fs.readFileSync(filePath, 'utf8');
const $ = cheerio.load(html);

console.log('Testing program extraction...\n');

// Look for table rows
console.log('Table rows found:', $('table tr').length);

// Look for specific program links
$('table tr').each((i, row) => {
  const link = $(row).find('td.w-100 a').first();
  if (link.length > 0) {
    console.log(`Found program: ${link.text()} - ${link.attr('href')}`);
  }
});

console.log('\nAlternate search:');
$('td a').each((i, a) => {
  const text = $(a).text();
  const href = $(a).attr('href');
  if (text && !text.includes('File Types') && !text.includes('Software') &&
      !text.includes('Help Center') && !text.includes('Random')) {
    console.log(`  ${text} - ${href}`);
  }
});