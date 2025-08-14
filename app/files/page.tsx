'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Search, X, ChevronDown } from 'lucide-react';
import { categoryDefinitions, getFileCategory, type FileCategory } from '@/lib/filetype-categories';

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
  developer_name?: string;
  summary?: string;
}

export default function FileTypesPage() {
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<FileType[]>([]);
  const [displayedTypes, setDisplayedTypes] = useState<FileType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [letterDropdownOpen, setLetterDropdownOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [letterSearchTerm, setLetterSearchTerm] = useState('');
  const [displayCount, setDisplayCount] = useState(100); // Start with 100 items
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const letterDropdownRef = useRef<HTMLDivElement>(null);

  // Group filetypes by first letter and category
  const [groupedTypes, setGroupedTypes] = useState<Record<string, FileType[]>>({});
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadFileTypes() {
      try {
        const response = await fetch('/data/filetypes/index.json');
        const data = await response.json();
        
        // Process data in chunks to avoid blocking
        const chunkSize = 1000;
        let enrichedData: FileType[] = [];
        
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize);
          const enrichedChunk = chunk.map((ft: FileType) => ({
            ...ft,
            fileCategory: getFileCategory(ft.extension || ft.slug)
          }));
          enrichedData = [...enrichedData, ...enrichedChunk];
          
          // Allow UI to update between chunks
          if (i === 0) {
            // Set initial data quickly
            setFileTypes(enrichedChunk);
            setFilteredTypes(enrichedChunk);
            setLoading(false);
          }
        }
        
        // Set complete data
        setFileTypes(enrichedData);
        setFilteredTypes(enrichedData);
        
        // Group by first character
        const grouped = enrichedData.reduce((acc: Record<string, FileType[]>, ft: FileType) => {
          const firstChar = (ft.extension || ft.slug || '').charAt(0).toUpperCase();
          if (!acc[firstChar]) acc[firstChar] = [];
          acc[firstChar].push(ft);
          return acc;
        }, {});
        
        setGroupedTypes(grouped);
        
        // Count by category
        const catCounts = enrichedData.reduce((acc: Record<string, number>, ft: any) => {
          const category = ft.fileCategory || 'misc';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});
        
        setCategoryCounts(catCounts);
      } catch (error) {
        console.error('Failed to load file types:', error);
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
    
    if (selectedLetters.length > 0) {
      filtered = filtered.filter(ft => 
        selectedLetters.includes((ft.extension || ft.slug || '').charAt(0).toUpperCase())
      );
    }
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((ft: any) => selectedCategories.includes(ft.fileCategory));
    }
    
    // Sort by extension (default)
    filtered = [...filtered].sort((a, b) => {
      return (a.extension || a.slug).localeCompare(b.extension || b.slug);
    });
    
    setFilteredTypes(filtered);
  }, [searchTerm, selectedLetters, selectedCategories, fileTypes]);

  // Update displayed types based on pagination
  useEffect(() => {
    setDisplayedTypes(filteredTypes.slice(0, displayCount));
  }, [filteredTypes, displayCount]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(100);
  }, [searchTerm, selectedLetters, selectedCategories]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (letterDropdownRef.current && !letterDropdownRef.current.contains(event.target as Node)) {
        setLetterDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get alphabet for navigation
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#&'.split('');
  const availableLetters = Object.keys(groupedTypes).sort();

  // Sort categories by count (most popular first)
  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key as FileCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading file types...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">File Extensions</h1>
          <p className="text-gray-600">
            Browse {fileTypes.length.toLocaleString()} file types and their associated programs
          </p>
        </div>

        {/* Search and Filters Bar - All on one line */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search extensions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-[48px]"
            />
          </div>

          {/* Category Multi-Select */}
          <div ref={categoryDropdownRef} className="relative w-full lg:w-80">
            <div
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="w-full min-h-[48px] px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1 flex-1">
                  {selectedCategories.length === 0 ? (
                    <span className="text-gray-500">Filter by categories...</span>
                  ) : (
                    selectedCategories.map(cat => {
                      const config = categoryDefinitions[cat as FileCategory];
                      const Icon = config?.icon;
                      return (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm"
                        >
                          {Icon && <Icon className="h-3 w-3" />}
                          {config?.name}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategories(selectedCategories.filter(c => c !== cat));
                            }}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                  categoryDropdownOpen ? 'rotate-180' : ''
                }`} />
              </div>
            </div>
            
            {categoryDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="p-2">
                  {sortedCategories
                    .filter(cat => {
                      const config = categoryDefinitions[cat];
                      const count = categoryCounts[cat] || 0;
                      return config && count > 0 && 
                        config.name.toLowerCase().includes(categorySearchTerm.toLowerCase());
                    })
                    .map(cat => {
                      const config = categoryDefinitions[cat];
                      const Icon = config?.icon;
                      const count = categoryCounts[cat] || 0;
                      const isSelected = selectedCategories.includes(cat);
                      
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCategories(selectedCategories.filter(c => c !== cat));
                            } else {
                              setSelectedCategories([...selectedCategories, cat]);
                            }
                          }}
                          className={`w-full px-3 py-2 text-left rounded-md flex items-center gap-2 transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`}>
                            {isSelected && <span className="text-white text-xs">✓</span>}
                          </div>
                          {Icon && <Icon className="h-4 w-4" />}
                          <span className="flex-1">{config.name}</span>
                          <span className="text-xs text-gray-500">{count}</span>
                        </button>
                      );
                    })}
                  {selectedCategories.length > 0 && (
                    <button
                      onClick={() => setSelectedCategories([])}
                      className="w-full mt-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Letter Multi-Select */}
          <div ref={letterDropdownRef} className="relative w-full lg:w-80">
            <div
              onClick={() => setLetterDropdownOpen(!letterDropdownOpen)}
              className="w-full min-h-[48px] px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1 flex-1">
                  {selectedLetters.length === 0 ? (
                    <span className="text-gray-500">Filter by starting letter...</span>
                  ) : (
                    selectedLetters.map(letter => (
                      <span
                        key={letter}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm"
                      >
                        {letter}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLetters(selectedLetters.filter(l => l !== letter));
                          }}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                  letterDropdownOpen ? 'rotate-180' : ''
                }`} />
              </div>
            </div>
            
            {letterDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Type a letter..."
                    value={letterSearchTerm}
                    onChange={(e) => setLetterSearchTerm(e.target.value.slice(0, 1).toUpperCase())}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="p-2 grid grid-cols-6 gap-1">
                  {alphabet
                    .filter(letter => 
                      availableLetters.includes(letter) &&
                      (!letterSearchTerm || letter.startsWith(letterSearchTerm))
                    )
                    .map(letter => {
                      const isSelected = selectedLetters.includes(letter);
                      const count = groupedTypes[letter]?.length || 0;
                      
                      return (
                        <button
                          key={letter}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLetters(selectedLetters.filter(l => l !== letter));
                            } else {
                              setSelectedLetters([...selectedLetters, letter]);
                            }
                          }}
                          className={`px-2 py-2 text-center rounded-md transition-colors font-medium ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {letter}
                          <div className="text-xs opacity-70">{count}</div>
                        </button>
                      );
                    })}
                </div>
                {selectedLetters.length > 0 && (
                  <div className="p-2 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedLetters([])}
                      className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


        {/* Results count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {displayedTypes.length} of {filteredTypes.length} file type{filteredTypes.length !== 1 ? 's' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
          {selectedCategories.length > 0 && ` in ${selectedCategories.length} categor${selectedCategories.length === 1 ? 'y' : 'ies'}`}
          {selectedLetters.length > 0 && ` starting with ${selectedLetters.join(', ')}`}
        </div>

        {/* File Types Grid */}
        {filteredTypes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="text-center">
              <p className="text-gray-500">No file types found matching your criteria</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedTypes.map((fileType: any) => {
              // Clean up the name - remove redundant category info
              const displayName = fileType.name
                .replace(fileType.category?.replace(/-/g, ' ') || '', '')
                .replace(/\s+/g, ' ')
                .trim();
              
              const extensionDisplay = fileType.extension || fileType.slug;
              const category = fileType.fileCategory as FileCategory;
              const Icon = categoryDefinitions[category]?.icon || categoryDefinitions.misc.icon;
              
              return (
                <Link
                  key={fileType.slug}
                  href={`/filetypes/${fileType.slug}`}
                  className="group block"
                >
                  <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4 text-gray-400" />
                          <span className="text-lg font-semibold text-gray-900 uppercase">
                            .{extensionDisplay}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {displayName}
                        </p>
                        {fileType.developer_name && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            by {fileType.developer_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            </div>
            
            {/* Load More Button */}
            {displayedTypes.length < filteredTypes.length && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setDisplayCount(prev => Math.min(prev + 100, filteredTypes.length))}
                  className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Load More ({filteredTypes.length - displayedTypes.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}