/**
 * Merge data from multiple scraper sources
 */

import { ScrapedFileData, MergedFileData } from '../types';
import { getCurrentTimestamp, slugify, normalizeExtension } from './scraper-utils';

/**
 * Merge multiple scraped data sources into a single comprehensive data object
 */
export function mergeScrapedData(
  extension: string,
  sources: ScrapedFileData[]
): MergedFileData {
  const normalized = normalizeExtension(extension);
  
  // Start with base object
  const merged: MergedFileData = {
    slug: normalized,
    extension: normalized,
    name: '',
    updated_at: getCurrentTimestamp(),
    sources: []
  };
  
  // Collect all sources
  for (const source of sources) {
    if (source.sources) {
      merged.sources = merged.sources || [];
      merged.sources.push(...source.sources);
    }
  }
  
  // Merge name (prefer longer, more descriptive names)
  const names = sources.map(s => s.name).filter(Boolean);
  if (names.length > 0) {
    merged.name = names.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }
  
  // Merge summary (prefer longer, more informative)
  const summaries = sources.map(s => s.summary).filter(Boolean);
  if (summaries.length > 0) {
    merged.summary = summaries.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }
  
  // Merge developer info (prefer most specific)
  merged.developer_name = findBestValue(sources.map(s => s.developer_name));
  merged.developer_org = findBestValue(sources.map(s => s.developer_org));
  merged.developer = merged.developer_name || merged.developer_org || findBestValue(sources.map(s => s.developer));
  
  if (merged.developer) {
    merged.developer_slug = slugify(merged.developer);
  }
  
  // Merge category
  merged.category = findBestValue(sources.map(s => s.category));
  if (merged.category) {
    merged.category_slug = slugify(merged.category);
  }
  
  // Merge ratings (average if multiple sources)
  const ratings = sources.filter(s => s.rating !== undefined).map(s => s.rating!);
  const votes = sources.filter(s => s.votes !== undefined).map(s => s.votes!);
  
  if (ratings.length > 0 && votes.length > 0) {
    merged.rating = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
    merged.votes = Math.round(votes.reduce((a, b) => a + b, 0) / votes.length);
    merged.popularity = {
      rating: merged.rating,
      votes: merged.votes,
      source: 'aggregated'
    };
  }
  
  // Merge more_information
  merged.more_information = {
    content: mergeArrays(sources.map(s => s.more_information?.content).filter(Boolean)),
    description: mergeArrays(sources.map(s => s.more_information?.description).filter(Boolean)),
  };
  
  // Use first screenshot found
  for (const source of sources) {
    if (source.more_information?.screenshot) {
      merged.more_information.screenshot = source.more_information.screenshot;
      break;
    }
  }
  
  // Merge technical_info
  const techContent = mergeArrays(sources.map(s => s.technical_info?.content).filter(Boolean));
  if (techContent.length > 0) {
    merged.technical_info = { content: techContent };
  }
  
  // Merge how_to_open
  const howToOpenInstructions = mergeArrays(sources.map(s => s.how_to_open?.instructions).filter(Boolean));
  const programs = mergePrograms(sources.map(s => s.how_to_open?.programs).filter(Boolean));
  
  if (howToOpenInstructions.length > 0 || programs.length > 0) {
    merged.how_to_open = {};
    if (howToOpenInstructions.length > 0) {
      merged.how_to_open.instructions = howToOpenInstructions;
    }
    if (programs.length > 0) {
      merged.how_to_open.programs = programs;
    }
  }
  
  // Merge how_to_convert
  const convertInstructions = mergeArrays(sources.map(s => s.how_to_convert?.instructions).filter(Boolean));
  if (convertInstructions.length > 0) {
    merged.how_to_convert = { instructions: convertInstructions };
  }
  
  // Merge programs by platform
  merged.programs = mergeProgramsByPlatform(sources);
  
  // Merge images
  const allImages = sources.map(s => s.images).filter(Boolean).flat();
  if (allImages.length > 0) {
    merged.images = deduplicateImages(allImages);
  }
  
  // Merge common filenames
  const filenames = mergeArrays(sources.map(s => s.common_filenames).filter(Boolean));
  if (filenames.length > 0) {
    merged.common_filenames = filenames;
  }
  
  // Merge mime_type (prefer first found)
  merged.mime_type = findBestValue(sources.map(s => s.mime_type));
  
  // Set last_updated
  merged.last_updated = getCurrentTimestamp();
  
  return merged;
}

/**
 * Find the best (most specific, longest) value from an array
 */
function findBestValue(values: (string | undefined)[]): string | undefined {
  const filtered = values.filter(Boolean);
  if (filtered.length === 0) return undefined;
  
  return filtered.reduce((best, current) => 
    current.length > best.length ? current : best
  );
}

/**
 * Merge arrays and deduplicate
 */
function mergeArrays(arrays: (string[] | undefined)[]): string[] {
  const flat = arrays.flat().filter(Boolean) as string[];
  return Array.from(new Set(flat));
}

/**
 * Merge program lists and deduplicate by name
 */
function mergePrograms(
  programLists: (Array<{ name: string; url?: string; platform?: string }> | undefined)[]
): Array<{ name: string; url?: string }> {
  const allPrograms = programLists.flat().filter(Boolean);
  const seen = new Set<string>();
  const merged: Array<{ name: string; url?: string }> = [];
  
  for (const program of allPrograms) {
    const key = program.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push({
        name: program.name,
        url: program.url
      });
    }
  }
  
  return merged;
}

/**
 * Merge programs grouped by platform
 */
function mergeProgramsByPlatform(
  sources: ScrapedFileData[]
): Record<string, Array<{ name: string; url?: string; license?: string }>> | undefined {
  const merged: Record<string, Array<{ name: string; url?: string; license?: string }>> = {};
  
  for (const source of sources) {
    if (source.programs) {
      for (const [platform, programs] of Object.entries(source.programs)) {
        if (!merged[platform]) {
          merged[platform] = [];
        }
        
        const seen = new Set(merged[platform].map(p => p.name.toLowerCase()));
        for (const program of programs) {
          if (!seen.has(program.name.toLowerCase())) {
            merged[platform].push(program);
            seen.add(program.name.toLowerCase());
          }
        }
      }
    }
  }
  
  return Object.keys(merged).length > 0 ? merged : undefined;
}

/**
 * Deduplicate images by URL
 */
function deduplicateImages(
  images: Array<{ url: string; alt: string; caption: string }>
): Array<{ url: string; alt: string; caption: string }> {
  const seen = new Set<string>();
  const deduplicated: Array<{ url: string; alt: string; caption: string }> = [];
  
  for (const image of images) {
    if (!seen.has(image.url)) {
      seen.add(image.url);
      deduplicated.push(image);
    }
  }
  
  return deduplicated;
}
