'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, FileText, Star } from 'lucide-react';

interface FileType {
  slug: string;
  name: string;
  category: string;
  extension?: string;
  popularity?: {
    rating: number;
    votes: number;
    source: string;
  };
  updated_at?: string;
  developer_org?: string;
  summary?: string;
}

export default function FileTypesPage() {
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<FileType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    async function loadFileTypes() {
      try {
        const response = await fetch('/data/filetypes/index.json');
        const data = await response.json();
        setFileTypes(data);
        setFilteredTypes(data);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.map((ft: FileType) => ft.category))] as string[];
        setCategories(uniqueCategories.sort());
      } catch (error) {
        console.error('Failed to load file types:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadFileTypes();
  }, []);

  useEffect(() => {
    let filtered = fileTypes;
    
    if (searchTerm) {
      filtered = filtered.filter(ft => 
        ft.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ft.extension && ft.extension.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(ft => ft.category === selectedCategory);
    }
    
    setFilteredTypes(filtered);
  }, [searchTerm, selectedCategory, fileTypes]);

  const formatCategory = (category: string) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading file types...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">File Extensions Database</h1>
        <p className="text-lg text-muted-foreground">
          Browse our comprehensive database of {fileTypes.length} file extensions. 
          Learn about different file types, their uses, and compatible software.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search file extensions (e.g., doc, pdf, jpg)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="lg:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {formatCategory(cat)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredTypes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No file types found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredTypes.length} of {fileTypes.length} file types
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTypes.map(fileType => (
              <Link 
                key={fileType.slug} 
                href={`/filetypes/${fileType.slug}`}
                className="block hover:no-underline"
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {fileType.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {formatCategory(fileType.category)}
                        </CardDescription>
                      </div>
                      {fileType.popularity && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{fileType.popularity.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  {fileType.developer_org && (
                    <CardContent className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        by {fileType.developer_org.split('-').map(w => 
                          w.charAt(0).toUpperCase() + w.slice(1)
                        ).join(' ')}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}