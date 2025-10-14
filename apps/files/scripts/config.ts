/**
 * Configuration for file type scrapers
 */

export const scraperConfig = {
  // Rate limiting (ms between requests)
  rateLimit: {
    fileinfo: 2000,      // 2 seconds
    filesOrg: 2000,      // 2 seconds
    fileformat: 1000     // 1 second (API might have limits)
  },
  
  // Retry settings
  maxRetries: 3,
  timeout: 10000, // 10 seconds
  
  // Batch processing
  defaultBatchSize: 10,
  
  // Concurrency settings
  concurrency: {
    enabled: false,           // Enable parallel scraping
    maxWorkers: 5,            // Number of concurrent requests per source
    useProxy: false,          // Use proxy rotation
  },
  
  // Zyte proxy configuration
  zyte: {
    enabled: false,           // Enable Zyte proxy
    apiKey: process.env.ZYTE_API_KEY || '',
    apiUrl: 'https://api.zyte.com/v1/extract',
    proxyUrl: `http://${process.env.ZYTE_API_KEY}:@proxy.zyte.com:8011`,
  },
  
  // Data directories
  dataDir: './public/data/files',
  individualDir: './public/data/files/individual',
  categoriesDir: './public/data/files/categories',
  
  // Output settings
  prettyJson: true,
  indentSpaces: 2,
  
  // Sources to use by default
  defaultSources: ['fileinfo', 'files.org', 'fileformat'] as const,
  
  // User agent for web requests
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  // Common file extensions to prioritize
  priorityExtensions: [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg',
    'mp3', 'mp4', 'avi', 'mov', 'wav',
    'zip', 'rar', '7z', 'tar', 'gz',
    'txt', 'csv', 'json', 'xml', 'html', 'css', 'js',
    'exe', 'dll', 'dmg', 'apk',
    'iso', 'img'
  ]
};

export type ScraperSource = typeof scraperConfig.defaultSources[number];
