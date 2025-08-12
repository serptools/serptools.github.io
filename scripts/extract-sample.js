const fs = require('fs');
const path = require('path');
const { extractFileTypeData } = require('./extract-filetype-data.js');

// Extract just a few common file types for testing
const testFiles = [
  'pdf.html', 'jpg.html', 'png.html', 'json.html', 'csv.html', 
  'txt.html', 'docx.html', 'mp4.html', 'zip.html', 'gif.html',
  'heic.html', 'webp.html', 'svg.html', 'jpeg.html'
];

const extensionDir = path.join(__dirname, '../.filetypes/extension');
const outputDir = path.join(__dirname, '../public/data/filetypes');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const extracted = [];
console.log('Extracting sample file types...\n');

for (const file of testFiles) {
  const filePath = path.join(extensionDir, file);
  if (fs.existsSync(filePath)) {
    const html = fs.readFileSync(filePath, 'utf-8');
    const data = extractFileTypeData(html, file);
    if (data && data.extension) {
      extracted.push(data);
      // Write individual file
      const outputFile = path.join(outputDir, `${data.extension}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
      console.log(`✅ ${data.extension} - ${data.name}`);
    } else {
      console.log(`❌ ${file} - Failed to extract`);
    }
  } else {
    console.log(`⚠️  ${file} - Not found`);
  }
}

// Categorize file types
function categorizeFileType(extension, summary) {
  const ext = extension.toLowerCase();
  const text = (summary || '').toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic'].includes(ext)) {
    return 'images';
  }
  if (['mp4'].includes(ext)) {
    return 'video';
  }
  if (['pdf', 'docx', 'txt'].includes(ext)) {
    return 'documents';
  }
  if (['csv', 'json'].includes(ext)) {
    return 'data';
  }
  if (['zip'].includes(ext)) {
    return 'archives';
  }
  return 'misc';
}

// Create index file
const indexData = extracted.map(item => ({
  slug: item.extension,
  name: item.name,
  category: item.categorySlug || categorizeFileType(item.extension, item.summary),
  categoryName: item.category || item.name,
  extension: item.extension,
  popularity: item.popularity,
  updated_at: item.lastUpdated,
  developer_org: item.developer?.toLowerCase().replace(/\s+/g, '-'),
  summary: item.summary
})).sort((a, b) => a.slug.localeCompare(b.slug));

fs.writeFileSync(
  path.join(outputDir, 'index.json'),
  JSON.stringify(indexData, null, 2)
);

console.log(`\n✨ Successfully extracted ${extracted.length} file types`);
console.log(`📁 Data written to: ${outputDir}`);