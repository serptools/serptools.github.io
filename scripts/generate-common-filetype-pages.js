#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of common file types to generate pages for
const commonFileTypes = [
  // Documents
  'doc', 'docx', 'pdf', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx',
  
  // Images
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'ico', 'webp', 'tiff', 'psd',
  
  // Videos
  'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'mpg', 'mpeg', 'm4v',
  
  // Audio
  'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus', 'aiff', 'ape',
  
  // Archives
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'dmg', 'pkg',
  
  // Code/Data
  'html', 'css', 'js', 'json', 'xml', 'csv', 'sql', 'py', 'java', 'cpp',
  'c', 'h', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'ts', 'jsx',
  
  // Executables
  'exe', 'app', 'deb', 'apk', 'msi', 'dmg', 'pkg', 'appimage', 'jar', 'bat',
  
  // Other common
  'log', 'ini', 'cfg', 'conf', 'bak', 'tmp', 'cache', 'torrent', 'crdownload'
];

const appDir = path.join(process.cwd(), 'app', 'filetypes');
const dataDir = path.join(process.cwd(), 'public', 'data', 'filetypes', 'json');

// Template for each file type page
const pageTemplate = (slug) => `'use client';

import FileTypeDetail from '../FileTypeDetail';

export default function ${slug.charAt(0).toUpperCase() + slug.slice(1).replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return <FileTypeDetail slug="${slug}" />;
}
`;

console.log(`Generating pages for ${commonFileTypes.length} common file types`);

let generated = 0;
let skipped = 0;

commonFileTypes.forEach(slug => {
  const jsonPath = path.join(dataDir, `${slug}.json`);
  
  // Check if JSON file exists
  if (!fs.existsSync(jsonPath)) {
    console.log(`⚠️  Skipping ${slug} - no JSON data found`);
    skipped++;
    return;
  }
  
  const pageDir = path.join(appDir, slug);
  const pagePath = path.join(pageDir, 'page.tsx');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }
  
  // Write the page file
  fs.writeFileSync(pagePath, pageTemplate(slug));
  console.log(`✅ Generated page for: ${slug}`);
  generated++;
});

console.log(`\n📊 Summary:`);
console.log(`   Generated: ${generated} pages`);
console.log(`   Skipped: ${skipped} (no data)`);
console.log(`   Total: ${commonFileTypes.length} file types`);