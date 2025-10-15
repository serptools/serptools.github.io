# Multithreading and Zyte Proxy Support

This document explains the new concurrency and Zyte proxy features added to the scraper system.

## Overview

The scraper now supports:
1. **Multithreading (Concurrency)**: Process multiple extensions simultaneously
2. **Zyte Rotating Proxies**: Use Zyte's Smart Proxy Manager for faster, more reliable scraping

These features significantly speed up bulk scraping operations while maintaining respectful rate limiting practices.

## Performance Comparison

### Without Concurrency/Proxy (Original)
- **Rate**: ~6-10 seconds per extension (sequential with rate limiting)
- **10,477 extensions**: ~17-29 hours

### With Concurrency (5 workers)
- **Rate**: ~5x faster (5 extensions processed simultaneously)
- **10,477 extensions**: ~3.5-6 hours

### With Concurrency + Zyte Proxy (10 workers)
- **Rate**: ~10x faster (no rate limiting, rotating IPs)
- **10,477 extensions**: ~1.7-3 hours

## Usage

### Enable Concurrency

```bash
# Process 5 extensions at a time
npm run scrape -- -u -c 5

# Maximum parallelism (10 workers)
npm run scrape -- -u -c 10
```

### Enable Zyte Proxy

1. **Get your Zyte API key** from https://www.zyte.com/
   - Sign up for Zyte API (formerly Crawlera)
   - Get your API key from the dashboard
   - Ensure you have sufficient credits/quota

2. **Set the environment variable:**
   ```bash
   export ZYTE_API_KEY=your_api_key_here
   ```

3. **Run with proxy enabled:**
   ```bash
   npm run scrape -- -u -z
   ```

**Note**: The scraper uses Zyte's Automatic Extraction API which:
- Handles browser rendering automatically
- Bypasses bot detection and CAPTCHAs
- Rotates IPs automatically
- Costs credits per request (check your Zyte plan)
- Falls back to direct requests if Zyte fails

### Combined: Maximum Speed

```bash
# Set API key
export ZYTE_API_KEY=your_api_key_here

# Run with 10 workers + Zyte proxy
npm run scrape -- -u -c 10 -z

# Or inline:
ZYTE_API_KEY=your_key npm run scrape -- -u -c 10 -z

# Start with fewer workers to test
ZYTE_API_KEY=your_key npm run scrape -- -e pdf,docx,txt -c 3 -z
```

## Command Line Options

```bash
npm run scrape -- [options]

Options:
  -c, --concurrency <n>    Number of parallel workers (default: 1, max: 10)
  -z, --zyte-proxy         Enable Zyte rotating proxy
  -b, --batch-size <n>     Number of extensions per batch (default: 10)
  -e, --extensions <list>  Comma-separated list of extensions
  -u, --update             Update existing files
  -s, --sources <list>     Sources to use
  -o, --output <dir>       Output directory
```

## How It Works

### Concurrency

- Processes multiple extensions in parallel using `Promise.allSettled()`
- Divides batch into chunks of N extensions (concurrency level)
- Each worker independently scrapes from all 3 sources
- Results are collected and saved as they complete

### Zyte Proxy

- Uses Zyte's Smart Proxy Manager API
- Automatically rotates residential IPs
- Handles CAPTCHAs and bot detection
- Falls back to direct requests if Zyte fails
- No rate limiting needed (proxies handle this)

## Technical Details

### Concurrency Implementation

```typescript
// Sequential (original)
for (const ext of extensions) {
  await processSingleExtension(ext, sources);
}

// Parallel (new)
const chunks = chunkArray(extensions, concurrency);
for (const chunk of chunks) {
  await Promise.allSettled(
    chunk.map(ext => processSingleExtension(ext, sources))
  );
}
```

### Zyte Integration

```typescript
// Proxy configuration
interface ProxyConfig {
  useProxy: boolean;
  apiKey?: string;
}

// Enhanced fetch
async function fetchWithProxy(url, options, proxyConfig) {
  if (proxyConfig?.useProxy) {
    // Use Zyte API
    return await zyteExtract(url, proxyConfig.apiKey);
  }
  // Direct fetch
  return await fetch(url, options);
}
```

## Configuration

Settings in `scripts/config.ts`:

```typescript
export const scraperConfig = {
  // Concurrency settings
  concurrency: {
    enabled: false,
    maxWorkers: 5,
    useProxy: false,
  },
  
  // Zyte proxy configuration
  zyte: {
    enabled: false,
    apiKey: process.env.ZYTE_API_KEY || '',
    apiUrl: 'https://api.zyte.com/v1/extract',
  },
  
  // ... other settings
};
```

