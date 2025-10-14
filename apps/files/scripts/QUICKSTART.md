# Quick Start Guide - File Type Scraper

This guide will help you get started with the file type scraper system in just a few minutes.

## Prerequisites

- Node.js 20 or higher
- pnpm package manager
- Internet connection

## Installation

The scraper system is already set up! All dependencies are installed with:

```bash
cd apps/files
pnpm install
```

## Basic Usage

### 1. Test a Single File Extension

Before scraping multiple extensions, test with a single one:

```bash
npm run test-scraper test pdf
```

This will:
- Scrape data from fileinfo.com, files.org, and fileformat.com
- Merge the data intelligently
- Display a detailed summary
- Show the full JSON output

### 2. Scrape Specific Extensions

To scrape and save data for specific file types:

```bash
npm run scrape -- -e pdf,docx,xlsx,jpg,mp3
```

This will:
- Scrape each extension from all three sources
- Merge the data
- Save JSON files to `public/data/files/individual/`
- Display progress and results

### 3. Update Existing Files

To update file types that already have data:

```bash
npm run scrape -- -e pdf,docx -u
```

The `-u` flag tells the scraper to update existing files.

### 4. Generate Index Files

After scraping, regenerate the index files:

```bash
npm run generate-indexes
```

This creates:
- `index.json` - All file types alphabetically
- `alphabet-index.json` - Grouped by first letter
- `categories/*.json` - Grouped by category
- `popular.json` - Top 100 by votes
- `search-index.json` - Optimized for search

## Common Workflows

### Workflow 1: Add New File Types

```bash
# 1. Scrape the new extensions
npm run scrape -- -e wav,ogg,flac

# 2. Regenerate indexes
npm run generate-indexes

# 3. Test the pages
npm run dev
```

### Workflow 2: Update Popular File Types

```bash
# 1. Update common file types
npm run scrape -- -e pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,png,gif,mp3,mp4 -u

# 2. Regenerate indexes
npm run generate-indexes
```

### Workflow 3: Batch Update All Files

```bash
# 1. Update all existing files (this will take a while!)
npm run scrape -- -u -b 5

# 2. Regenerate indexes
npm run generate-indexes
```

The `-b 5` flag processes 5 extensions at a time (default is 10).

## Advanced Options

### Scrape from Specific Sources

To use only certain data sources:

```bash
# Only fileinfo.com
npm run scrape -- -e txt -s fileinfo

# fileinfo.com and files.org only
npm run scrape -- -e txt -s fileinfo,files.org
```

### Custom Output Directory

```bash
npm run scrape -- -e pdf -o ./my-custom-dir
```

### Test Multiple Extensions

```bash
npm run test-scraper test-batch pdf,docx,txt,jpg,mp3
```

### Validate Existing Data

Check the quality of existing data files:

```bash
npm run test-scraper validate ./public/data/files/individual
```

## Understanding the Output

### Individual File Structure

Each file type is saved as `{extension}.json`:

```json
{
  "slug": "pdf",
  "extension": "pdf",
  "name": "Portable Document Format File",
  "category": "Page Layout Files",
  "category_slug": "page-layout-files",
  "summary": "A PDF file is...",
  "developer": "Adobe",
  "rating": 4,
  "votes": 4842,
  "more_information": {
    "content": ["...", "..."]
  },
  "how_to_open": {
    "instructions": ["..."],
    "programs": [
      { "name": "Adobe Acrobat Reader" }
    ]
  },
  "sources": [
    {
      "url": "https://fileinfo.com/extension/pdf",
      "retrieved_at": "2025-10-14T...",
      "scraper": "fileinfo.com"
    }
  ]
}
```

### Data Merging

When multiple sources provide data:
- **Name**: Uses the longest, most descriptive name
- **Summary**: Uses the most informative summary
- **Content**: Combines all unique content sections
- **Programs**: Merges and deduplicates program lists
- **Ratings**: Averages ratings from all sources
- **Sources**: Tracks all source URLs

## Troubleshooting

### "No data collected"

**Problem**: The scraper couldn't find data for the extension.

**Solutions**:
1. Check if the extension exists in the source websites
2. Try a different source: `npm run scrape -- -e xyz -s fileinfo`
3. Check network connectivity

### "Validation warnings"

**Problem**: Some optional fields are missing.

**Solution**: This is usually fine! The merger will fill gaps from other sources. If all sources fail, you may need to manually add data.

### "Rate limited"

**Problem**: Too many requests to the source website.

**Solutions**:
1. Wait a few minutes and try again
2. Increase rate limit in `scripts/config.ts`
3. Reduce batch size: `-b 3`

### "HTTP 404"

**Problem**: The source website doesn't have this extension.

**Solution**: Normal! Not all sources have all extensions. The merger will use data from available sources.

## Best Practices

### 1. Test Before Bulk Scraping

Always test a single extension first:
```bash
npm run test-scraper test pdf
```

### 2. Use Small Batches

Start with small batches to ensure everything works:
```bash
npm run scrape -- -e pdf,doc,txt -b 3
```

### 3. Regular Updates

Update popular file types monthly:
```bash
npm run scrape -- -e pdf,docx,xlsx,jpg,png,mp3,mp4 -u
```

### 4. Respect Rate Limits

The scraper has built-in rate limiting (2 seconds between requests). Don't modify this unless necessary.

### 5. Validate After Scraping

Always validate your data:
```bash
npm run test-scraper validate ./public/data/files/individual
```

## Next Steps

1. **Read the full README**: `apps/files/scripts/README.md`
2. **Check testing notes**: `apps/files/scripts/TESTING.md`
3. **Review the code**: Start with `scripts/scrape.ts`
4. **Customize scrapers**: Modify `scripts/scrapers/*.ts` as needed
5. **Contribute**: Add support for new sources!

## Quick Reference

```bash
# Test single extension
npm run test-scraper test <ext>

# Scrape extensions
npm run scrape -- -e <ext1,ext2>

# Update existing
npm run scrape -- -e <ext1,ext2> -u

# Generate indexes
npm run generate-indexes

# Validate data
npm run test-scraper validate <dir>

# Run example
npm run example
```

## Getting Help

- Check `README.md` for detailed documentation
- Review `TESTING.md` for production recommendations
- Open an issue on GitHub for support
- Check existing scraped data for examples

## Examples

### Example 1: Complete Workflow
```bash
# Add new audio formats
npm run scrape -- -e wav,ogg,flac,aac
npm run generate-indexes
npm run dev  # Test locally
```

### Example 2: Update Images
```bash
# Update image file types
npm run scrape -- -e jpg,png,gif,bmp,svg,webp -u
npm run generate-indexes
```

### Example 3: Quick Test
```bash
# Test the scraper is working
npm run test-scraper test pdf
```

Happy scraping! 🚀
