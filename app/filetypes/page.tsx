'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Image, Film, Music, FileText, File, Archive, Code, Database } from 'lucide-react';
import { formatToMediaType } from '@/lib/tool-utils';

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

// Map media types to icons
const mediaTypeIcons = {
  image: Image,
  video: Film,
  audio: Music,
  document: FileText,
  text: Code,
  archive: Archive,
  database: Database,
  other: File,
};

// Media type display names and colors
const mediaTypeConfig = {
  image: { name: 'Images', color: 'blue' },
  video: { name: 'Videos', color: 'red' },
  audio: { name: 'Audio', color: 'green' },
  document: { name: 'Documents', color: 'orange' },
  text: { name: 'Text/Code', color: 'purple' },
  archive: { name: 'Archives', color: 'gray' },
  database: { name: 'Database', color: 'indigo' },
  other: { name: 'Other', color: 'gray' },
};

export default function FileTypesPage() {
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<FileType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'extension'>('extension');

  // Group filetypes by first letter and media type
  const [groupedTypes, setGroupedTypes] = useState<Record<string, FileType[]>>({});
  const [mediaTypeCounts, setMediaTypeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadFileTypes() {
      try {
        const response = await fetch('/data/filetypes/index.json');
        const data = await response.json();
        
        // Add media type to each file type
        const enrichedData = data.map((ft: FileType) => ({
          ...ft,
          mediaType: getMediaType(ft.extension || ft.slug)
        }));
        
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
        
        // Count by media type
        const mediaCounts = enrichedData.reduce((acc: Record<string, number>, ft: any) => {
          const mediaType = ft.mediaType || 'other';
          acc[mediaType] = (acc[mediaType] || 0) + 1;
          return acc;
        }, {});
        
        setMediaTypeCounts(mediaCounts);
      } catch (error) {
        console.error('Failed to load file types:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadFileTypes();
  }, []);

  // Helper function to get media type
  function getMediaType(extension: string): string {
    const ext = extension.toLowerCase().replace('.', '');
    
    // Check if it's an archive format
    const archiveFormats = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'z', 'lz', 'lzma', 'deb', 'rpm', 'dmg', 'pkg', 'cab'];
    if (archiveFormats.includes(ext)) return 'archive';
    
    // Check if it's a database format
    const dbFormats = ['db', 'sqlite', 'mdb', 'accdb', 'dbf', 'sdf', 'sql'];
    if (dbFormats.includes(ext)) return 'database';
    
    // Use the existing mapping
    return formatToMediaType[ext] || 'other';
  }

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
    
    if (selectedMediaType) {
      filtered = filtered.filter((ft: any) => ft.mediaType === selectedMediaType);
    }
    
    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return (a.extension || a.slug).localeCompare(b.extension || b.slug);
      }
    });
    
    setFilteredTypes(filtered);
  }, [searchTerm, selectedLetter, selectedMediaType, sortBy, fileTypes]);

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

        {/* Search and Sort Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search extensions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'extension')}
            className="px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="extension">Sort by Extension</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        {/* Media Type Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMediaType('')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                selectedMediaType === ''
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All
              <span className="text-xs opacity-70">
                {fileTypes.length}
              </span>
            </button>
            {Object.entries(mediaTypeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const Icon = mediaTypeIcons[type as keyof typeof mediaTypeIcons] || mediaTypeIcons.other;
                const config = mediaTypeConfig[type as keyof typeof mediaTypeConfig] || mediaTypeConfig.other;
                
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedMediaType(type)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                      selectedMediaType === type
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {config.name}
                    <span className="text-xs opacity-70">
                      {count}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Alphabet Navigation */}
        <div className="mb-6 flex flex-wrap gap-1">
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
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredTypes.length} file type{filteredTypes.length !== 1 ? 's' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
          {selectedMediaType && ` in ${mediaTypeConfig[selectedMediaType as keyof typeof mediaTypeConfig]?.name || 'Other'}`}
        </div>

        {/* File Types Grid */}
        {filteredTypes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="text-center">
              <p className="text-gray-500">No file types found matching your criteria</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTypes.map((fileType: any) => {
              // Clean up the name - remove redundant category info
              const displayName = fileType.name
                .replace(fileType.category?.replace(/-/g, ' ') || '', '')
                .replace(/\s+/g, ' ')
                .trim();
              
              const extensionDisplay = fileType.extension || fileType.slug;
              const Icon = mediaTypeIcons[fileType.mediaType as keyof typeof mediaTypeIcons] || mediaTypeIcons.other;
              
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
        )}
      </div>
    </div>
  );
}