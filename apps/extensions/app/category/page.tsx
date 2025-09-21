"use client";

import { useState, useEffect } from "react";
import { Button } from "@serp-tools/ui/components/button";
import { Badge } from "@serp-tools/ui/components/badge";
import { ExtensionCard } from "@/components/ExtensionCard";
import { ExtensionsSearchBar } from "@/components/ExtensionsSearchBar";
import {
  Sparkles,
  ArrowRight,
  Shield,
  Lock,
  Eye,
  ShoppingCart,
  Coins,
  Moon,
  CheckSquare,
  Bookmark,
  Palette,
  Code,
  Video,
  Clipboard,
  Gauge,
  Globe,
  Puzzle
} from "lucide-react";
import extensionsData from '@serp-tools/app-core/data/extensions.json';

// Icon mapping for extensions
const iconMap: { [key: string]: any } = {
  'ublock-origin': Shield,
  'lastpass': Lock,
  'grammarly': CheckSquare,
  'honey': ShoppingCart,
  'metamask': Coins,
  'dark-reader': Moon,
  'todoist': CheckSquare,
  'pocket': Bookmark,
  'colorpick-eyedropper': Palette,
  'wappalyzer': Code,
  'json-formatter': Code,
  'ghostery': Shield,
  'loom': Video,
  'notion-web-clipper': Clipboard,
  'momentum': Gauge,
};

// Process extensions from JSON data
const processedExtensions = extensionsData
  .filter((extension: any) => extension.isActive)
  .map((extension: any) => ({
    id: extension.id,
    name: extension.name,
    description: extension.description,
    category: extension.category || 'other',
    icon: iconMap[extension.id] || Puzzle,
    href: extension.chromeStoreUrl || extension.firefoxAddonUrl || extension.url,
    tags: extension.tags || [],
    isNew: extension.isNew || false,
    isPopular: extension.isPopular || false,
    rating: extension.rating,
    users: extension.users,
  }));


export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [extensions, setExtensions] = useState(processedExtensions);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    // Create categories from extensions
    const categoryMap = new Map();
    categoryMap.set('all', { id: 'all', name: 'All Extensions', count: extensions.length });

    extensions.forEach(extension => {
      if (!categoryMap.has(extension.category)) {
        // Use proper category names
        let catName = extension.category.charAt(0).toUpperCase() + extension.category.slice(1);
        if (extension.category === 'privacy') catName = 'Privacy & Security';
        else if (extension.category === 'productivity') catName = 'Productivity';
        else if (extension.category === 'developer') catName = 'Developer Tools';
        else if (extension.category === 'shopping') catName = 'Shopping';
        else if (extension.category === 'crypto') catName = 'Crypto & Web3';
        else if (extension.category === 'accessibility') catName = 'Accessibility';
        else if (extension.category === 'other') catName = 'Other';

        categoryMap.set(extension.category, {
          id: extension.category,
          name: catName,
          count: 0
        });
      }
      categoryMap.get(extension.category).count++;
    });

    setCategories(Array.from(categoryMap.values()));
  }, [extensions]);

  // Filter extensions based on category and search
  const filteredExtensions = extensions.filter(extension => {
    const matchesCategory = selectedCategory === "all" || extension.category === selectedCategory;
    const matchesSearch = extension.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      extension.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      extension.tags.some((tag: string) => tag?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
        <div className="container relative py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="mr-1 h-3 w-3" />
              Discover...
            </Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Browser extensions that supercharge your productivity
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container py-12">
        {/* Search and Filter Bar */}
        <ExtensionsSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* Extensions Grid */}
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredExtensions.map((extension) => (
            <ExtensionCard key={extension.id} extension={extension} />
          ))}
        </div>

        {filteredExtensions.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              No extensions found matching your criteria.
            </p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30">
        <div className="container py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Missing an extension?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              We&apos;re constantly adding new extensions to our directory. Let us know what you&apos;re looking for!
            </p>
            <Button size="lg" className="group">
              Suggest an Extension
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}