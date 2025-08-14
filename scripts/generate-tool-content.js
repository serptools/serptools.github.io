const fs = require('fs');

// Format information database
const formatInfo = {
  // Image formats
  jpg: { 
    fullName: 'Joint Photographic Experts Group',
    description: 'The most widely used lossy compression format for digital images',
    features: ['Excellent compression', 'Universal compatibility', 'Good for photographs', 'No transparency support', 'Lossy compression']
  },
  jpeg: {
    fullName: 'Joint Photographic Experts Group',
    description: 'Same as JPG, just a different extension name',
    features: ['Identical to JPG format', 'Universal support', 'Lossy compression', 'Good for photos', 'Small file sizes']
  },
  png: {
    fullName: 'Portable Network Graphics',
    description: 'Lossless compression format with transparency support',
    features: ['Lossless compression', 'Transparency support', 'Better for graphics', 'Larger file sizes', 'Web-friendly']
  },
  webp: {
    fullName: 'Web Picture Format',
    description: 'Modern format by Google with superior compression',
    features: ['25-35% smaller than JPEG/PNG', 'Supports animation', 'Transparency support', 'Both lossy and lossless', 'Growing browser support']
  },
  gif: {
    fullName: 'Graphics Interchange Format',
    description: 'Legacy format known for animations and simple graphics',
    features: ['Animation support', '256 color limit', 'Lossless compression', 'Small file sizes for simple images', 'Universal support']
  },
  avif: {
    fullName: 'AV1 Image File Format',
    description: 'Next-generation image format with exceptional compression',
    features: ['50% smaller than JPEG', 'HDR support', 'Transparency support', 'Based on AV1 video codec', 'Growing browser support']
  },
  bmp: {
    fullName: 'Bitmap Image File',
    description: 'Uncompressed raster graphics format by Microsoft',
    features: ['No compression', 'Large file sizes', 'Perfect quality', 'Simple structure', 'Windows native format']
  },
  ico: {
    fullName: 'Icon File',
    description: 'Container format for Windows icons',
    features: ['Multiple resolutions', 'Transparency support', 'Used for favicons', 'Windows application icons', 'Small file sizes']
  },
  cr2: {
    fullName: 'Canon Raw Version 2',
    description: "Canon's proprietary RAW image format",
    features: ['Unprocessed sensor data', 'Non-destructive editing', 'High quality', 'Large file sizes', 'Professional photography']
  },
  cr3: {
    fullName: 'Canon Raw Version 3',
    description: "Canon's latest RAW format with improved features",
    features: ['Better compression than CR2', 'C-RAW option', 'HEIF-based container', 'Metadata support', 'Professional quality']
  },
  dng: {
    fullName: 'Digital Negative',
    description: "Adobe's open-source RAW image format",
    features: ['Universal RAW format', 'Lossless compression', 'Metadata preservation', 'Wide software support', 'Archival quality']
  },
  arw: {
    fullName: 'Sony Alpha Raw',
    description: "Sony's proprietary RAW image format",
    features: ['Uncompressed sensor data', '14-bit color depth', 'Non-destructive editing', 'Professional quality', 'Sony camera specific']
  },
  pdf: {
    fullName: 'Portable Document Format',
    description: 'Universal document format by Adobe',
    features: ['Document preservation', 'Cross-platform', 'Print-ready', 'Security features', 'Mixed content support']
  },
  // Video formats
  mkv: {
    fullName: 'Matroska Video',
    description: 'Open-source container format supporting multiple streams',
    features: ['Multiple audio/subtitle tracks', 'Chapter markers', 'High quality', 'Open source', 'Flexible container']
  },
  mp4: {
    fullName: 'MPEG-4 Part 14',
    description: 'The most widely supported video container format',
    features: ['Universal compatibility', 'Good compression', 'Streaming support', 'Metadata support', 'H.264/H.265 codec support']
  },
  webm: {
    fullName: 'Web Media',
    description: 'Open-source format optimized for web streaming',
    features: ['Royalty-free', 'Web-optimized', 'VP8/VP9 codecs', 'HTML5 support', 'Good compression']
  },
  avi: {
    fullName: 'Audio Video Interleave',
    description: 'Legacy Microsoft video container format',
    features: ['Wide compatibility', 'Simple structure', 'Large file sizes', 'Multiple codec support', 'Windows native']
  },
  mov: {
    fullName: 'QuickTime Movie',
    description: "Apple's multimedia container format",
    features: ['Apple ecosystem', 'Professional editing', 'Multiple tracks', 'High quality', 'QuickTime compatible']
  },
  // Audio formats
  mp3: {
    fullName: 'MPEG-1 Audio Layer 3',
    description: 'The most popular lossy audio compression format',
    features: ['Universal support', 'Small file sizes', 'Good quality', 'Metadata support', 'Streaming friendly']
  },
  wav: {
    fullName: 'Waveform Audio File Format',
    description: 'Uncompressed audio format with perfect quality',
    features: ['Uncompressed audio', 'Perfect quality', 'Large file sizes', 'Professional standard', 'Windows native']
  },
  ogg: {
    fullName: 'Ogg Vorbis',
    description: 'Open-source audio format with good compression',
    features: ['Open source', 'Better than MP3', 'Smaller files', 'No patents', 'Good streaming']
  }
};

