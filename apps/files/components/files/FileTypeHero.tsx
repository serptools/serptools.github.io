import React from 'react';
import Link from 'next/link';
import { Star, FolderOpen } from 'lucide-react';

interface FileTypeHeroProps {
  extension: string;
  name: string;
  summary: string;
  category?: string;
  categorySlug?: string;
  developer?: string;
  popularity?: {
    rating: number;
    votes: number;
  };
  image?: {
    icon?: string;
  };
}

export default function FileTypeHero({
  extension,
  name,
  summary,
  category,
  categorySlug,
  developer,
  popularity,
  image
}: FileTypeHeroProps) {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-start space-x-6">
          {image?.icon && (
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-white rounded-lg shadow-sm p-3 flex items-center justify-center">
                <div className="text-4xl font-bold text-blue-600">.{extension}</div>
              </div>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              .{extension.toUpperCase()} File Extension
            </h1>
            <h2 className="text-xl text-gray-600 mb-4">{name}</h2>

            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              {category && categorySlug && (
                <>
                  <Link
                    href={`/categories/${categorySlug}`}
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>{category}</span>
                  </Link>
                  {developer && <span>•</span>}
                </>
              )}
              {developer && (
                <>
                  <span>Developer: <strong>{developer}</strong></span>
                  {popularity && <span>•</span>}
                </>
              )}
              {popularity && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span>{popularity.rating.toFixed(1)}</span>
                  <span className="text-gray-400">({popularity.votes} votes)</span>
                </div>
              )}
            </div>

            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}