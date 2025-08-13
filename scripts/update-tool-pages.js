const fs = require('fs');
const path = require('path');

const tools = [
  'csv-combiner',
  'character-counter', 
  'pdf-to-jpg',
  'webp-to-png',
  'jpeg-to-png',
  'gif-to-png',
  'jpg-to-svg',
  'heic-to-jpeg',
  'avif-to-png',
  'jfif-to-jpg',
  'heic-to-pdf',
  'pdf-to-png',
  'jpeg-to-pdf',
  'heic-to-png',
  'jpeg-to-jpg',
  'heic-to-jpg',
  'json-to-csv',
  'heif-to-jpg',
  'heif-to-png',
  'heif-to-pdf',
  'jfif-to-jpeg',
  'jfif-to-png',
  'jfif-to-pdf'
];

const pageTemplate = (toolKey) => `"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import { toolContent } from '@/data/tools.json';

export default function Page() {
  const content = toolContent["${toolKey}"];
  
  if (!content) {
    return <div>Tool not found</div>;
  }
  
  return (
    <ToolPageTemplate
      tool={content.tool}
      videoSection={content.videoSection}
      faqs={content.faqs}
      aboutSection={content.aboutSection}
      changelog={content.changelog}
      relatedTools={content.relatedTools}
      blogPosts={content.blogPosts}
    />
  );
}`;

tools.forEach(tool => {
  const dir = path.join('app', 'tools', tool);
  const filePath = path.join(dir, 'page.tsx');
  
  // Check if directory exists
  if (fs.existsSync(dir)) {
    fs.writeFileSync(filePath, pageTemplate(tool));
    console.log(`✓ Updated ${tool}/page.tsx`);
  } else {
    console.log(`⚠ Directory not found: ${tool}`);
  }
});

console.log('\nAll tool pages updated successfully!');