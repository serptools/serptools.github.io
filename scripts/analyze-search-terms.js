#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Your search terms
const searchTerms = `heic to jpg
jpg to pdf
pdf to png
video to gif
epub to pdf
m4a to mp3
mov to mp4
heic to png
mp3 to wav
docx to pdf
jpg to png
png to svg
mkv to mp4
jpeg to pdf
doc to pdf
avif to jpg
image to pdf
gif to mp4
heic to pdf
jfif to jpg
avif to png
m4a to wav
heic to jpeg
mp4 to wav
mp3 to mp4
mov to mp3
mp3 to ogg
mp4 to webm
rar to zip
jpg to svg
pdf to text
avi to mp4
gif to png
djvu to pdf
jpeg to png
flac to mp3
jpeg to jpg
webm to gif
png to webp
pages to pdf
dds to png
jpg to webp
mkv to mp3
jfif to png
heif to jpg
word to jpg
midi to mp3
mpeg to mp3
jpeg to svg
azw3 to pdf
gif to jpg
pdf to txt
odt to pdf
pdf to svg
7z to zip
rtf to pdf
pdf to html
pages to word
m4a to mp4
xlsx to pdf
psd to png
jpg to ico
html to png
avif to jpeg
mobi to pdf
flv to mp4
webp to pdf
eml to pdf
eps to png
html to jpg
csv to pdf
psd to jpg
cr2 to jpg
eps to svg
tif to jpg
mov to wav
pdf to pdf
ico to png
dng to jpg
mp4 to ogg
mpeg to mp4
azw3 to epub
mpg to mp4
vob to mp4
mobi to epub
ogg to wav
cbr to pdf
jpg to text
aiff to mp3
nef to jpg
ai to png
svg to ico
tif to png
webp to svg
pdf to tiff
png to text
mp4 to wmv
arw to jpg
mkv to mov
ts to mp4
m4b to mp3
jfif to jpeg
doc to jpg
heif to pdf
pages to docx
jpeg to webp
opus to mp3
jfif to pdf
bmp to png
pub to pdf
flac to wav
xml to pdf
aac to mp3
jpeg to ico
3gp to mp4
xps to pdf
m4p to mp3
cr3 to jpg
cbz to pdf
mts to mp4
word to jpeg
bmp to jpg
gif to webp
csv to xlsx
mxf to mp4
psd to pdf
png to word
png to png
xls to csv
heif to png
avif to gif
eps to jpg
htm to pdf
aif to mp3
doc to docx
eps to pdf
webpage to jpg
ai to svg
mov to webm
apng to gif
html to word
png to tiff
ai to jpg
youtube to avi
dng to png
avi to mov
swf to mp4
cr2 to png
ppt to jpg
rtf to txt
flac to alac
bmp to pdf
jpg to tiff
html to jpeg
m4a to ogg
png to tga
mod to mp4
xls to xlsx
heic to mp4
mkv to avi
avi to mp3
ps to pdf
aiff to wav
caf to mp3
pdf to gif
mp4 to ogv
png to docx
azw to pdf
midi to wav
png to doc
jpeg to gif
3gp to mp3
psd to svg
wmv to mp3
aifc to mp3
epub to word
asf to mp4
jpg to txt
wma to wav
rtf to word
mpv to mp4
wps to pdf
wmv to mov
xml to html
png to txt
html to mp3
qt to mp4
mp3 to wma
website to html
vsd to pdf
m4r to mp3
dds to jpg
mp3 to webm
txt to word
aac to mp4
eml to html
jpg to tga
wps to word`.split('\n').map(s => s.trim().toLowerCase());

// Get existing tools
const toolsDir = path.join(__dirname, '../app/tools');
const existingTools = new Set(
  fs.readdirSync(toolsDir)
    .filter(f => !f.endsWith('.tsx'))
    .map(t => t.replace(/-/g, ' '))
);

// Normalize search terms
const normalizedTerms = searchTerms.map(term => {
  // Handle special cases
  if (term === 'image to pdf') return 'image to pdf'; // Generic term
  if (term === 'video to gif') return 'video to gif'; // Generic term
  if (term === 'word to jpg') return 'docx to jpg';
  if (term === 'word to jpeg') return 'docx to jpeg';
  if (term === 'webpage to jpg') return 'html to jpg';
  if (term === 'website to html') return 'website to html'; // Special case
  if (term === 'youtube to avi') return 'youtube to avi'; // Special case
  if (term === 'pdf to text') return 'pdf to txt';
  
  return term;
});

// Categorize terms
const results = {
  existing: [],
  missing: [],
  duplicates: new Map(), // Map of term -> [duplicate terms]
  reverseExists: [], // Terms where we have the reverse
  special: [] // Special/generic terms
};

// Track seen conversions
const seenConversions = new Map();

normalizedTerms.forEach((term, index) => {
  const original = searchTerms[index];
  
  // Check for special/generic terms
  if (term.includes('image ') || term.includes('video ') || term.includes('youtube') || term.includes('website')) {
    results.special.push(original);
    return;
  }
  
  // Parse the conversion
  const parts = term.split(' to ');
  if (parts.length !== 2) return;
  
  const [from, to] = parts;
  const toolName = `${from} to ${to}`;
  const reverseToolName = `${to} to ${from}`;
  const dashToolName = toolName.replace(/ /g, '-');
  
  // Check if it's a duplicate (same conversion already seen)
  const convKey = [from, to].sort().join('-');
  if (seenConversions.has(convKey)) {
    const existing = seenConversions.get(convKey);
    if (!results.duplicates.has(existing)) {
      results.duplicates.set(existing, []);
    }
    results.duplicates.get(existing).push(original);
    return;
  }
  seenConversions.set(convKey, original);
  
  // Check if tool exists
  if (existingTools.has(toolName)) {
    results.existing.push(original);
  } else if (existingTools.has(reverseToolName)) {
    results.reverseExists.push(`${original} (we have: ${reverseToolName})`);
  } else {
    results.missing.push(original);
  }
});

