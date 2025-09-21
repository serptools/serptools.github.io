"use client";

import { useState } from "react";
import { Button } from "@serp-tools/ui/components/button";
import { Badge } from "@serp-tools/ui/components/badge";
import { ExtensionCard } from "@/components/ExtensionCard";
import { ExtensionsSearchBar } from "@/components/ExtensionsSearchBar";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Link from 'next/link';
import type { Category, ProcessedExtension } from '@/types';
import { getCategoryIcon, getAllCategories } from '@/lib/extensions';

interface CategoryPageClientProps {
  category: Category;
  extensions: ProcessedExtension[];
}

export function CategoryPageClient({ category, extensions }: CategoryPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const CategoryIcon = getCategoryIcon(category.icon);
  const categories = getAllCategories();

  // Filter extensions based on search
  const filteredExtensions = extensions.filter(extension => {
    const matchesSearch = extension.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      extension.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      extension.tags.some((tag: string) => tag?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
        <div className="container relative py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Link href="/extensions" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="mr-1 h-3 w-3" />
              Back to all extensions
            </Link>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-xl bg-muted">
                <CategoryIcon className="h-8 w-8" />
              </div>
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {category.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              {category.description}
            </p>
            <Badge className="mt-4" variant="secondary">
              {extensions.length} extension{extensions.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container max-w-6xl py-12">
        {/* Search Bar */}
        <div className="mb-8">
          <ExtensionsSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categories={categories}
            selectedCategory={category.slug}
            setSelectedCategory={(newCategory) => {
              if (newCategory !== category.slug) {
                window.location.href = newCategory === 'all'
                  ? '/extensions'
                  : `/category/${newCategory}`;
              }
            }}
          />
        </div>

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