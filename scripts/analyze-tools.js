#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get all tool directories
const toolsDir = path.join(__dirname, '../app/tools');
const tools = fs.readdirSync(toolsDir).filter(f => !f.endsWith('.tsx'));

// Track conversions
const conversions = new Set();
const sourceFormats = new Set();
const targetFormats = new Set();
const conversionMatrix = {};

// Parse tool names
tools.forEach(tool => {
  if (tool.includes('-to-')) {
    const [source, target] = tool.split('-to-');
    sourceFormats.add(source);
    targetFormats.add(target);
    conversions.add(`${source}-to-${target}`);
    
    if (!conversionMatrix[source]) {
      conversionMatrix[source] = new Set();
    }
    conversionMatrix[source].add(target);
  }
});

// Common formats for both image and video
const commonImageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'svg', 'avif', 'heic', 'heif', 'jfif', 'tiff', 'raw', 'cr2', 'cr3', 'arw', 'dng', 'nef', 'orf'];
const commonVideoFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'mpg', 'mpeg', 'm4v', '3gp'];
const documentFormats = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'];
const dataFormats = ['json', 'csv', 'xml', 'yaml', 'toml'];

// Find missing conversions
console.log('=== CURRENT TOOLS ===');
console.log(`Total tools: ${tools.length}`);
console.log(`Conversion tools: ${conversions.size}`);
console.log(`Other tools: ${tools.length - conversions.size}`);

console.log('\n=== SOURCE FORMATS ===');
console.log(Array.from(sourceFormats).sort().join(', '));

console.log('\n=== TARGET FORMATS ===');
console.log(Array.from(targetFormats).sort().join(', '));

console.log('\n=== CONVERSION MATRIX ===');
Object.entries(conversionMatrix).forEach(([source, targets]) => {
  console.log(`${source} → ${Array.from(targets).sort().join(', ')}`);
});

console.log('\n=== POTENTIAL MISSING CONVERSIONS (IMAGES) ===');
// Check for missing reverse conversions
conversions.forEach(conv => {
  const [source, target] = conv.split('-to-');
  const reverse = `${target}-to-${source}`;
  
  // Only check image formats
  if (commonImageFormats.includes(source) && commonImageFormats.includes(target)) {
    if (!conversions.has(reverse)) {
      console.log(`Missing reverse: ${reverse}`);
    }
  }
});

// Find common format pairs that don't exist
console.log('\n=== SUGGESTED NEW IMAGE CONVERSIONS ===');
const popularImageFormats = ['jpg', 'png', 'gif', 'webp', 'svg', 'pdf'];
popularImageFormats.forEach(source => {
  popularImageFormats.forEach(target => {
    if (source !== target) {
      const conversion = `${source}-to-${target}`;
      if (!conversions.has(conversion)) {
        console.log(conversion);
      }
    }
  });
});

// Export for use in other scripts
const analysis = {
  tools: tools.length,
  conversions: Array.from(conversions),
  sourceFormats: Array.from(sourceFormats),
  targetFormats: Array.from(targetFormats),
  matrix: Object.fromEntries(
    Object.entries(conversionMatrix).map(([k, v]) => [k, Array.from(v)])
  )
};

fs.writeFileSync(
  path.join(__dirname, 'tools-analysis.json'),
  JSON.stringify(analysis, null, 2)
);

console.log('\n✅ Analysis saved to scripts/tools-analysis.json');