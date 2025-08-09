"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  FileText, 
  Combine, 
  Calculator, 
  Type, 
  FileJson, 
  Upload, 
  Table, 
  Hash,
  Sparkles,
  ArrowRight,
  Filter,
  Image,
  FileImage
} from "lucide-react";
import Link from "next/link";

// Define tool categories
const categories = [
  { id: "all", name: "All Tools", count: 0 },
  { id: "converter", name: "Converters", count: 0 },
  { id: "combiner", name: "Combiners", count: 0 },
  { id: "counter", name: "Counters", count: 0 },
  { id: "generator", name: "Generators", count: 0 },
  { id: "formatter", name: "Formatters", count: 0 },
];

// Define tools data
const tools = [
  {
    id: "csv-combiner",
    name: "CSV Combiner",
    description: "Combine multiple CSV files into one. Merge data from different sources easily.",
    category: "combiner",
    icon: Table,
    href: "/tools/csv-combiner",
    tags: ["csv", "merge", "data"],
    isNew: true,
    isPopular: false,
  },
  {
    id: "json-to-csv",
    name: "JSON to CSV Converter",
    description: "Convert JSON data to CSV format. Perfect for data analysis and spreadsheets.",
    category: "converter",
    icon: FileJson,
    href: "/tools/json-to-csv",
    tags: ["json", "csv", "convert"],
    isNew: true,
    isPopular: true,
  },
  {
    id: "character-counter",
    name: "Character Counter",
    description: "Count characters, words, sentences, and paragraphs in your text instantly.",
    category: "counter",
    icon: Type,
    href: "/tools/character-counter",
    tags: ["text", "count", "words"],
    isNew: true,
    isPopular: true,
  },
  {
    id: "heic-to-jpg",
    name: "HEIC to JPG",
    description: "Convert HEIC photos to JPG privately, in your browser.",
    category: "converter",
    icon: Image,
    href: "/tools/heic-to-jpg",
    tags: ["heic", "jpg", "image", "convert"],
    isNew: true,
    isPopular: false,
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    description: "Convert each PDF page into a JPG in your browser.",
    category: "converter",
    icon: FileImage,
    href: "/tools/pdf-to-jpg",
    tags: ["pdf", "jpg", "image", "convert"],
    isNew: true,
    isPopular: false,
  },
  {
    id: "webp-to-png",
    name: "WebP to PNG",
    description: "Convert WebP images to PNG in your browser.",
    category: "converter",
    icon: Image,
    href: "/tools/webp-to-png",
    tags: ["webp", "png", "image", "convert"],
    isNew: true,
    isPopular: false,
  },
  {
    id: "jpeg-to-png",
    name: "JPEG to PNG",
    description: "Convert JPEG images to PNG format with transparency support.",
    category: "converter",
    icon: Image,
    href: "/tools/jpeg-to-png",
    tags: ["jpeg", "png", "image", "convert"],
    isNew: false,
    isPopular: true,
  },
  {
    id: "gif-to-png",
    name: "GIF to PNG",
    description: "Extract frames from animated GIFs as PNG images.",
    category: "converter",
    icon: Image,
    href: "/tools/gif-to-png",
    tags: ["gif", "png", "image", "convert", "animation"],
    isNew: false,
    isPopular: false,
  },
  {
    id: "jpg-to-svg",
    name: "JPG to SVG",
    description: "Convert JPG images to scalable vector graphics format.",
    category: "converter",
    icon: FileImage,
    href: "/tools/jpg-to-svg",
    tags: ["jpg", "svg", "vector", "image", "convert"],
    isNew: false,
    isPopular: false,
  },
  {
    id: "heic-to-jpeg",
    name: "HEIC to JPEG",
    description: "Convert iPhone HEIC photos to JPEG format privately.",
    category: "converter",
    icon: Image,
    href: "/tools/heic-to-jpeg",
    tags: ["heic", "jpeg", "image", "convert", "iphone"],
    isNew: false,
    isPopular: false,
  },
  {
    id: "avif-to-png",
    name: "AVIF to PNG",
    description: "Convert modern AVIF images to PNG format.",
    category: "converter",
    icon: Image,
    href: "/tools/avif-to-png",
    tags: ["avif", "png", "image", "convert"],
    isNew: true,
    isPopular: false,
  },
  {
    id: "jfif-to-jpg",
    name: "JFIF to JPG",
    description: "Convert JFIF format images to standard JPG files.",
    category: "converter",
    icon: Image,
    href: "/tools/jfif-to-jpg",
    tags: ["jfif", "jpg", "image", "convert"],
    isNew: false,
    isPopular: false,
  },
  {
    id: "heic-to-pdf",
    name: "HEIC to PDF",
    description: "Convert HEIC images to PDF documents.",
    category: "converter",
    icon: FileImage,
    href: "/tools/heic-to-pdf",
    tags: ["heic", "pdf", "document", "convert"],
    isNew: false,
    isPopular: false,
  },
  {
    id: "pdf-to-png",
    name: "PDF to PNG",
    description: "Convert PDF pages to high-quality PNG images.",
    category: "converter",
    icon: FileImage,
    href: "/tools/pdf-to-png",
    tags: ["pdf", "png", "image", "convert"],
    isNew: false,
    isPopular: true,
  },
  {
    id: "jpeg-to-pdf",
    name: "JPEG to PDF",
    description: "Convert JPEG images to PDF documents.",
    category: "converter",
    icon: FileImage,
    href: "/tools/jpeg-to-pdf",
    tags: ["jpeg", "pdf", "document", "convert"],
    isNew: false,
    isPopular: false,
  },
  {
    id: "heic-to-png",
    name: "HEIC to PNG",
    description: "Convert HEIC photos to PNG format with transparency.",
    category: "converter",
    icon: Image,
    href: "/tools/heic-to-png",
    tags: ["heic", "png", "image", "convert", "iphone"],
    isNew: false,
    isPopular: false,
  },
  {
    id: "jpeg-to-jpg",
    name: "JPEG to JPG",
    description: "Optimize and convert JPEG images to JPG format.",
    category: "converter",
    icon: Image,
    href: "/tools/jpeg-to-jpg",
    tags: ["jpeg", "jpg", "image", "convert", "optimize"],
    isNew: false,
    isPopular: false,
  },
];

// Update category counts
categories.forEach(category => {
  if (category.id === "all") {
    category.count = tools.length;
  } else {
    category.count = tools.filter(tool => tool.category === category.id).length;
  }
});

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter tools based on category and search
  const filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
          <div className="container relative py-16 md:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <Badge className="mb-4" variant="secondary">
                <Sparkles className="mr-1 h-3 w-3" />
                Finally...
              </Badge>
              <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Tools that work like you want them to
              </h1>
    
              
              {/* Search Bar */}
              <div className="relative mx-auto max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tools..."
                  className="w-full pl-10 pr-4 py-6 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container py-12">
          {/* Filter Bar */}
          <div className="mb-8">
            {/* Filter Categories - Always Visible */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                >
                  {category.name}
                  <span className="ml-2 text-xs opacity-70">
                    ({category.count})
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.id} href={tool.href}>
                  <Card className="group h-full transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start gap-3 mb-2">
                        <Icon className="h-6 w-6 text-primary mt-0.5" />
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {tool.name}
                        </CardTitle>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>

          {filteredTools.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-lg text-muted-foreground">
                No tools found matching your criteria.
              </p>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="border-t bg-muted/30">
          <div className="container py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold">
                Need a specific tool?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                We&apos;re constantly adding new tools. Let us know what you need!
              </p>
              <Button size="lg" className="group">
                Request a Tool
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}