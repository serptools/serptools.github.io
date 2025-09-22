// enrich-mime.mjs
// This script enriches the output JSON files in out/ by adding
// MIME types and guessing the category from the MIME. It uses
// the mime-db package, which must be installed via npm. It also
// adds basic related extension heuristics and simple container
// mappings.

import fs from 'node:fs';
import path from 'node:path';
import mimeDb from 'mime-db';

const OUT_DIR = path.resolve('..', 'out');

// Build an extension → MIME map from mime-db
const extToMimes = new Map();
for (const [full, meta] of Object.entries(mimeDb)) {
  for (const ext of meta.extensions || []) {
    const e = ext.toLowerCase();
    if (!extToMimes.has(e)) extToMimes.set(e, new Set());
    extToMimes.get(e).add(full.toLowerCase());
  }
}

// Guess category from MIME type
function guessCategory(mimes) {
  const type = (mimes?.[0] || '').split('/')[0];
  switch (type) {
    case 'image':
      return 'image_raster';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    case 'text':
      return 'document';
    default:
      return 'other';
  }
}

// Basic related heuristic: map extension to array of similar ones
function relatedHeuristics(ext) {
  const map = {
    jpeg: ['jpg'],
    jpg: ['jpeg'],
    tiff: ['tif'],
    tif: ['tiff'],
    heic: ['heif', 'avif'],
    heif: ['heic', 'avif'],
    avif: ['heic', 'heif'],
    mp4: ['m4v', 'm4a'],
    m4v: ['mp4'],
    m4a: ['mp4']
  };
  return map[ext] || [];
}

// Minimal container map for common types
const containersQuick = {
  mp4: ['mp4'],
  m4v: ['mp4'],
  m4a: ['mp4'],
  mkv: ['mkv'],
  webm: ['webm'],
  mov: ['mov'],
  pdf: ['pdf'],
  zip: ['zip'],
  '7z': ['7z'],
  rar: ['rar'],
  mp3: ['mp3'],
  wav: ['wav'],
  flac: ['flac'],
  heic: ['heif'],
  avif: ['heif']
};

fs.readdirSync(OUT_DIR).forEach(file => {
  if (!file.endsWith('.json') || file === 'filetypes.json') return;
  const filepath = path.join(OUT_DIR, file);
  const rec = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  // Add mime
  const mimes = Array.from(extToMimes.get(rec.extension) || []);
  if (mimes.length && !rec.mime) rec.mime = mimes;
  // Guess category if missing
  if (!rec.category) rec.category = guessCategory(rec.mime);
  // Related heuristics
  if (!rec.related) rec.related = relatedHeuristics(rec.extension);
  // Containers
  if (!rec.containers) rec.containers = containersQuick[rec.extension] || [];
  // Save record
  fs.writeFileSync(filepath, JSON.stringify(rec, null, 2));
  console.log('Enriched', rec.slug);
});