// Format analysis
console.log('=== SEARCH TERMS ANALYSIS ===\n');
console.log(`Total terms: ${searchTerms.length}`);
console.log(`Unique conversions: ${seenConversions.size}`);
console.log(`Existing tools: ${results.existing.length}`);
console.log(`Missing tools: ${results.missing.length}`);
console.log(`Reverse exists: ${results.reverseExists.length}`);
console.log(`Special/Generic: ${results.special.length}`);
console.log(`Duplicate entries: ${results.duplicates.size}`);

console.log('\n=== EXISTING TOOLS (%d) ===' , results.existing.length);
results.existing.sort().forEach(t => console.log(`✅ ${t}`));

console.log('\n=== MISSING TOOLS (%d) ===', results.missing.length);
// Group by category
const missingByCategory = {
  image: [],
  video: [],
  audio: [],
  document: [],
  data: [],
  archive: [],
  other: []
};

const imageExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff', 'tif', 'heic', 'heif', 'avif', 'jfif', 'psd', 'ai', 'eps', 'dds', 'cr2', 'cr3', 'nef', 'arw', 'dng', 'tga', 'apng'];
const videoExt = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'mpg', 'mpeg', 'm4v', '3gp', 'vob', 'mts', 'mxf', 'swf', 'asf', 'mod', 'mpv', 'qt', 'ts', 'ogv'];
const audioExt = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus', 'aiff', 'aif', 'midi', 'alac', 'm4b', 'm4p', 'm4r', 'caf', 'aifc'];
const docExt = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages', 'epub', 'mobi', 'azw', 'azw3', 'djvu', 'xps', 'cbr', 'cbz', 'pub', 'wps', 'ps', 'vsd'];
const dataExt = ['json', 'csv', 'xml', 'html', 'htm', 'xls', 'xlsx', 'eml'];
const archiveExt = ['zip', 'rar', '7z', 'tar', 'gz'];

results.missing.forEach(term => {
  const [from, to] = term.split(' to ');
  if (imageExt.includes(from) || imageExt.includes(to)) {
    missingByCategory.image.push(term);
  } else if (videoExt.includes(from) || videoExt.includes(to)) {
    missingByCategory.video.push(term);
  } else if (audioExt.includes(from) || audioExt.includes(to)) {
    missingByCategory.audio.push(term);
  } else if (docExt.includes(from) || docExt.includes(to)) {
    missingByCategory.document.push(term);
  } else if (dataExt.includes(from) || dataExt.includes(to)) {
    missingByCategory.data.push(term);
  } else if (archiveExt.includes(from) || archiveExt.includes(to)) {
    missingByCategory.archive.push(term);
  } else {
    missingByCategory.other.push(term);
  }
});

Object.entries(missingByCategory).forEach(([category, terms]) => {
  if (terms.length > 0) {
    console.log(`\n${category.toUpperCase()} (${terms.length}):`);
    terms.sort().forEach(t => console.log(`  ❌ ${t}`));
  }
});

console.log('\n=== REVERSE EXISTS (%d) ===', results.reverseExists.length);
results.reverseExists.forEach(t => console.log(`🔄 ${t}`));

console.log('\n=== SPECIAL/GENERIC TERMS (%d) ===', results.special.length);
results.special.forEach(t => console.log(`⚠️  ${t}`));

if (results.duplicates.size > 0) {
  console.log('\n=== DUPLICATE ENTRIES ===');
  results.duplicates.forEach((dupes, original) => {
    console.log(`${original} = ${dupes.join(', ')}`);
  });
}

// Priority recommendations
console.log('\n=== TOP PRIORITY RECOMMENDATIONS ===');
console.log('Based on common search terms that are missing:\n');

const priorities = [
  // High-value video conversions
  'mov to mp4', 'mkv to mp4', 'avi to mp4', 'flv to mp4',
  // High-value audio conversions  
  'm4a to mp3', 'flac to mp3', 'aac to mp3',
  // Document conversions
  'docx to pdf', 'doc to pdf', 'xlsx to pdf',
  // Missing image conversions
  'webp to pdf', 'webp to svg', 'svg to ico',
  // Data conversions
  'csv to xlsx', 'csv to pdf'
].filter(t => results.missing.includes(t));

priorities.forEach((term, i) => {
  console.log(`${i + 1}. ${term}`);
});

// Save report
const report = {
  timestamp: new Date().toISOString(),
  total: searchTerms.length,
  unique: seenConversions.size,
  existing: results.existing,
  missing: results.missing,
  reverseExists: results.reverseExists.map(r => r.split(' (')[0]),
  special: results.special,
  missingByCategory,
  priorities
};

fs.writeFileSync(
  path.join(__dirname, 'search-terms-analysis.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n✅ Full report saved to scripts/search-terms-analysis.json');