// Generate content for a tool
function generateToolContent(toolId, name, from, to, description) {
  const fromInfo = formatInfo[from] || {};
  const toInfo = formatInfo[to] || {};
  
  // Special handling for optimizer tools
  const isOptimizer = from === to;
  
  return {
    tool: {
      title: name,
      subtitle: isOptimizer 
        ? `Optimize and compress ${from.toUpperCase()} files without quality loss. Reduce file sizes while maintaining image quality.`
        : description || `Convert ${fromInfo.fullName || from.toUpperCase()} files to ${toInfo.fullName || to.toUpperCase()} format quickly and securely in your browser.`,
      from: from,
      to: to
    },
    videoSection: {
      embedId: `${from}-to-${to}-tutorial`
    },
    faqs: generateFAQs(from, to, fromInfo, toInfo, isOptimizer),
    aboutSection: generateAboutSection(from, to, fromInfo, toInfo, isOptimizer),
    changelog: [
      {
        date: "January 2025",
        changes: [
          `Launched ${name} converter`,
          "Added batch processing support",
          "Implemented privacy-first browser conversion"
        ]
      }
    ],
    relatedTools: generateRelatedTools(from, to),
    blogPosts: generateBlogPosts(name, from, to, isOptimizer)
  };
}

// Generate FAQs based on format types
function generateFAQs(from, to, fromInfo, toInfo, isOptimizer) {
  const faqs = [];
  
  if (isOptimizer) {
    faqs.push(
      {
        question: `Why optimize ${from.toUpperCase()} files?`,
        answer: `Optimizing ${from.toUpperCase()} files reduces their size without visible quality loss, making them faster to load on websites, easier to share via email, and taking up less storage space.`
      },
      {
        question: "How much can file size be reduced?",
        answer: "Typically 20-80% size reduction depending on the original file. Our optimizer uses smart compression algorithms to maintain visual quality while minimizing file size."
      },
      {
        question: "Will optimization affect image quality?",
        answer: "Our optimizer uses lossless compression techniques when possible, ensuring no visible quality loss. You can also adjust compression levels to balance size and quality."
      }
    );
  } else {
    faqs.push(
      {
        question: `What is ${from.toUpperCase()} format?`,
        answer: fromInfo.description || `${from.toUpperCase()} is a file format commonly used for digital content. It has specific characteristics that make it suitable for certain use cases.`
      },
      {
        question: `Why convert ${from.toUpperCase()} to ${to.toUpperCase()}?`,
        answer: `Converting from ${from.toUpperCase()} to ${to.toUpperCase()} can provide benefits like ${
          toInfo.features ? toInfo.features.slice(0, 3).join(', ').toLowerCase() : 'better compatibility, smaller file sizes, or additional features'
        }.`
      },
      {
        question: `Will I lose quality during conversion?`,
        answer: generateQualityAnswer(from, to, fromInfo, toInfo)
      }
    );
  }
  
  // Common FAQs
  faqs.push(
    {
      question: "Is my data secure?",
      answer: "Yes! All conversions happen locally in your browser. Your files never leave your device and aren't uploaded to any server, ensuring complete privacy and security."
    },
    {
      question: "Can I convert multiple files at once?",
      answer: "Yes! You can select and convert multiple files simultaneously. Each file is processed individually and downloaded automatically when ready."
    },
    {
      question: "What's the maximum file size?",
      answer: "Since processing happens in your browser, the limit depends on your device's available memory. Most modern devices can handle files up to several hundred megabytes."
    }
  );
  
  return faqs;
}

