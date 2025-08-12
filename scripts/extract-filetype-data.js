const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { SchemaValidator, SchemaMigration } = require('./validate-schema');

// Function to extract data from HTML file
function extractFileTypeData(htmlContent, filename = '') {
  try {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    // Extract basic information
    const title = document.querySelector('title')?.textContent || '';
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    
    // Extract extension from title - handle various formats
    let extension = '';
    const extensionMatch = title.match(/\.([a-z0-9]+)\s+[Ff]ile/i);
    if (extensionMatch) {
      extension = extensionMatch[1].toLowerCase();
    } else {
      // Fallback: try to get from title start
      const fallbackMatch = title.match(/^([A-Z0-9]+)\s+[Ff]ile/i);
      if (fallbackMatch) {
        extension = fallbackMatch[1].toLowerCase();
      }
    }
    
    // Skip if we couldn't extract an extension
    if (!extension) {
      console.error(`Could not extract extension from title: "${title}" (${filename})`);
      return null;
    }
    
    // Extract main heading and description
    const mainHeading = document.querySelector('h1')?.textContent || '';
    const summaryElement = document.querySelector('.infoBox p');
    const summary = summaryElement?.textContent || '';
    
    // Extract developer info
    const developerRow = Array.from(document.querySelectorAll('tr')).find(tr => 
      tr.querySelector('td')?.textContent?.includes('Developer')
    );
    const developer = developerRow?.querySelectorAll('td')[1]?.textContent?.trim() || '';
    
    // Extract popularity rating
    const popularityElement = document.querySelector('.popularity .voteavg');
    const votesElement = document.querySelector('.popularity .votetotal');
    const rating = popularityElement ? parseFloat(popularityElement.textContent) : null;
    const votes = votesElement ? parseInt(votesElement.textContent) : null;
    
    // Extract "What is" section
    const whatIsSection = document.querySelector('#portable_document_format_file_info ~ .infoBox p') ||
                         document.querySelector('.infoBox p');
    const whatIs = whatIsSection?.textContent || '';
    
    // Extract "More Information" section
    const moreInfoSection = document.querySelector('#portable_document_format_file_moreinfo .infoBox');
    const moreInfo = moreInfoSection?.textContent || '';
    
    // Extract "How to open" section
    const openSection = document.querySelector('#portable_document_format_file_open .infoBox');
    const howToOpen = openSection?.textContent || '';
    
    // Extract image/icon information
    const iconElement = document.querySelector('.entryIcon');
    const screenshotElement = document.querySelector('.baguetteBox img');
    const image = {
      icon: iconElement?.getAttribute('data-bg-lg') || iconElement?.getAttribute('data-bg') || '',
      screenshot: screenshotElement?.getAttribute('src') || '',
      screenshotCaption: document.querySelector('.caption')?.textContent?.trim() || ''
    };
    
    // Extract programs that open this file type
    const programsByPlatform = {};
    const platformSections = document.querySelectorAll('.programs[data-plat]');
    
    platformSections.forEach(section => {
      const platform = section.getAttribute('data-plat');
      const apps = [];
      
      const appElements = section.querySelectorAll('.app');
      appElements.forEach(app => {
        const nameElement = app.querySelector('.program a, .program .hlink');
        const licenseElement = app.querySelector('.license');
        
        if (nameElement) {
          apps.push({
            name: nameElement.textContent?.trim() || '',
            license: licenseElement?.textContent?.trim() || '',
            url: nameElement.getAttribute('href') || ''
          });
        }
      });
      
      if (apps.length > 0) {
        programsByPlatform[platform] = apps;
      }
    });
    
    // Extract all remaining text content as catchall
    const catchAllSections = [];
    
    // Get convert section if it exists
    const convertSection = document.querySelector('[id*="convert"]');
    if (convertSection) {
      catchAllSections.push({
        title: 'How to Convert',
        content: convertSection.textContent?.trim().substring(0, 1500) || ''
      });
    }
    
    // Get common filenames section if it exists
    const filenamesSection = document.querySelector('[id*="filenames"], .filenames');
    if (filenamesSection) {
      catchAllSections.push({
        title: 'Common Filenames',
        content: filenamesSection.textContent?.trim().substring(0, 1000) || ''
      });
    }
    
    // Get any additional sections not already captured
    const allSections = document.querySelectorAll('section');
    allSections.forEach(section => {
      const heading = section.querySelector('h3');
      if (heading && !heading.textContent?.match(/More Information|How to Open|Program List|How to Convert|Common Filenames/)) {
        const title = heading.textContent?.trim() || '';
        const content = section.textContent?.trim().substring(0, 1500) || '';
        if (title && content) {
          catchAllSections.push({ title, content });
        }
      }
    });
    
    // Extract category from footer
    let category = 'Misc Files';
    let categorySlug = 'misc';
    const footerElement = document.querySelector('footer.ftfooter');
    if (footerElement) {
      const categoryLink = footerElement.querySelector('a[href*="/filetypes/"]');
      if (categoryLink) {
        category = categoryLink.textContent?.trim() || 'Misc Files';
        const href = categoryLink.getAttribute('href') || '';
        const match = href.match(/\/filetypes\/([^\/]+)$/);
        if (match) {
          categorySlug = match[1];
        }
      }
    }
    
    // Find relevant tools on our site
    const relevantTools = findRelevantTools(extension);
    
    // Try to find the actual format name
    let formatName = 'File';
    
    // Common patterns for format names
    const bodyText = document.body?.textContent || '';
    const patterns = [
      new RegExp(`${extension.toUpperCase()} stands for ([^.]+?)(?:\\.|,|;|\\s+and|\\s+or|$)`, 'i'),
      new RegExp(`${extension.toUpperCase()} \\(([^)]+)\\)`, 'i'),
      new RegExp(`(\\b[A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+){0,4}) [Ff]ile`, '')
    ];
    
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match && match[1]) {
        formatName = match[1].trim();
        break;
      }
    }
    
    // Fallback to extension if no name found
    if (formatName === 'File') {
      formatName = extension.toUpperCase() + ' File';
    }
    
    return {
      extension,
      name: formatName,
      title,
      description,
      summary: summary.substring(0, 500) + (summary.length > 500 ? '...' : ''),
      category,
      categorySlug,
      developer,
      popularity: rating && votes ? { rating, votes } : null,
      image,
      whatIs: whatIs.substring(0, 1000) + (whatIs.length > 1000 ? '...' : ''),
      moreInfo: moreInfo.substring(0, 1000) + (moreInfo.length > 1000 ? '...' : ''),
      howToOpen: howToOpen.substring(0, 1000) + (howToOpen.length > 1000 ? '...' : ''),
      programsThatOpen: programsByPlatform,
      additionalSections: catchAllSections,
      relevantTools,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error(`Error extracting data from ${filename}: ${error.message}`);
    return null;
  }
}

