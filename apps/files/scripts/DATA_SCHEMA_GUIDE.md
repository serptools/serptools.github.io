# File Type Scraper - Data Schema and Sources Guide

## File Types Page Schema

The scraper outputs data in the `FileTypeRawData` schema (defined in `apps/files/types/index.d.ts`), which is the format stored in JSON files at `public/data/files/individual/{extension}.json`.

### Complete Schema Structure

```typescript
interface FileTypeRawData {
  // Core identification
  slug: string;                    // URL-friendly identifier (e.g., "pdf")
  extension: string;               // File extension (e.g., "pdf")
  name: string;                    // Full name (e.g., "Portable Document Format File")
  
  // Categorization
  category?: string;               // Category name (e.g., "Page Layout Files")
  category_slug?: string;          // URL-friendly category (e.g., "page-layout-files")
  
  // Description
  summary?: string;                // Brief description/summary
  
  // Developer/Creator
  developer?: string;              // Developer name
  developer_org?: string;          // Organization name
  developer_name?: string;         // Developer full name
  developer_slug?: string;         // URL-friendly developer name
  
  // Popularity metrics
  rating?: number;                 // Rating (1-5 scale)
  votes?: number;                  // Number of votes
  popularity?: {
    rating: number;
    votes: number;
  };
  
  // Detailed information
  more_information?: {
    content?: string[];            // Additional info paragraphs
    description?: string[];        // Detailed descriptions
    screenshot?: {
      url: string;
      alt: string;
      caption: string;
    };
  };
  
  // Technical specifications
  technical_info?: {
    content?: string[];            // Technical details
  };
  
  // Usage instructions
  how_to_open?: {
    instructions?: string[];       // Opening instructions
    programs?: Array<{
      name: string;
      url?: string;
    }>;
  };
  
  how_to_convert?: {
    instructions?: string[];       // Conversion instructions
  };
  
  // Software support
  programs?: {
    [platform: string]: Array<{    // e.g., "Windows", "macOS", "Linux"
      name: string;
      url?: string;
      license?: string;
    }>;
  };
  
  // Media
  images?: Array<{
    url: string;
    alt: string;
    caption: string;
  }>;
  
  // Metadata
  common_filenames?: string[];     // Common filename examples
  updated_at?: string;             // Last update timestamp
  last_updated?: string;           // Human-readable update date
  
  // Source tracking
  sources?: Array<{
    url: string;                   // Source URL
    retrieved_at: string;          // ISO timestamp
  }>;
}
```

## Data Sources - What We Extract

### 1. fileinfo.com (Primary Source)

**URL Pattern**: `https://fileinfo.com/extension/{extension}`

**Data Extracted**:
- ✅ **Name**: Full file type name from `<h1>` tag
- ✅ **Summary**: Description from `.infoBox p`
- ✅ **Category**: From category links
- ✅ **Developer**: From developer section
- ✅ **Rating**: Numerical rating (1-5)
- ✅ **Votes**: Number of user votes
- ✅ **More Information**: Content paragraphs from `.moreInfo`
- ✅ **How to Open**: Instructions and program lists
- ✅ **Programs**: Compatible software with URLs

**HTML Selectors Used**:
```javascript
$('h1').first()                           // Name
$('.infoBox p').first()                   // Summary
$('a[href*="/filetypes/"]').first()       // Category
$('td:contains("Developer:")').next('td') // Developer
$('.rating').first()                      // Rating
$('.moreInfo p')                          // Info sections
$('ul li a, .programs a')                 // Programs
```

### 2. files.org (Alternative Source)

**URL Pattern**: `https://file.org/extension/{extension}`

**Data Extracted**:
- ✅ **Name**: File type name from `<h1>`
- ✅ **Summary**: From `.extension-description` or meta description
- ✅ **Category**: From `.category` span
- ✅ **Developer**: From "Developer:" text pattern
- ✅ **More Information**: Content from multiple sections
- ✅ **Technical Info**: Technical specifications
- ✅ **How to Open**: Opening instructions
- ✅ **Programs**: Software list with URLs
- ✅ **MIME Type**: MIME type information

**HTML Selectors Used**:
```javascript
$('h1').first()                                    // Name
$('.extension-description p').first()              // Summary
$('.category').first()                             // Category
$('h2, h3').each() + next elements                 // Sections
$('li a').each()                                   // Programs
```

### 3. fileformat.com (API + Web Fallback)

**Primary**: API endpoints (tried in order):
- `https://www.fileformat.com/api/v1/file-extension/{extension}`
- `https://fileformat.com/api/extension/{extension}`
- `https://api.fileformat.com/v1/format/{extension}`

**Fallback**: Web scraping from `https://docs.fileformat.com/extension/{extension}/`

