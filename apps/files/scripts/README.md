# File Type Scraper System

This directory contains a comprehensive scraping system for collecting file type information from multiple sources.

## Overview

The scraper system collects file type information from:
- **fileinfo.com** - Comprehensive file extension database
- **file.org (files.org)** - Alternative file extension information
- **fileformat.com** - File format specifications and API

All data is normalized, cleaned, merged, and stored in JSON format.

## Architecture

```
scripts/
├── config.ts                    # Configuration settings
├── types.ts                     # TypeScript type definitions
├── scrape.ts                    # Main orchestrator script
├── generate-indexes.ts          # Index generation
├── test-scraper.ts             # Testing and validation
├── scrapers/
│   ├── fileinfo-scraper.ts     # fileinfo.com scraper
│   ├── files-org-scraper.ts    # file.org scraper
│   └── fileformat-api.ts       # fileformat.com API client
└── utils/
    ├── scraper-utils.ts        # Utility functions
    └── data-merger.ts          # Data merging logic
```

## Installation

No additional dependencies are needed beyond the project's existing packages. The scrapers use native Node.js `fetch` API.

## Usage

### Quick Start

1. **Test a single file extension:**
   ```bash
   npm run test-scraper test pdf
   ```

2. **Scrape specific extensions:**
   ```bash
   npm run scrape -- -e pdf,docx,xlsx
   ```

3. **Scrape all extensions (update existing):**
   ```bash
   npm run scrape -- -u
   ```

4. **Generate index files:**
   ```bash
   npm run generate-indexes
   ```

### Command Line Options

#### Scraping (`npm run scrape`)

```bash
npm run scrape -- [options]

Options:
  -e, --extensions <ext1,ext2>  Comma-separated list of extensions to scrape
  -s, --sources <src1,src2>     Sources to use (fileinfo,files.org,fileformat)
  -o, --output <dir>            Output directory for JSON files
  -u, --update                  Update existing files
  -b, --batch-size <n>          Number of extensions per batch (default: 10)
  -h, --help                    Show help message
```

**Examples:**
```bash
# Scrape specific extensions from all sources
npm run scrape -- -e pdf,doc,txt

# Scrape using only fileinfo.com
npm run scrape -- -e xlsx -s fileinfo

# Update existing files
npm run scrape -- -e pdf,docx -u

# Scrape with custom batch size
npm run scrape -- -e pdf,doc,xls,ppt -b 2
```

#### Testing (`npm run test-scraper`)

```bash
npm run test-scraper <command> [options]

Commands:
  test <ext>              Test scraping a single extension
  test-batch <ext1,ext2>  Test scraping multiple extensions
  validate <directory>    Validate existing data files
```

**Examples:**
```bash
# Test single extension
npm run test-scraper test pdf

# Test multiple extensions
npm run test-scraper test-batch pdf,docx,xlsx

# Validate existing data
npm run test-scraper validate ./public/data/files/individual
```

## Data Schema

### Raw Scraped Data

```typescript
interface ScrapedFileData {
  extension: string;              // File extension (e.g., "pdf")
  name: string;                   // Full name (e.g., "Portable Document Format File")
  summary?: string;               // Brief description
  category?: string;              // Category name
  category_slug?: string;         // URL-friendly category
  developer?: string;             // Developer/creator
  rating?: number;                // Rating (1-5)
  votes?: number;                 // Number of votes
  more_information?: {
    content?: string[];           // Additional information paragraphs
    description?: string[];       // Detailed descriptions
    screenshot?: {
      url: string;
      alt: string;
      caption: string;
    };
  };
  technical_info?: {
    content?: string[];           // Technical specifications
  };
  how_to_open?: {
    instructions?: string[];      // Opening instructions
    programs?: Array<{
      name: string;
      url?: string;
    }>;
  };
  how_to_convert?: {
    instructions?: string[];      // Conversion instructions
  };
  programs?: {
    [platform: string]: Array<{  // Programs by platform
      name: string;
      url?: string;
      license?: string;
    }>;
  };
  sources?: Array<{
    url: string;                  // Source URL
    retrieved_at: string;         // Timestamp
    scraper: string;              // Source name
  }>;
}
```

### Merged Output Data

After scraping from multiple sources, data is merged into a comprehensive format that matches the existing `FileTypeRawData` interface used by the application.

## Data Flow

1. **Scraping**: Each scraper fetches data from its respective source
2. **Normalization**: Text is cleaned, HTML is stripped, data is standardized
3. **Merging**: Data from multiple sources is intelligently combined
4. **Validation**: Data is checked for completeness and consistency
5. **Storage**: Final JSON files are written to disk
6. **Indexing**: Index files are generated for fast lookups

## Data Merging Strategy

When multiple sources provide data for the same file type:

- **Name**: Use the longest, most descriptive name
- **Summary**: Use the longest, most informative summary
- **Developer**: Prefer most specific information
- **Ratings**: Average across sources
- **Content**: Merge and deduplicate all content sections
- **Programs**: Combine and deduplicate by name
- **Sources**: Track all source URLs and timestamps

## Best Practices

### Rate Limiting

The scrapers implement rate limiting to be respectful to the source websites:
- fileinfo.com: 2 seconds between requests
- file.org: 2 seconds between requests
- fileformat.com: 1 second between requests (API)

### Error Handling

- Automatic retry with exponential backoff (up to 3 attempts)
- Graceful degradation (partial data is better than no data)
- Detailed error logging

### Batch Processing

Process extensions in small batches to:
- Monitor progress
- Detect and handle errors early
- Avoid overwhelming source websites
- Allow for interruption and resumption

## Troubleshooting

### "No data collected"

This usually means:
1. The extension doesn't exist in the source databases
2. The source website structure has changed (scraper needs updating)
3. Network connectivity issues

### "HTTP 429: Too Many Requests"

You're being rate-limited. Solutions:
- Increase `rateLimit` values in config
- Reduce `batchSize`
- Wait before retrying

### "HTTP 404: Not Found"

The extension doesn't exist in that particular source. This is normal - not all sources have all extensions.

### Validation Warnings

These are informational and usually indicate:
- Missing optional fields
- Data that couldn't be extracted from a source
- Fields that will be filled from other sources during merging

## Extending the System

### Adding a New Scraper

1. Create a new file in `scrapers/` directory
2. Implement the scraper interface:
   ```typescript
   export async function scrapeNewSource(extension: string): Promise<ScraperResult>
   ```
3. Add parsing logic to extract data
4. Update `scrape.ts` to include the new source
5. Add tests in `test-scraper.ts`

### Modifying the Data Schema

1. Update `types.ts` with new fields
2. Update scrapers to extract the new data
3. Update `data-merger.ts` to merge the new fields
4. Update `apps/files/types/index.d.ts` if needed for the UI

## Maintenance

### Regular Updates

Run the scraper periodically to keep data fresh:
```bash
# Update all existing files
npm run scrape -- -u

# Regenerate indexes
npm run generate-indexes
```

### Data Quality

Periodically validate data quality:
```bash
npm run test-scraper validate ./public/data/files/individual
```

### Monitoring

Check logs for:
- Failed scrapes
- Validation warnings
- Changes in source website structure

## License

This scraper system is part of the serptools.github.io project.

## Notes

- Always respect robots.txt and terms of service
- Implement appropriate rate limiting
- Cache data to minimize repeated requests
- Be prepared to handle website structure changes
