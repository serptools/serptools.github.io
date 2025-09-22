#!/usr/bin/env node
// integrate-data.mjs
// This script integrates the scraped file type data from out/ into the main app's public directory

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths
const SCRAPER_OUT = path.resolve(__dirname, '..', 'out');
const PUBLIC_DATA = path.resolve(__dirname, '..', '..', 'public', 'data', 'files');
const INDIVIDUAL_DIR = path.join(PUBLIC_DATA, 'individual');
const CATEGORIES_DIR = path.join(PUBLIC_DATA, 'categories');

// Ensure directories exist
fs.mkdirSync(INDIVIDUAL_DIR, { recursive: true });
fs.mkdirSync(CATEGORIES_DIR, { recursive: true });

console.log('🔄 Starting data integration...');

// Step 1: Copy all individual JSON files
console.log('📂 Copying individual file type JSONs...');
const files = fs.readdirSync(SCRAPER_OUT).filter(f => f.endsWith('.json'));
let copiedCount = 0;
let allRecords = [];

for (const file of files) {
  if (file === 'filetypes.json') continue; // Skip the combined file

  const srcPath = path.join(SCRAPER_OUT, file);
  const destPath = path.join(INDIVIDUAL_DIR, file);

  // Read the file to also collect for index
  const content = fs.readFileSync(srcPath, 'utf8');
  const data = JSON.parse(content);

  // Copy to individual directory
  fs.copyFileSync(srcPath, destPath);
  copiedCount++;

  // Collect for index
  allRecords.push({
    slug: data.slug || data.extension,
    extension: data.extension,
    name: data.name,
    category: data.category || 'other',
    summary: data.summary,
    popularity: data.popularity || 0
  });
}

console.log(`✅ Copied ${copiedCount} individual file JSONs`);

// Step 2: Generate main index.json
console.log('📝 Generating index.json...');
allRecords.sort((a, b) => a.slug.localeCompare(b.slug));
fs.writeFileSync(
  path.join(PUBLIC_DATA, 'index.json'),
  JSON.stringify(allRecords, null, 2)
);
console.log(`✅ Created index with ${allRecords.length} entries`);

// Step 3: Generate category files
console.log('📁 Generating category files...');
const categories = {};

for (const record of allRecords) {
  const category = record.category || 'other';
  if (!categories[category]) {
    categories[category] = [];
  }
  categories[category].push(record);
}

// Create a JSON file for each category
for (const [category, items] of Object.entries(categories)) {
  const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const categoryPath = path.join(CATEGORIES_DIR, `${categorySlug}.json`);

  fs.writeFileSync(categoryPath, JSON.stringify({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    slug: categorySlug,
    count: items.length,
    items: items.slice(0, 100) // Limit items for performance
  }, null, 2));
}

console.log(`✅ Created ${Object.keys(categories).length} category files`);

// Step 4: Generate alphabet index
console.log('🔤 Generating alphabet index...');
const alphabetIndex = {};
for (const record of allRecords) {
  const firstChar = record.extension.charAt(0).toUpperCase();
  const key = /[A-Z]/.test(firstChar) ? firstChar : '#';

  if (!alphabetIndex[key]) {
    alphabetIndex[key] = [];
  }
  alphabetIndex[key].push({
    slug: record.slug,
    extension: record.extension,
    name: record.name
  });
}

fs.writeFileSync(
  path.join(PUBLIC_DATA, 'alphabet-index.json'),
  JSON.stringify(alphabetIndex, null, 2)
);
console.log('✅ Created alphabet index');

// Step 5: Generate search index (simplified)
console.log('🔍 Generating search index...');
const searchIndex = allRecords.map(r => ({
  slug: r.slug,
  extension: r.extension,
  name: r.name,
  searchTerms: `${r.extension} ${r.name} ${r.summary || ''}`.toLowerCase()
}));

fs.writeFileSync(
  path.join(PUBLIC_DATA, 'search-index.json'),
  JSON.stringify(searchIndex, null, 2)
);
console.log('✅ Created search index');

// Step 6: Generate popular.json (placeholder)
console.log('⭐ Generating popular files list...');
const popular = allRecords
  .filter(r => ['pdf', 'jpg', 'png', 'mp4', 'mp3', 'docx', 'xlsx', 'zip', 'txt', 'csv'].includes(r.extension))
  .map(r => ({
    slug: r.slug,
    extension: r.extension,
    name: r.name
  }));

fs.writeFileSync(
  path.join(PUBLIC_DATA, 'popular.json'),
  JSON.stringify(popular, null, 2)
);
console.log('✅ Created popular files list');

console.log('\n🎉 Data integration complete!');
console.log(`   - ${copiedCount} file types integrated`);
console.log(`   - ${Object.keys(categories).length} categories created`);
console.log(`   - Search and alphabet indexes generated`);
console.log('\n📍 Data location: apps/filetypes/public/data/files/');