## Best Practices

### For Testing
```bash
# Start small
npm run scrape -- -e pdf,txt,jpg -c 3 -z
```

### For Bulk Scraping
```bash
# Use moderate concurrency
npm run scrape -- -u -c 5 -z -b 50
```

### For Maximum Speed
```bash
# Max workers + Zyte
ZYTE_API_KEY=your_key npm run scrape -- -u -c 10 -z -b 100
```

## Safety Features

1. **Concurrency Cap**: Maximum 10 workers to avoid overwhelming servers
2. **Rate Limiting**: Still applied when not using proxies
3. **Error Handling**: Failed requests don't block others
4. **Graceful Degradation**: Falls back to direct requests if Zyte fails
5. **API Key Validation**: Checks for ZYTE_API_KEY before enabling proxy

## Cost Considerations

### Zyte Pricing
- Pay per successful request
- Residential proxies are more expensive
- Check your Zyte plan limits
- Monitor usage in Zyte dashboard

### Recommendations
- Use concurrency without proxy for moderate speedup (free)
- Add Zyte proxy for maximum speed when needed
- Test with small batches first
- Set batch size based on your Zyte plan

## Troubleshooting

### "Concurrency capped at 10"
This is intentional to prevent overwhelming servers. Adjust if needed in config.

### "ZYTE_API_KEY environment variable is required"
Set your API key:
```bash
export ZYTE_API_KEY=your_actual_api_key
```

### "Zyte API failed, falling back to direct request"
This can happen for several reasons:

**Common Causes:**
1. **API Key Invalid**: Verify your key is correct
2. **Quota Exceeded**: Check your Zyte dashboard for remaining credits
3. **API Error**: Zyte API may be experiencing issues
4. **Network Issues**: Connection problems to Zyte servers
5. **Request Format**: The API request format may need adjustment

**Solution:**
The scraper automatically falls back to direct requests, so it will continue working. To resolve:
- Check your Zyte dashboard at https://app.zyte.com/
- Verify API key is active and has credits
- Review error messages in console for specific codes
- Try with a single extension first: `npm run scrape -- -e pdf -z`
- Check if browserHtml feature is enabled in your Zyte plan

**If seeing many retries:**
- Start with lower concurrency: `-c 3` instead of `-c 10`
- Test a single extension to verify Zyte is working
- Consider using concurrency without Zyte first

### Slow Performance with Concurrency
- Increase batch size: `-b 50` or `-b 100`
- Check network bandwidth
- Verify Zyte proxy is working: `-z` flag

### Rate Limiting Errors
- Reduce concurrency: `-c 3` instead of `-c 10`
- Enable Zyte proxy: `-z`
- Increase batch size to process fewer batches

### Too Many Retries
If you see many "Retry attempt" messages:
- The target websites may be blocking requests
- Enable Zyte proxy to bypass blocks: `-z`
- Reduce concurrency to be more respectful: `-c 3`
- Check if your IP is blocked (try different network)

## Examples

### Scenario 1: Update Popular Formats Quickly
```bash
npm run scrape -- -e pdf,docx,xlsx,jpg,png,mp3,mp4 -c 5 -u
```

### Scenario 2: Full A-Z with Maximum Speed
```bash
export ZYTE_API_KEY=your_key
npm run scrape -- -u -c 10 -z -b 100
```

### Scenario 3: Test New Extensions
```bash
npm run scrape -- -e wav,ogg,flac -c 3
```

### Scenario 4: Scrape Specific Category
```bash
npm run scrape -- -e mp3,wav,ogg,flac,aac,m4a,wma -c 5 -z
```

## Migration from Sequential

**Before:**
```bash
npm run scrape -- -u -b 5  # ~17-29 hours
```

**After (with concurrency):**
```bash
npm run scrape -- -u -c 5 -b 10  # ~3.5-6 hours
```

**After (with Zyte):**
```bash
ZYTE_API_KEY=key npm run scrape -- -u -c 10 -z -b 50  # ~1.7-3 hours
```

## Monitoring

Watch for:
- Success rate in console output
- Zyte dashboard for API usage
- Network bandwidth
- Disk I/O for saving files

## Future Enhancements

Possible improvements:
- Dynamic concurrency adjustment based on success rate
- Multiple Zyte accounts for load distribution
- Request queueing with priority
- Resume from checkpoint on failure
- Real-time progress dashboard

## Support

For issues:
1. Check Zyte dashboard for API errors
2. Verify API key is correct
3. Test with lower concurrency first
4. Review console logs for errors
5. Open GitHub issue with details
