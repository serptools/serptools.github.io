'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ChevronRight, FolderOpen, Grid, List } from 'lucide-react';

interface FileTypeData {
  extension: string;
  name: string;
  summary: string;
  developer?: string;
  popularity?: {
    rating: number;
    votes: number;
  };
  image?: {
    icon?: string;
  };
}

interface CategoryData {
  name: string;
  slug: string;
  description: string;
  fileTypes: FileTypeData[];
}

export default function CategoryPageTemplate({ data }: { data: CategoryData }) {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <a href="/" className="text-gray-500 hover:text-gray-700">Home</a>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href="/" className="text-gray-500 hover:text-gray-700">File Types</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{data.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4">
              <FolderOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{data.name}</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
              {data.description}
            </p>
            <div className="text-sm text-gray-500">
              {data.fileTypes.length} file type{data.fileTypes.length !== 1 ? 's' : ''} in this category
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">All {data.name}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label="Grid view"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* File Types Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.fileTypes.map((fileType) => (
              <Link
                key={fileType.extension}
                href={`/${fileType.extension}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600">.{fileType.extension}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                      {fileType.name}
                    </h3>
                    {fileType.developer && (
                      <p className="text-sm text-gray-500 mb-2">by {fileType.developer}</p>
                    )}
                    {fileType.popularity && (
                      <div className="flex items-center space-x-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-gray-600">{fileType.popularity.rating.toFixed(1)}</span>
                        <span className="text-gray-400">({fileType.popularity.votes})</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {fileType.summary}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Extension
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Developer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.fileTypes.map((fileType) => (
                  <tr key={fileType.extension} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/${fileType.extension}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        .{fileType.extension}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fileType.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {fileType.developer || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {fileType.popularity ? (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span>{fileType.popularity.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <p className="line-clamp-1 max-w-md">{fileType.summary}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Related Categories */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Browse Other Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {['web', 'page_layout', 'raster_image', 'vector_image', 'data', 'text', 'video', 'compressed']
              .filter(cat => cat !== data.slug)
              .map(category => (
                <Link
                  key={category}
                  href={`/categories/${category}`}
                  className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 capitalize">
                    {category.replace('_', ' ')} Files
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}