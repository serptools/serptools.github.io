export type ToolContent = {
  tool: {
    title: string;
    subtitle: string;
    from: string;
    to: string;
    accept?: string;
  };
  videoSection?: {
    embedId?: string;
  };
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  aboutSection?: {
    title: string;
    fromFormat: {
      name: string;
      fullName: string;
      description: string;
      details?: string[];
    };
    toFormat: {
      name: string;
      fullName: string;
      description: string;
      details?: string[];
    };
  };
  changelog?: Array<{
    date: string;
    changes: string[];
  }>;
  relatedTools?: Array<{
    title: string;
    href: string;
    description?: string;
  }>;
  blogPosts?: Array<{
    title: string;
    subtitle: string;
    description: string;
    href: string;
    category?: string;
    image?: string;
  }>;
};

export const toolContent: Record<string, ToolContent> = {
  "avif-to-jpg": {
    tool: {
      title: "AVIF to JPG",
      subtitle: "Convert AVIF images to JPG format instantly in your browser.",
      from: "avif",
      to: "jpg",
    },
    videoSection: {
      embedId: "dQw4w9WgXcQ", // Replace with actual video ID
    },
    faqs: [
      {
        question: "What is AVIF format?",
        answer: "AVIF (AV1 Image File Format) is a modern image format that provides superior compression compared to JPEG, PNG, and even WebP. It was developed by the Alliance for Open Media and supports both lossy and lossless compression.",
      },
      {
        question: "Why convert AVIF to JPG?",
        answer: "While AVIF offers better compression and quality, JPG/JPEG is still the most widely supported image format across all devices, browsers, and applications. Converting AVIF to JPG ensures maximum compatibility for sharing and viewing images.",
      },
      {
        question: "Is the conversion done on my device?",
        answer: "Yes! All conversions happen directly in your browser. Your images never leave your device, ensuring complete privacy and security. No files are uploaded to any server.",
      },
      {
        question: "What's the maximum file size I can convert?",
        answer: "Our converter can handle files up to 50MB each. For larger files, consider using desktop software or breaking them into smaller batches.",
      },
      {
        question: "Will I lose quality when converting from AVIF to JPG?",
        answer: "Some quality loss may occur since JPG uses different compression algorithms than AVIF. However, we optimize the conversion to maintain the best possible quality while keeping file sizes reasonable.",
      },
      {
        question: "Can I convert multiple AVIF files at once?",
        answer: "Yes! You can select or drag multiple AVIF files to convert them all to JPG format in one batch. Each file will be processed and downloaded individually.",
      },
    ],
    aboutSection: {
      title: "Understanding AVIF and JPG Formats",
      fromFormat: {
        name: "AVIF",
        fullName: "AV1 Image File Format",
        description: "AVIF is a cutting-edge image format based on the AV1 video codec. It delivers exceptional compression efficiency, supporting features like HDR, wide color gamut, and transparency, making it ideal for modern web applications.",
        details: [
          "Up to 50% smaller file sizes compared to JPEG",
          "Supports both lossy and lossless compression",
          "HDR and wide color gamut support",
          "Transparency (alpha channel) support",
          "Better quality at lower bitrates",
        ],
      },
      toFormat: {
        name: "JPG",
        fullName: "Joint Photographic Experts Group",
        description: "JPEG/JPG is the most widely used image format for photographs and realistic images. Despite being developed in 1992, it remains the standard for digital photography and web images due to its universal support.",
        details: [
          "Universal compatibility across all devices",
          "Efficient compression for photographs",
          "Adjustable quality settings",
          "No transparency support",
          "Progressive loading capability",
        ],
      },
    },
    changelog: [
      {
        date: "December 2024",
        changes: [
          "Added batch processing for multiple AVIF files",
          "Improved conversion speed by 40%",
          "Added drag and drop functionality",
          "Fixed memory leak issues with large files",
        ],
      },
      {
        date: "November 2024",
        changes: [
          "Initial release of AVIF to JPG converter",
          "Added support for HDR AVIF images",
          "Implemented client-side conversion for privacy",
          "Added progress indicators for large files",
        ],
      },
      {
        date: "October 2024",
        changes: [
          "Beta testing phase completed",
          "Optimized WASM module for faster processing",
          "Added error handling for corrupted files",
          "Improved UI/UX based on user feedback",
        ],
      },
    ],
    relatedTools: [
      { title: "AVIF to PNG", href: "/tools/avif-to-png" },
      { title: "JPG to AVIF", href: "/tools/jpg-to-avif" },
      { title: "HEIC to JPG", href: "/tools/heic-to-jpg" },
      { title: "WebP to JPG", href: "/tools/webp-to-jpg" },
      { title: "PNG to JPG", href: "/tools/png-to-jpg" },
      { title: "AVIF to WebP", href: "/tools/avif-to-webp" },
      { title: "JPEG to PNG", href: "/tools/jpeg-to-png" },
      { title: "BMP to JPG", href: "/tools/bmp-to-jpg" },
      { title: "GIF to JPG", href: "/tools/gif-to-jpg" },
      { title: "ICO to PNG", href: "/tools/ico-to-png" },
      { title: "HEIF to JPG", href: "/tools/heif-to-jpg" },
      { title: "PDF to JPG", href: "/tools/pdf-to-jpg" },
    ],
    blogPosts: [
      {
        title: "AVIF vs JPEG: Complete Comparison Guide",
        subtitle: "Image Format Showdown",
        description: "Detailed comparison of AVIF and JPEG formats, including file sizes, quality, browser support, and when to use each format for optimal results.",
        href: "/blog/avif-vs-jpeg-comparison",
        category: "HOW TO CONVERT IMAGE FILES",
      },
      {
        title: "How to Batch Convert AVIF Images",
        subtitle: "Bulk Conversion Tutorial",
        description: "Learn efficient methods to convert multiple AVIF files at once, saving time when processing large image libraries or photo collections.",
        href: "/blog/batch-convert-avif",
        category: "HOW TO CONVERT IMAGE FILES",
      },
      {
        title: "Optimizing Images for Web: AVIF Best Practices",
        subtitle: "Web Performance Guide",
        description: "Discover how to properly implement AVIF images on your website with fallbacks, responsive images, and progressive enhancement techniques.",
        href: "/blog/avif-web-optimization",
        category: "WEB OPTIMIZATION",
      },
    ],
  },
  
  "heic-to-jpg": {
    tool: {
      title: "HEIC to JPG",
      subtitle: "Convert Apple HEIC images to universally compatible JPG format.",
      from: "heic",
      to: "jpg",
    },
    videoSection: {
      embedId: "example-video-id",
    },
    faqs: [
      {
        question: "What is HEIC format?",
        answer: "HEIC (High Efficiency Image Container) is Apple's default image format for photos taken on iPhone and iPad devices running iOS 11 or later. It uses HEIF (High Efficiency Image Format) compression to save storage space while maintaining high quality.",
      },
      {
        question: "Why do I need to convert HEIC to JPG?",
        answer: "While HEIC offers excellent compression, many devices, applications, and websites don't support it. Converting to JPG ensures your photos can be viewed and shared on any platform without compatibility issues.",
      },
      {
        question: "Will converting HEIC to JPG reduce quality?",
        answer: "Our converter maintains optimal quality during conversion. While JPG uses different compression, we ensure minimal quality loss while producing files that work everywhere.",
      },
      {
        question: "Can I batch convert multiple HEIC files?",
        answer: "Yes! You can drag and drop or select multiple HEIC files to convert them all to JPG at once. Each file is processed individually and downloaded automatically.",
      },
      {
        question: "Is my privacy protected?",
        answer: "Absolutely. All conversions happen locally in your browser. Your photos never leave your device and aren't uploaded to any server, ensuring complete privacy.",
      },
    ],
    aboutSection: {
      title: "HEIC vs JPG: Understanding the Formats",
      fromFormat: {
        name: "HEIC",
        fullName: "High Efficiency Image Container",
        description: "HEIC is Apple's space-saving image format that stores photos at half the size of JPEG while maintaining comparable quality. It's the default format for iOS devices.",
        details: [
          "50% smaller file sizes than JPEG",
          "Supports 16-bit color depth",
          "Can store multiple images in one file",
          "Includes depth maps and Live Photos",
          "Limited compatibility outside Apple ecosystem",
        ],
      },
      toFormat: {
        name: "JPG",
        fullName: "Joint Photographic Experts Group",
        description: "JPG is the universal standard for digital photography, supported by virtually every device, browser, and application worldwide.",
        details: [
          "Works on all devices and platforms",
          "Ideal for photographs and complex images",
          "Variable compression levels",
          "Fast processing and display",
          "No transparency support",
        ],
      },
    },
    changelog: [
      {
        date: "January 2025",
        changes: [
          "Improved HEIC decoder for better compatibility",
          "Added support for HEIC sequences",
          "Fixed orientation issues with rotated images",
        ],
      },
      {
        date: "December 2024",
        changes: [
          "Launched HEIC to JPG converter",
          "Added batch processing support",
          "Implemented privacy-first browser conversion",
        ],
      },
    ],
    relatedTools: [
      { title: "HEIC to PNG", href: "/tools/heic-to-png" },
      { title: "HEIC to PDF", href: "/tools/heic-to-pdf" },
      { title: "HEIF to JPG", href: "/tools/heif-to-jpg" },
      { title: "HEIC to JPEG", href: "/tools/heic-to-jpeg" },
      { title: "AVIF to JPG", href: "/tools/avif-to-jpg" },
      { title: "WebP to JPG", href: "/tools/webp-to-jpg" },
      { title: "PNG to JPG", href: "/tools/png-to-jpg" },
      { title: "CR2 to JPG", href: "/tools/cr2-to-jpg" },
    ],
    blogPosts: [
      {
        title: "Convert iPhone HEIC Photos to JPG",
        subtitle: "iOS Photo Guide",
        description: "Step-by-step guide to converting HEIC photos from iPhone and iPad to universally compatible JPG format without losing quality.",
        href: "/blog/iphone-heic-to-jpg",
        category: "HOW TO CONVERT IMAGE FILES",
      },
      {
        title: "HEIC vs JPG: Which Format Should You Use?",
        subtitle: "Format Comparison",
        description: "Understanding the differences between Apple's HEIC format and traditional JPEG, including storage, quality, and compatibility considerations.",
        href: "/blog/heic-vs-jpg",
        category: "IMAGE FORMAT GUIDES",
      },
      {
        title: "Bulk Convert HEIC Photos on Windows",
        subtitle: "Windows Tutorial",
        description: "Learn how to efficiently convert multiple HEIC files on Windows 10 and 11, including built-in tools and third-party solutions.",
        href: "/blog/bulk-heic-windows",
        category: "HOW TO CONVERT IMAGE FILES",
      },
    ],
  },

  "json-to-csv": {
    tool: {
      title: "JSON to CSV",
      subtitle: "Convert JSON data to CSV format for spreadsheets and data analysis.",
      from: "json",
      to: "csv",
      accept: ".json,application/json",
    },
    videoSection: {
      embedId: "json-csv-tutorial",
    },
    faqs: [
      {
        question: "What is JSON?",
        answer: "JSON (JavaScript Object Notation) is a lightweight, human-readable data format used for storing and exchanging structured data between systems. It uses key-value pairs and arrays to represent complex data structures.",
      },
      {
        question: "Why convert JSON to CSV?",
        answer: "CSV format is ideal for importing data into spreadsheet applications like Excel or Google Sheets, data analysis tools, and databases. It provides a simple tabular structure that's easy to work with.",
      },
      {
        question: "How does nested JSON data get converted?",
        answer: "Nested objects are flattened into columns using dot notation (e.g., 'address.city'), while arrays can be expanded into multiple rows or concatenated into single cells depending on your preference.",
      },
      {
        question: "Can I customize the CSV output?",
        answer: "Yes! You can choose which fields to include, set custom column headers, select delimiters (comma, tab, semicolon), and configure how arrays and nested objects are handled.",
      },
      {
        question: "What's the maximum JSON file size?",
        answer: "Our converter can handle JSON files up to 25MB. For larger datasets, consider splitting them or using specialized data processing tools.",
      },
      {
        question: "Is my data secure?",
        answer: "All processing happens locally in your browser. Your JSON data never leaves your device, ensuring complete privacy and security of sensitive information.",
      },
    ],
    aboutSection: {
      title: "JSON vs CSV: Data Format Comparison",
      fromFormat: {
        name: "JSON",
        fullName: "JavaScript Object Notation",
        description: "JSON is a language-independent open data format that uses human-readable text to express data objects consisting of attribute-value pairs. Although originally derived from JavaScript, JSON data can be generated and parsed with a wide variety of programming languages.",
        details: [
          "Supports complex nested structures",
          "Self-documenting with key names",
          "Native support in web APIs",
          "Handles multiple data types",
          "Human-readable format",
        ],
      },
      toFormat: {
        name: "CSV",
        fullName: "Comma-Separated Values",
        description: "CSV is a simple file format used to store tabular data in plain text. Each line represents a data record, with fields separated by commas. It's universally supported by spreadsheet applications and databases.",
        details: [
          "Simple tabular structure",
          "Universal spreadsheet compatibility",
          "Easy to import/export",
          "Lightweight and fast",
          "Ideal for data analysis",
        ],
      },
    },
    changelog: [
      {
        date: "January 2025",
        changes: [
          "Added numeric key correction to fix JSON option",
          "Added lowercasing of literals to fix JSON option",
        ],
      },
      {
        date: "November 2024",
        changes: [
          "Added improved error messages",
          "Fixed a document error bug",
          "Fixed a skip validation issue",
          "Fixed multiple root element validation",
        ],
      },
      {
        date: "October 2024",
        changes: [
          "Fixed a failed validation bug",
        ],
      },
      {
        date: "August 2024",
        changes: [
          "Added compact template wrapping",
          "Added performance improvements",
          "Added POST support",
          "Added improved error handling",
          "Updated bookmarklet to use query parameters",
          "Fixed an overly aggressive duplicate key validation bug",
          "Fixed duplicate error messages",
          "Fixed unexpected scrolling on objects and arrays expand/collapse",
          "Fixed autofocus",
          "Fixed a fullscreen bug",
        ],
      },
    ],
    relatedTools: [
      { title: "CSV to JSON", href: "/tools/csv-to-json" },
      { title: "JSON Formatter", href: "/tools/json-formatter" },
      { title: "JSON Validator", href: "/tools/json-validator" },
      { title: "CSV Combiner", href: "/tools/csv-combiner" },
      { title: "XML to JSON", href: "/tools/xml-to-json" },
      { title: "JSON to XML", href: "/tools/json-to-xml" },
      { title: "JSON to YAML", href: "/tools/json-to-yaml" },
      { title: "Excel to CSV", href: "/tools/excel-to-csv" },
    ],
    blogPosts: [
      {
        title: "Converting Nested JSON to Flat CSV",
        subtitle: "Data Transformation Guide",
        description: "Learn techniques for flattening complex nested JSON structures into CSV format suitable for spreadsheet analysis and database imports.",
        href: "/blog/nested-json-to-csv",
        category: "HOW TO CONVERT DATA FILES",
      },
      {
        title: "JSON to CSV: Handling Arrays and Objects",
        subtitle: "Advanced Conversion Tips",
        description: "Best practices for converting JSON arrays and nested objects to CSV, including different strategies for preserving data relationships.",
        href: "/blog/json-arrays-to-csv",
        category: "HOW TO CONVERT DATA FILES",
      },
      {
        title: "Automating JSON to CSV Conversions",
        subtitle: "Workflow Automation",
        description: "Set up automated workflows to convert JSON API responses to CSV for regular reporting and data analysis tasks.",
        href: "/blog/automate-json-csv",
        category: "AUTOMATION GUIDES",
      },
    ],
  },
};