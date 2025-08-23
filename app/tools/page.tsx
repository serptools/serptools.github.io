"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolCard } from "@/components/ToolCard";
import { ToolsSearchBar } from "@/components/ToolsSearchBar";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import { 
  Search, 
  Sparkles,
  ArrowRight,
  Image,
  FileImage,
  FileJson,
  Table,
  Type,
  Video,
  Music
} from "lucide-react";
import toolsData from '@/data/tools.json';

// Icon mapping for tools
const iconMap: { [key: string]: any } = {
  'heic-to-jpg': Image,
  'heic-to-jpeg': Image,
  'heic-to-png': Image,
  'heic-to-pdf': FileImage,
  'heif-to-jpg': Image,
  'heif-to-png': Image,
  'heif-to-pdf': FileImage,
  'pdf-to-jpg': FileImage,
  'pdf-to-png': FileImage,
  'jpg-to-pdf': FileImage,
  'jpeg-to-pdf': FileImage,
  'jpg-to-png': Image,
  'png-to-jpg': Image,
  'jpeg-to-png': Image,
  'jpeg-to-jpg': Image,
  'webp-to-png': Image,
  'png-to-webp': Image,
  'jpg-to-webp': Image,
  'jpeg-to-webp': Image,
  'gif-to-webp': Image,
  'webp-to-jpg': Image,
  'webp-to-jpeg': Image,
  'avif-to-png': Image,
  'avif-to-jpg': Image,
  'avif-to-jpeg': Image,
  'bmp-to-jpg': Image,
  'bmp-to-png': Image,
  'ico-to-png': Image,
  'gif-to-jpg': Image,
  'gif-to-png': Image,
  'jfif-to-jpg': Image,
  'jfif-to-jpeg': Image,
  'jfif-to-png': Image,
  'jfif-to-pdf': FileImage,
  'cr2-to-jpg': Image,
  'cr3-to-jpg': Image,
  'dng-to-jpg': Image,
  'arw-to-jpg': Image,
  'jpg-to-svg': FileImage,
  'png-optimizer': Image,
  'csv-combiner': Table,
  'json-to-csv': FileJson,
  'character-counter': Type,
  'mkv-to-mp4': Video,
  'mkv-to-webm': Video,
  'mkv-to-avi': Video,
  'mkv-to-mov': Video,
  'mkv-to-gif': Image,
  'mkv-to-mp3': Music,
  'mkv-to-wav': Music,
  'mkv-to-ogg': Music,
  'batch-compress-png': Image,
  // MP4 converters
  'mp4-to-mkv': Video,
  'mp4-to-mov': Video,
  'mp4-to-avi': Video,
  'mp4-to-webm': Video,
  'mp4-to-flv': Video,
  'mp4-to-m4v': Video,
  'mp4-to-ts': Video,
  'mp4-to-mts': Video,
  'mp4-to-m2ts': Video,
  'mp4-to-mpeg': Video,
  'mp4-to-mpg': Video,
  'mp4-to-mpeg2': Video,
  'mp4-to-vob': Video,
  'mp4-to-3gp': Video,
  'mp4-to-f4v': Video,
  'mp4-to-hevc': Video,
  'mp4-to-divx': Video,
  'mp4-to-mjpeg': Video,
  'mp4-to-asf': Video,
  'mp4-to-gif': Image,
  'mp4-to-mp3': Music,
  'mp4-to-wav': Music,
  'mp4-to-aac': Music,
  'mp4-to-m4a': Music,
  'mp4-to-ogg': Music,
  'mp4-to-flac': Music,
  'mp4-to-opus': Music,
  'mp4-to-wma': Music,
  'mp4-to-aiff': Music,
  'mp4-to-mp2': Music,
};

// Process tools from JSON data
const processedTools = toolsData
  .filter((tool: any) => tool.isActive)
  .map((tool: any) => ({
    id: tool.id,
    name: tool.name,
    description: tool.description,
    category: tool.operation || 'converter',
    icon: iconMap[tool.id] || Image,
    href: tool.route,
    tags: [tool.from, tool.to].filter(Boolean).concat(tool.keywords || []),
    isNew: tool.isNew || false,
    isPopular: tool.isPopular || false,
  }));

export default function ToolsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tools, setTools] = useState(processedTools);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    // Create categories from tools
    const categoryMap = new Map();
    categoryMap.set('all', { id: 'all', name: 'All Tools', count: tools.length });
    
    tools.forEach(tool => {
      if (!categoryMap.has(tool.category)) {
        // Use proper category names without pluralization
        let catName = tool.category.charAt(0).toUpperCase() + tool.category.slice(1);
        if (tool.category === 'combine') catName = 'Combine';
        else if (tool.category === 'compress') catName = 'Compress';
        else if (tool.category === 'convert') catName = 'Convert';
        else if (tool.category === 'download') catName = 'Download';
        else if (tool.category === 'bulk') catName = 'Bulk Operations';
        
        categoryMap.set(tool.category, { 
          id: tool.category, 
          name: catName, 
          count: 0 
        });
      }
      categoryMap.get(tool.category).count++;
    });
    
    setCategories(Array.from(categoryMap.values()));
  }, [tools]);

  // Filter tools based on category and search
  const filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.tags.some((tag: string) => tag?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
        <div className="container relative py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="mr-1 h-3 w-3" />
              All Tools
            </Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Every tool you need
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container py-12">
        {/* Search and Filter Bar */}
        <ToolsSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* Tools Grid */}
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              No tools found matching your criteria.
            </p>
          </div>
        )}
      </section>

      {/* Footer with all tools */}
      <ToolsLinkHub />
    </main>
  );
}