**Data Extracted**:
- ✅ **Name**: File type name
- ✅ **Summary**: Description from meta tag
- ✅ **Category**: Category classification
- ✅ **Developer**: Creator/company info
- ✅ **MIME Type**: MIME type from API or text
- ✅ **Technical Info**: Specifications
- ✅ **Programs**: Software by platform (from API)
- ✅ **Content**: Main content paragraphs

**API Response Fields Mapped**:
```javascript
json.name / json.title / json.fullName     → name
json.description / json.summary            → summary
json.category                              → category
json.developer / json.creator / json.company → developer
json.mimeType / json.mime_type             → mime_type
json.programs / json.applications          → programs (by platform)
```

## Data Merging Strategy

When data comes from multiple sources, the merger (`data-merger.ts`) combines them intelligently:

### Priority Rules:
1. **Name**: Longest, most descriptive name wins
2. **Summary**: Longest, most informative summary selected
3. **Developer**: Most specific information preferred
4. **Content**: All unique paragraphs merged and deduplicated
5. **Programs**: Combined by platform, deduplicated by name
6. **Ratings**: Averaged across all sources
7. **Sources**: All source URLs and timestamps tracked

### Example Merge:
```javascript
// fileinfo.com provides:
{
  name: "PDF File",
  rating: 4.2,
  votes: 5000,
  content: ["Info A", "Info B"]
}

// files.org provides:
{
  name: "Portable Document Format File",  // ← Longer, used
  rating: 4.0,
  votes: 3000,
  content: ["Info B", "Info C"]
}

// Merged result:
{
  name: "Portable Document Format File",  // Best from files.org
  rating: 4.1,                             // Average: (4.2 + 4.0) / 2
  votes: 4000,                             // Average: (5000 + 3000) / 2
  content: ["Info A", "Info B", "Info C"], // Deduplicated union
  sources: [
    { url: "https://fileinfo.com/...", ... },
    { url: "https://file.org/...", ... }
  ]
}
```

## How to Run Scrapes

### 1. Scrape Specific Extensions
```bash
npm run scrape -- -e pdf,docx,xlsx
```

### 2. Scrape A-Z Everything (All 10,477+ Extensions)

**Option A: Update All Existing Files**
```bash
npm run scrape -- -u
```
This reads all extensions from `public/data/files/individual/` and re-scrapes them.

**Option B: Scrape from Index**
```bash
npm run scrape
```
Without `-e` flag, it loads all extensions from the existing index.

**Option C: Scrape All with Custom Batch Size**
```bash
npm run scrape -- -u -b 5
```
Process 5 at a time (safer for rate limiting).

### 3. Scrape Only New (Missing) Extensions
```bash
npm run scrape
```
Without `-u` flag, skips existing files.

### 4. Scrape from Specific Sources Only
```bash
npm run scrape -- -e pdf -s fileinfo,files.org
```
Excludes fileformat.com from the scrape.

### 5. Generate Indexes After Scraping
```bash
npm run generate-indexes
```
Creates:
- `index.json` (all extensions alphabetically)
- `alphabet-index.json` (grouped by first letter)
- `categories/*.json` (grouped by category)
- `popular.json` (top 100 by votes)
- `search-index.json` (search-optimized)

## Complete A-Z Scraping Workflow

```bash
# Step 1: Test with a few extensions first
npm run test-scraper test-batch pdf,txt,jpg,mp3

# Step 2: Scrape all extensions (this will take hours!)
# Recommended: Use small batch size for safety
npm run scrape -- -u -b 5

# Step 3: Regenerate all indexes
npm run generate-indexes

# Step 4: Validate the data
npm run test-scraper validate ./public/data/files/individual
```

## Performance Estimates

With current rate limiting (2 seconds between requests):
- **1 extension**: ~6-10 seconds (3 sources × 2-3s each)
- **100 extensions**: ~10-17 minutes
- **1,000 extensions**: ~1.7-2.8 hours
- **10,477 extensions**: ~17-29 hours (full A-Z)

Batch size affects memory but not total time (rate limiting is the bottleneck).

## Tips for A-Z Scraping

1. **Start Small**: Test with `-e a,b,c` first
2. **Use Small Batches**: `-b 5` or `-b 10` max
3. **Monitor Progress**: Watch the console output
4. **Resume Capability**: If interrupted, re-run without `-u` to skip completed
5. **Validate After**: Run `npm run test-scraper validate` to check quality
6. **Generate Indexes**: Always run `npm run generate-indexes` after scraping

## Schema Compatibility

The scraper output (`MergedFileData`) is compatible with the existing `FileTypeRawData` schema used throughout the application. The transformer (`files-transformer.ts`) converts it to `FileTypeTemplateData` for page display.

**Data Flow**:
```
Scrapers → MergedFileData → JSON Files (FileTypeRawData) → Transformer → FileTypeTemplateData → UI
```
