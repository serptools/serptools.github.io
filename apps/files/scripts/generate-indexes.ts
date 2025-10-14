#!/usr/bin/env node
/**
 * Generate index files from individual filetype JSON files
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileTypeIndex {
  slug: string;
  name: string;
  extension: string;
  category?: string;
  category_slug?: string;
  summary?: string;
  developer_org?: string;
  developer_name?: string;
  popularity?: {
    rating: number;
    votes: number;
    source?: string;
  };
  updated_at?: string;
  rating?: number;
  votes?: number;
}

/**
 * Generate all index files
 */
async function generateIndexes(): Promise<void> {
  const dataDir = path.join(process.cwd(), 'public', 'data', 'files');
  const individualDir = path.join(dataDir, 'individual');
  
  console.log('Generating index files...');
  console.log(`Reading from: ${individualDir}`);
  
  // Read all individual files
  const files = fs.readdirSync(individualDir).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} individual files`);
  
  const allFileTypes: FileTypeIndex[] = [];
  const categoriesMap: Map<string, FileTypeIndex[]> = new Map();
  const alphabetMap: Map<string, FileTypeIndex[]> = new Map();
  
  // Process each file
  for (const file of files) {
    try {
      const filePath = path.join(individualDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      // Create index entry
      const entry: FileTypeIndex = {
        slug: data.slug || data.extension,
        name: data.name,
        extension: data.extension,
        category: data.category,
        category_slug: data.category_slug,
        summary: data.summary,
        developer_org: data.developer_org,
        developer_name: data.developer_name,
        updated_at: data.updated_at || data.last_updated,
        rating: data.rating,
        votes: data.votes
      };
      
      // Add popularity if available
      if (data.popularity) {
        entry.popularity = data.popularity;
      } else if (data.rating && data.votes) {
        entry.popularity = {
          rating: data.rating,
          votes: data.votes
        };
      }
      
      allFileTypes.push(entry);
      
      // Group by category
      if (data.category_slug) {
        if (!categoriesMap.has(data.category_slug)) {
          categoriesMap.set(data.category_slug, []);
        }
        categoriesMap.get(data.category_slug)!.push(entry);
      }
      
      // Group by first letter
      const firstLetter = data.extension[0].toLowerCase();
      if (!alphabetMap.has(firstLetter)) {
        alphabetMap.set(firstLetter, []);
      }
      alphabetMap.get(firstLetter)!.push(entry);
      
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  console.log(`Processed ${allFileTypes.length} file types`);
  
  // Sort all file types by extension
  allFileTypes.sort((a, b) => a.extension.localeCompare(b.extension));
  
  // Write main index
  const indexPath = path.join(dataDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(allFileTypes, null, 2));
  console.log(`✅ Written main index: ${indexPath} (${allFileTypes.length} entries)`);
  
  // Write alphabet index
  const alphabetIndex: Record<string, FileTypeIndex[]> = {};
  for (const [letter, entries] of Array.from(alphabetMap.entries())) {
    alphabetIndex[letter] = entries.sort((a, b) => a.extension.localeCompare(b.extension));
  }
  
  const alphabetPath = path.join(dataDir, 'alphabet-index.json');
  fs.writeFileSync(alphabetPath, JSON.stringify(alphabetIndex, null, 2));
  console.log(`✅ Written alphabet index: ${alphabetPath} (${alphabetMap.size} letters)`);
  
  // Write category indexes
  const categoriesDir = path.join(dataDir, 'categories');
  if (!fs.existsSync(categoriesDir)) {
    fs.mkdirSync(categoriesDir, { recursive: true });
  }
  
  for (const [categorySlug, entries] of Array.from(categoriesMap.entries())) {
    const categoryPath = path.join(categoriesDir, `${categorySlug}.json`);
    const sorted = entries.sort((a, b) => a.extension.localeCompare(b.extension));
    fs.writeFileSync(categoryPath, JSON.stringify(sorted, null, 2));
  }
  
  console.log(`✅ Written ${categoriesMap.size} category indexes`);
  
  // Generate popular files (top 100 by votes)
  const popular = allFileTypes
    .filter(ft => ft.votes && ft.votes > 0)
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .slice(0, 100);
  
  const popularPath = path.join(dataDir, 'popular.json');
  fs.writeFileSync(popularPath, JSON.stringify(popular, null, 2));
  console.log(`✅ Written popular index: ${popularPath} (${popular.length} entries)`);
  
  // Generate search index (simplified)
  const searchIndex = allFileTypes.map(ft => ({
    slug: ft.slug,
    extension: ft.extension,
    name: ft.name,
    category: ft.category,
    summary: ft.summary ? ft.summary.substring(0, 200) : undefined
  }));
  
  const searchPath = path.join(dataDir, 'search-index.json');
  fs.writeFileSync(searchPath, JSON.stringify(searchIndex, null, 2));
  console.log(`✅ Written search index: ${searchPath} (${searchIndex.length} entries)`);
  
  console.log('\n✅ All index files generated successfully!');
}

// Run if executed directly
if (require.main === module) {
  generateIndexes().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { generateIndexes };
