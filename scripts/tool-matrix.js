#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define all formats by category
const formats = {
  rasterImages: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'tiff', 'avif'],
  rawImages: ['raw', 'cr2', 'cr3', 'arw', 'dng', 'nef', 'orf'],
  vectorImages: ['svg', 'ai', 'eps'],
  appleImages: ['heic', 'heif'],
  legacyImages: ['jfif', 'pjpeg'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'mpg', 'mpeg', 'm4v'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'],
  documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'],
  data: ['json', 'csv', 'xml', 'yaml', 'toml', 'sql'],
  archives: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2']
};

// Get existing tools
const toolsDir = path.join(__dirname, '../app/tools');
const existingTools = new Set(
  fs.readdirSync(toolsDir)
    .filter(f => !f.endsWith('.tsx'))
);

// Generate conversion matrix
function generateMatrix() {
  const matrix = {};
  const allFormats = Object.values(formats).flat();
  
  // Image to image conversions (most common)
  const imageFormats = [...formats.rasterImages, ...formats.vectorImages, ...formats.appleImages, ...formats.legacyImages];
  
  console.log('=== CONVERSION COVERAGE MATRIX ===\n');
  console.log('✅ = Exists | ❌ = Missing | - = Not applicable\n');
  
  // Create a visual matrix for image formats
  const commonFormats = ['jpg', 'png', 'gif', 'webp', 'svg', 'pdf', 'heic', 'bmp'];
  
  // Header
  console.log('FROM\\TO |', commonFormats.map(f => f.padEnd(4)).join(' | '));
  console.log('--------|' + '-'.repeat(commonFormats.length * 7 + (commonFormats.length - 1) * 2));
  
  // Rows
  commonFormats.forEach(from => {
    const row = [from.padEnd(7) + '|'];
    commonFormats.forEach(to => {
      if (from === to) {
        row.push(' -  ');
      } else {
        const toolName = `${from}-to-${to}`;
        if (existingTools.has(toolName)) {
          row.push(' ✅ ');
        } else {
          row.push(' ❌ ');
        }
      }
    });
    console.log(row.join(' | '));
  });
  
  // List all missing conversions
  const missingConversions = [];
  commonFormats.forEach(from => {
    commonFormats.forEach(to => {
      if (from !== to) {
        const toolName = `${from}-to-${to}`;
        if (!existingTools.has(toolName)) {
          missingConversions.push(toolName);
        }
      }
    });
  });
  
  console.log('\n=== MISSING HIGH-PRIORITY CONVERSIONS ===');
  console.log(missingConversions.join('\n'));
  
  // Count statistics
  const totalPossible = commonFormats.length * (commonFormats.length - 1);
  const existing = totalPossible - missingConversions.length;
  const percentage = ((existing / totalPossible) * 100).toFixed(1);
  
  console.log('\n=== STATISTICS ===');
  console.log(`Common formats: ${commonFormats.length}`);
  console.log(`Possible conversions: ${totalPossible}`);
  console.log(`Existing conversions: ${existing}`);
  console.log(`Missing conversions: ${missingConversions.length}`);
  console.log(`Coverage: ${percentage}%`);
  
  // Save to file
  const report = {
    formats: commonFormats,
    existing: existing,
    missing: missingConversions,
    coverage: percentage,
    matrix: {}
  };
  
  commonFormats.forEach(from => {
    report.matrix[from] = {};
    commonFormats.forEach(to => {
      if (from !== to) {
        report.matrix[from][to] = existingTools.has(`${from}-to-${to}`);
      }
    });
  });
  
  fs.writeFileSync(
    path.join(__dirname, 'conversion-matrix.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n✅ Report saved to scripts/conversion-matrix.json');
}

generateMatrix();