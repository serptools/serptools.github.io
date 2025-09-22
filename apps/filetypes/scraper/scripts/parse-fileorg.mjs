// parse-fileorg.mjs
// This script reads raw HTML files downloaded from file.org in the raw/
// directory and extracts basic fields: extension, name, summary, and
// programs that can open the file. It writes a JSON file per
// extension in the out/ directory. The script uses cheerio for HTML
// parsing. It is intentionally minimal for an MVP.

import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const RAW_DIR = path.resolve('..', 'raw');
const OUT_DIR = path.resolve('..', 'out');

// Ensure output directory exists
fs.mkdirSync(OUT_DIR, { recursive: true });

// Helper to normalise whitespace
function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

// Attempt to derive extension slug from title
function extFromTitle($) {
  const title = clean($('h1').first().text()) || clean($('title').text());
  const match = title.match(/\.?(\w+)\s+file/i);
  return match ? match[1].toLowerCase() : '';
}

// Attempt to derive a display name from heading or paragraph
function nameFromPage($, ext) {
  const h2 = clean($('h2').first().text());
  if (h2 && !/programs|software/i.test(h2)) {
    return h2;
  }
  const p = clean($('p').first().text());
  if (p) {
    // Use the first sentence as a basic name/summary
    return p.split('.')[0];
  }
  return `.${ext.toUpperCase()} file`;
}

// Extract summary
function summaryFromPage($) {
  const p = clean($('p').first().text());
  return p || undefined;
}

// Extract programs grouped by platform
function extractPrograms($) {
  const programs = {};

  // Simply look for all table rows with program links
  const allPrograms = [];

  $('table tr').each((_, row) => {
    // Look for a link in a table cell with class w-100
    const link = $(row).find('td.w-100 a').first();
    if (link.length === 0) {
      // Fallback to any link in a td
      const anyLink = $(row).find('td a').first();
      if (anyLink.length) {
        const name = clean(anyLink.text());
        const url = anyLink.attr('href');
        // Filter out navigation links
        if (name && url &&
            !name.includes('File Types') &&
            !name.includes('Software') &&
            !name.includes('Help Center') &&
            !name.includes('Random Extension') &&
            !name.includes('More Information') &&
            !name.includes('How to Open')) {
          allPrograms.push({
            name,
            url: url.startsWith('http') ? url : `https://file.org${url}`
          });
        }
      }
    } else {
      const name = clean(link.text());
      const url = link.attr('href');
      if (name && url) {
        allPrograms.push({
          name,
          url: url.startsWith('http') ? url : `https://file.org${url}`
        });
      }
    }
  });

  // Try to detect platform from nav tabs or default to windows
  let detectedPlatform = 'windows';
  $('.nav-tabs .nav-link').each((_, tab) => {
    const text = clean($(tab).text()).toLowerCase();
    if (text.includes('windows')) detectedPlatform = 'windows';
    else if (text.includes('mac')) detectedPlatform = 'mac';
    else if (text.includes('linux')) detectedPlatform = 'linux';
  });

  if (allPrograms.length > 0) {
    programs[detectedPlatform] = allPrograms.slice(0, 10);
  }

  return Object.keys(programs).length > 0 ? programs : undefined;
}

function parseFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html);
  const ext = extFromTitle($);
  if (!ext) return null;

  const programs = extractPrograms($);
  // Debug logging
  if (ext === 'jar') {
    console.log('JAR programs extracted:', JSON.stringify(programs, null, 2));
  }

  const record = {
    slug: ext,
    extension: ext,
    name: nameFromPage($, ext),
    category: undefined,
    category_slug: undefined,
    summary: summaryFromPage($),
    developer_info: undefined,
    popularity: undefined,
    more_information: undefined,
    technical_info: undefined,
    how_to_open: undefined,
    programs: programs,
    how_to_convert: undefined,
    mime: undefined,
    containers: undefined,
    related: undefined,
    magic: undefined,
    support: undefined,
    seo: undefined,
    images: undefined,
    common_filenames: undefined,
    last_updated: new Date().toISOString(),
    sources: [{ url: 'file.org', retrieved_at: new Date().toISOString() }]
  };
  return record;
}

// Process each HTML file in raw directory
fs.readdirSync(RAW_DIR).forEach(file => {
  if (!file.endsWith('.html')) return;
  const fullPath = path.join(RAW_DIR, file);
  const rec = parseFile(fullPath);
  if (!rec) {
    console.error('Could not parse', file);
    return;
  }
  const outPath = path.join(OUT_DIR, `${rec.slug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(rec, null, 2));
  console.log('Parsed', rec.slug);
});