// Generate quality loss answer based on format types
function generateQualityAnswer(from, to, fromInfo, toInfo) {
  const fromLossy = ['jpg', 'jpeg', 'mp3', 'mp4', 'webp'].includes(from);
  const toLossy = ['jpg', 'jpeg', 'mp3', 'mp4', 'webp'].includes(to);
  const fromLossless = ['png', 'bmp', 'wav', 'flac'].includes(from);
  const toLossless = ['png', 'bmp', 'wav', 'flac'].includes(to);
  
  if (fromLossless && toLossy) {
    return `Converting from lossless ${from.toUpperCase()} to ${to.toUpperCase()} involves compression, which may result in some quality loss. We use optimal settings to minimize any visible differences.`;
  } else if (fromLossy && toLossless) {
    return `Converting from ${from.toUpperCase()} to ${to.toUpperCase()} won't improve quality beyond the original, but it will preserve the current quality without further loss.`;
  } else if (fromLossy && toLossy) {
    return `Some quality loss may occur when converting between compressed formats. We optimize settings to maintain the best possible quality during conversion.`;
  } else {
    return `The conversion maintains optimal quality. We use high-quality settings to ensure the best possible output while keeping file sizes reasonable.`;
  }
}

// Generate about section
function generateAboutSection(from, to, fromInfo, toInfo, isOptimizer) {
  if (isOptimizer) {
    return {
      title: `${from.toUpperCase()} Optimization: Reducing File Sizes Intelligently`,
      fromFormat: {
        name: `Original ${from.toUpperCase()}`,
        fullName: fromInfo.fullName || from.toUpperCase(),
        description: "Your original file before optimization",
        details: [
          "Original quality preserved",
          "Metadata maintained",
          "Full resolution",
          "Unoptimized file size",
          "May contain redundant data"
        ]
      },
      toFormat: {
        name: `Optimized ${to.toUpperCase()}`,
        fullName: fromInfo.fullName || to.toUpperCase(),
        description: "Your file after smart optimization",
        details: [
          "Reduced file size",
          "Maintained visual quality",
          "Faster loading times",
          "Optimized for web use",
          "Efficient compression"
        ]
      }
    };
  }
  
  return {
    title: `${from.toUpperCase()} vs ${to.toUpperCase()}: Understanding the Formats`,
    fromFormat: {
      name: from.toUpperCase(),
      fullName: fromInfo.fullName || from.toUpperCase(),
      description: fromInfo.description || `${from.toUpperCase()} is a widely used file format`,
      details: fromInfo.features || [
        "Established format",
        "Wide compatibility",
        "Specific use cases",
        "Various features",
        "Common standard"
      ]
    },
    toFormat: {
      name: to.toUpperCase(),
      fullName: toInfo.fullName || to.toUpperCase(),
      description: toInfo.description || `${to.toUpperCase()} is a versatile file format`,
      details: toInfo.features || [
        "Target format",
        "Specific benefits",
        "Use case optimized",
        "Feature set",
        "Compatibility"
      ]
    }
  };
}