// Main extraction function
function extractAllFileTypes() {
  const extensionDir = path.join(__dirname, '../.filetypes/extension');
  const outputDir = path.join(__dirname, '../public/data/filetypes');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const htmlFiles = fs.readdirSync(extensionDir).filter(file => file.endsWith('.html'));
  const allData = [];
  
  console.log(`Processing ${htmlFiles.length} HTML files...`);
  
  const validator = new SchemaValidator();
  const migration = new SchemaMigration();
  let validCount = 0;
  let errorCount = 0;
  
  for (const file of htmlFiles) {
    const filePath = path.join(extensionDir, file);
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const data = extractFileTypeData(htmlContent, file);
    
    if (data && data.extension) {
      // Apply migrations if needed
      const migratedData = migration.migrate(data);
      
      // Validate against schema
      const validation = validator.validateFileTypeData(migratedData, data.extension);
      
      if (validation.valid) {
        allData.push(migratedData);
        
        // Write individual file
        const outputFile = path.join(outputDir, `${migratedData.extension}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(migratedData, null, 2));
        
        console.log(`✅ ${migratedData.extension} - ${migratedData.name}`);
        validCount++;
      } else {
        console.log(`❌ ${data.extension} - Validation failed:`);
        validation.errors.forEach(error => console.log(`   ${error}`));
        errorCount++;
      }
    } else {
      console.log(`❌ ${file} - Extraction failed`);
      errorCount++;
    }
  }
  
  // Write main index file
  const indexData = allData.map(item => ({
    slug: item.extension,
    name: item.name,
    category: item.categorySlug || 'misc',
    categoryName: item.category || 'Misc Files',
    extension: item.extension,
    popularity: item.popularity,
    updated_at: item.lastUpdated,
    developer_org: item.developer?.toLowerCase().replace(/\s+/g, '-'),
    summary: item.summary
  })).sort((a, b) => a.slug.localeCompare(b.slug));
  
  fs.writeFileSync(
    path.join(outputDir, 'index.json'), 
    JSON.stringify(indexData, null, 2)
  );
  
  console.log(`\n📊 Extraction Summary:`);
  console.log(`   ✅ Valid: ${validCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📁 Data written to: ${outputDir}`);
  
  if (errorCount > 0) {
    console.log(`\n⚠️  ${errorCount} files had validation errors. Check logs above.`);
  }
}

// Function to find relevant tools on our site
function findRelevantTools(extension) {
  const tools = [
    // Image converters
    { id: 'heic-to-jpg', title: 'HEIC to JPG', from: 'heic', to: 'jpg', href: '/tools/heic-to-jpg' },
    { id: 'heic-to-jpeg', title: 'HEIC to JPEG', from: 'heic', to: 'jpeg', href: '/tools/heic-to-jpeg' },
    { id: 'heic-to-png', title: 'HEIC to PNG', from: 'heic', to: 'png', href: '/tools/heic-to-png' },
    { id: 'heic-to-pdf', title: 'HEIC to PDF', from: 'heic', to: 'pdf', href: '/tools/heic-to-pdf' },
    { id: 'pdf-to-jpg', title: 'PDF to JPG', from: 'pdf', to: 'jpg', href: '/tools/pdf-to-jpg' },
    { id: 'pdf-to-png', title: 'PDF to PNG', from: 'pdf', to: 'png', href: '/tools/pdf-to-png' },
    { id: 'webp-to-png', title: 'WebP to PNG', from: 'webp', to: 'png', href: '/tools/webp-to-png' },
    { id: 'jpeg-to-png', title: 'JPEG to PNG', from: 'jpeg', to: 'png', href: '/tools/jpeg-to-png' },
    { id: 'jpeg-to-jpg', title: 'JPEG to JPG', from: 'jpeg', to: 'jpg', href: '/tools/jpeg-to-jpg' },
    { id: 'jpeg-to-pdf', title: 'JPEG to PDF', from: 'jpeg', to: 'pdf', href: '/tools/jpeg-to-pdf' },
    { id: 'gif-to-png', title: 'GIF to PNG', from: 'gif', to: 'png', href: '/tools/gif-to-png' },
    { id: 'jpg-to-svg', title: 'JPG to SVG', from: 'jpg', to: 'svg', href: '/tools/jpg-to-svg' },
    { id: 'avif-to-png', title: 'AVIF to PNG', from: 'avif', to: 'png', href: '/tools/avif-to-png' },
    { id: 'jfif-to-jpg', title: 'JFIF to JPG', from: 'jfif', to: 'jpg', href: '/tools/jfif-to-jpg' },
    
    // Data tools
    { id: 'json-to-csv', title: 'JSON to CSV', from: 'json', to: 'csv', href: '/tools/json-to-csv' },
    { id: 'csv-combiner', title: 'CSV Combiner', from: 'csv', to: 'csv', href: '/tools/csv-combiner' },
    
    // Text tools
    { id: 'character-counter', title: 'Character Counter', from: 'txt', to: 'analysis', href: '/tools/character-counter' }
  ];
  
  const ext = extension.toLowerCase();
  const relevantTools = [];
  
  // Find tools where this extension is the source format
  const sourceTools = tools.filter(tool => tool.from === ext);
  if (sourceTools.length > 0) {
    relevantTools.push({
      category: 'Convert From',
      description: `Convert ${ext.toUpperCase()} files to other formats`,
      tools: sourceTools.map(tool => ({
        title: tool.title,
        href: tool.href,
        description: `Convert ${tool.from.toUpperCase()} to ${tool.to.toUpperCase()}`
      }))
    });
  }
  
  // Find tools where this extension is the target format
  const targetTools = tools.filter(tool => tool.to === ext);
  if (targetTools.length > 0) {
    relevantTools.push({
      category: 'Convert To',
      description: `Convert other formats to ${ext.toUpperCase()} files`,
      tools: targetTools.map(tool => ({
        title: tool.title,
        href: tool.href,
        description: `Convert ${tool.from.toUpperCase()} to ${tool.to.toUpperCase()}`
      }))
    });
  }
  
  // Special cases for related tools
  const specialCases = {
    'txt': [{ 
      category: 'Text Analysis', 
      description: 'Analyze text files',
      tools: [{ title: 'Character Counter', href: '/tools/character-counter', description: 'Count characters, words, and lines' }]
    }],
    'csv': [{ 
      category: 'Data Processing', 
      description: 'Process CSV data',
      tools: [{ title: 'CSV Combiner', href: '/tools/csv-combiner', description: 'Combine multiple CSV files' }]
    }]
  };
  
  if (specialCases[ext]) {
    relevantTools.push(...specialCases[ext]);
  }
  
  return relevantTools;
}

// Function to categorize file types
function categorizeFileType(extension, summary) {
  const ext = extension.toLowerCase();
  const text = summary.toLowerCase();
  
  // Image formats
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'svg', 'ico', 'psd', 'ai', 'eps'].includes(ext) ||
      text.includes('image') || text.includes('photo') || text.includes('picture')) {
    return 'images';
  }
  
  // Video formats
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', '3gp'].includes(ext) ||
      text.includes('video') || text.includes('movie') || text.includes('film')) {
    return 'video';
  }
  
  // Audio formats
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(ext) ||
      text.includes('audio') || text.includes('sound') || text.includes('music')) {
    return 'audio';
  }
  
  // Document formats
  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'].includes(ext) ||
      text.includes('document') || text.includes('text') || text.includes('word')) {
    return 'documents';
  }
  
  // Spreadsheet formats
  if (['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(ext) ||
      text.includes('spreadsheet') || text.includes('excel') || text.includes('table')) {
    return 'spreadsheets';
  }
  
  // Presentation formats
  if (['ppt', 'pptx', 'odp', 'key'].includes(ext) ||
      text.includes('presentation') || text.includes('powerpoint') || text.includes('slide')) {
    return 'presentations';
  }
  
  // Archive formats
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext) ||
      text.includes('archive') || text.includes('compressed') || text.includes('zip')) {
    return 'archives';
  }
  
  // Programming formats
  if (['js', 'html', 'css', 'php', 'py', 'java', 'cpp', 'c', 'h', 'json', 'xml', 'sql'].includes(ext) ||
      text.includes('code') || text.includes('script') || text.includes('programming')) {
    return 'programming';
  }
  
  // Game formats
  if (text.includes('game') || text.includes('save') || text.includes('level') || text.includes('mod')) {
    return 'games';
  }
  
  // System formats
  if (['exe', 'dll', 'sys', 'inf', 'reg', 'msi'].includes(ext) ||
      text.includes('system') || text.includes('executable') || text.includes('driver')) {
    return 'system';
  }
  
  // Default category
  return 'misc';
}

// Run the extraction
if (require.main === module) {
  extractAllFileTypes();
}

module.exports = { extractFileTypeData, extractAllFileTypes };