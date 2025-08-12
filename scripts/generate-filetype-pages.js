#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read all JSON files from the data directory
const dataDir = path.join(process.cwd(), 'public', 'data', 'filetypes', 'json');
const appDir = path.join(process.cwd(), 'app', 'filetypes');

// Template for each file type page
const pageTemplate = (slug) => `'use client';

import FileTypeDetail from '../FileTypeDetail';

export default function ${slug.charAt(0).toUpperCase() + slug.slice(1).replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return <FileTypeDetail slug="${slug}" />;
}
`;

// Read all JSON files
const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

console.log(`Found ${files.length} file types to generate pages for`);

// Create pages for each file type
files.forEach(file => {
  const slug = file.replace('.json', '');
  const pageDir = path.join(appDir, slug);
  const pagePath = path.join(pageDir, 'page.tsx');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }
  
  // Write the page file
  fs.writeFileSync(pagePath, pageTemplate(slug));
  console.log(`Generated page for: ${slug}`);
});

console.log(`\n✅ Generated ${files.length} file type pages`);