// Generate related tools
function generateRelatedTools(from, to) {
  const tools = [];
  
  // Add variations of the same conversion
  if (from === 'jpg') {
    tools.push({ title: `JPEG to ${to.toUpperCase()}`, href: `/tools/jpeg-to-${to}` });
  } else if (from === 'jpeg') {
    tools.push({ title: `JPG to ${to.toUpperCase()}`, href: `/tools/jpg-to-${to}` });
  }
  
  // Add reverse conversion
  if (from !== to) {
    tools.push({ title: `${to.toUpperCase()} to ${from.toUpperCase()}`, href: `/tools/${to}-to-${from}` });
  }
  
  // Add similar format conversions
  const imageFormats = ['jpg', 'png', 'webp', 'gif', 'bmp'];
  const videoFormats = ['mp4', 'webm', 'avi', 'mov', 'mkv'];
  const audioFormats = ['mp3', 'wav', 'ogg', 'flac'];
  
  if (imageFormats.includes(from)) {
    const otherFormats = imageFormats.filter(f => f !== from && f !== to);
    tools.push(...otherFormats.slice(0, 2).map(f => ({
      title: `${from.toUpperCase()} to ${f.toUpperCase()}`,
      href: `/tools/${from}-to-${f}`
    })));
  }
  
  if (videoFormats.includes(from)) {
    const otherFormats = videoFormats.filter(f => f !== from && f !== to);
    tools.push(...otherFormats.slice(0, 2).map(f => ({
      title: `${from.toUpperCase()} to ${f.toUpperCase()}`,
      href: `/tools/${from}-to-${f}`
    })));
  }
  
  return tools.slice(0, 4); // Limit to 4 related tools
}

// Generate blog posts
function generateBlogPosts(name, from, to, isOptimizer) {
  const posts = [];
  
  if (isOptimizer) {
    posts.push(
      {
        title: `How to Optimize ${from.toUpperCase()} Files for Web`,
        subtitle: "Optimization Guide",
        description: `Learn the best practices for optimizing ${from.toUpperCase()} files to improve website performance and user experience.`,
        href: "#",
        category: "OPTIMIZATION GUIDES"
      },
      {
        title: `${from.toUpperCase()} Compression Techniques Explained`,
        subtitle: "Technical Deep Dive",
        description: "Understanding different compression methods and how to choose the right settings for your needs.",
        href: "#",
        category: "TECHNICAL GUIDES"
      }
    );
  } else {
    posts.push(
      {
        title: `Converting ${from.toUpperCase()} to ${to.toUpperCase()}: Complete Guide`,
        subtitle: "Conversion Tutorial",
        description: `Step-by-step guide to converting ${from.toUpperCase()} files to ${to.toUpperCase()} format with best practices and tips.`,
        href: "#",
        category: "HOW TO CONVERT FILES"
      },
      {
        title: `${from.toUpperCase()} vs ${to.toUpperCase()}: Which Format to Choose?`,
        subtitle: "Format Comparison",
        description: `Detailed comparison of ${from.toUpperCase()} and ${to.toUpperCase()} formats, including use cases, advantages, and limitations.`,
        href: "#",
        category: "FORMAT GUIDES"
      },
      {
        title: `Batch Convert ${from.toUpperCase()} Files`,
        subtitle: "Productivity Tips",
        description: `Learn how to efficiently convert multiple ${from.toUpperCase()} files at once, saving time and effort.`,
        href: "#",
        category: "PRODUCTIVITY"
      }
    );
  }
  
  return posts;
}

// Main execution
const toolsData = JSON.parse(fs.readFileSync('./data/tools.json', 'utf8'));

// Tools that need content
const toolsToUpdate = [
  'jpg-to-pdf', 'jpg-to-png', 'png-to-jpg', 'png-to-webp', 'jpg-to-webp',
  'jpeg-to-webp', 'gif-to-webp', 'avif-to-jpeg', 'bmp-to-jpg', 'bmp-to-png',
  'ico-to-png', 'gif-to-jpg', 'cr2-to-jpg', 'cr3-to-jpg', 'dng-to-jpg',
  'arw-to-jpg', 'png-to-png', 'mkv-to-mp4', 'mkv-to-webm', 'mkv-to-avi',
  'mkv-to-mov', 'mkv-to-gif', 'mkv-to-mp3', 'mkv-to-wav', 'mkv-to-ogg'
];

// Update tools with content
let updatedCount = 0;
toolsData.forEach(tool => {
  if (toolsToUpdate.includes(tool.id) && !tool.content) {
    tool.content = generateToolContent(tool.id, tool.name, tool.from, tool.to, tool.description);
    updatedCount++;
    console.log(`✅ Generated content for: ${tool.name}`);
  }
});

// Save updated tools data
fs.writeFileSync('./data/tools.json', JSON.stringify(toolsData, null, 2));

console.log(`\n🎉 Successfully generated content for ${updatedCount} tools!`);
console.log('The tools.json file has been updated with full landing page content.');