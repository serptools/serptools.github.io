// combine.mjs
// This script reads all JSON records in the out/ directory (except
// filetypes.json) and writes a single JSON array to out/filetypes.json.

import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('..', 'out');
const records = [];
fs.readdirSync(OUT_DIR).forEach(file => {
  if (!file.endsWith('.json')) return;
  if (file === 'filetypes.json') return;
  const filepath = path.join(OUT_DIR, file);
  const rec = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  records.push(rec);
});
records.sort((a, b) => a.slug.localeCompare(b.slug));
fs.writeFileSync(path.join(OUT_DIR, 'filetypes.json'), JSON.stringify(records, null, 2));
console.log('Combined', records.length, 'records into filetypes.json');