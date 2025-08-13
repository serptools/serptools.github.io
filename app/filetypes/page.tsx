'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<string>('');

  // Group filetypes by first letter for better organization
  const [groupedTypes, setGroupedTypes] = useState<Record<string, FileType[]>>({});

  useEffect(() => {
    async function loadFileTypes() {
      try {
        const response = await fetch('/data/filetypes/index.json');
        const data = await response.json();
        setFileTypes(data);
        setFilteredTypes(data);
        
        // Group by first character
        const grouped = data.reduce((acc: Record<string, FileType[]>, ft: FileType) => {
          const firstChar = (ft.extension || ft.slug || '').charAt(0).toUpperCase();
          if (!acc[firstChar]) acc[firstChar] = [];
          acc[firstChar].push(ft);
          return acc;
        }, {});
        
        setGroupedTypes(grouped);
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
    
    if (selectedLetter) {
      filtered = filtered.filter(ft => 
        (ft.extension || ft.slug || '').charAt(0).toUpperCase() === selectedLetter
      );
    }
    
    setFilteredTypes(filtered);
  }, [searchTerm, selectedLetter, fileTypes]);

  // Get alphabet for navigation
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#&'.split('');
  const availableLetters = Object.keys(groupedTypes).sort();

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

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search extensions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Alphabet Navigation */}
        <div className="mb-8 flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedLetter('')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              selectedLetter === ''
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All
          </button>
          {alphabet.map(letter => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              disabled={!availableLetters.includes(letter)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedLetter === letter
                  ? 'bg-gray-900 text-white'
                  : availableLetters.includes(letter)
                  ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Results count */}
        {searchTerm && (
          <div className="mb-4 text-sm text-gray-600">
            Found {filteredTypes.length} file type{filteredTypes.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* File Types Grid */}
        {filteredTypes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="text-center">
              <p className="text-gray-500">No file types found matching your criteria</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTypes.map(fileType => {
              // Clean up the name - remove redundant category info
              const displayName = fileType.name
                .replace(fileType.category?.replace(/-/g, ' ') || '', '')
                .replace(/\s+/g, ' ')
                .trim();
              
              const extensionDisplay = fileType.extension || fileType.slug;
              
              return (
                <Link
                  key={fileType.slug}
                  href={`/filetypes/${fileType.slug}`}
                  className="group block"
                >
                  <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-semibold text-gray-900 uppercase">
                            .{extensionDisplay}
                          </span>
                          {fileType.developer_name && (
                            <span className="text-xs text-gray-500 truncate">
                              by {fileType.developer_name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-0.5">
                          {displayName}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}