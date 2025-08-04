"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Filter
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
                Free Online Tools
              </Badge>
              <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Simple Tools for
                <span className="text-primary"> Everyday Tasks</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground">
                A collection of free, easy-to-use online tools to help you work more efficiently. 
                No signup required, no data stored.
              </p>
              
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
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Sidebar Categories */}
            <aside className="w-full lg:w-64">
              <div className="sticky top-20 space-y-2">
                <h2 className="mb-4 text-sm font-semibold text-muted-foreground">CATEGORIES</h2>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className={`text-xs ${
                      selectedCategory === category.id ? "opacity-70" : "text-muted-foreground"
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            {/* Tools Grid */}
            <div className="flex-1">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredTools.length} of {tools.length} tools
                </p>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link key={tool.id} href={tool.href}>
                      <Card className="group h-full transition-all hover:shadow-lg hover:-translate-y-1">
                        <CardHeader>
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex gap-2">
                              {tool.isNew && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                              {tool.isPopular && (
                                <Badge variant="outline" className="text-xs">
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </div>
                          <CardTitle className="group-hover:text-primary">
                            {tool.name}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {tool.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {tool.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
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
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-muted/30">
          <div className="container py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold">
                Need a specific tool?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                We're constantly adding new tools. Let us know what you need!
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