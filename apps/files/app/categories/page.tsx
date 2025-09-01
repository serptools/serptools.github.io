import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, FileText, Image, Video, Archive, Code, Database, Gamepad2, Settings } from 'lucide-react';
import fs from 'fs';
import path from 'path';

export const metadata: Metadata = {
  title: 'File Type Categories - Browse All File Extensions by Category',
  description: 'Explore file types organized by category including documents, images, videos, data files, and more. Find detailed information about any file extension.',
  keywords: 'file types, file extensions, file categories, document files, image files, video files, data files',
};

interface Category {
  slug: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
}

async function getCategoryCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  try {
    const dataDir = path.join(process.cwd(), 'public', 'data', 'files');
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

    for (const file of files) {
      try {
        const filePath = path.join(dataDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);

        if (data.categorySlug) {
          counts[data.categorySlug] = (counts[data.categorySlug] || 0) + 1;
        }
      } catch (error) {
        console.error(`Error reading ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Error counting categories:', error);
  }

  return counts;
}

export default async function CategoriesPage() {
  const categoryCounts = await getCategoryCounts();

  const categories: Category[] = [
    {
      slug: 'web',
      name: 'Web Files',
      description: 'Files used for web development and internet applications',
      icon: Code,
      count: categoryCounts['web'] || 0
    },
    {
      slug: 'page_layout',
      name: 'Page Layout Files',
      description: 'Document and page layout files for formatted documents',
      icon: FileText,
      count: categoryCounts['page_layout'] || 0
    },
    {
      slug: 'raster_image',
      name: 'Raster Image Files',
      description: 'Bitmap images composed of pixels for photos and graphics',
      icon: Image,
      count: categoryCounts['raster_image'] || 0
    },
    {
      slug: 'vector_image',
      name: 'Vector Image Files',
      description: 'Scalable graphics using mathematical formulas',
      icon: Image,
      count: categoryCounts['vector_image'] || 0
    },
    {
      slug: 'data',
      name: 'Data Files',
      description: 'Structured data for storing and exchanging information',
      icon: Database,
      count: categoryCounts['data'] || 0
    },
    {
      slug: 'text',
      name: 'Text Files',
      description: 'Plain and formatted text documents',
      icon: FileText,
      count: categoryCounts['text'] || 0
    },
    {
      slug: 'video',
      name: 'Video Files',
      description: 'Digital video containing moving images and audio',
      icon: Video,
      count: categoryCounts['video'] || 0
    },
    {
      slug: 'audio',
      name: 'Audio Files',
      description: 'Digital audio for music, podcasts, and sounds',
      icon: FileText,
      count: categoryCounts['audio'] || 0
    },
    {
      slug: 'compressed',
      name: 'Compressed Files',
      description: 'Archive files containing compressed data',
      icon: Archive,
      count: categoryCounts['compressed'] || 0
    },
    {
      slug: 'executable',
      name: 'Executable Files',
      description: 'Program files that can be run by the OS',
      icon: Settings,
      count: categoryCounts['executable'] || 0
    },
    {
      slug: 'game',
      name: 'Game Files',
      description: 'Files used by video games for data and saves',
      icon: Gamepad2,
      count: categoryCounts['game'] || 0
    },
    {
      slug: 'developer',
      name: 'Developer Files',
      description: 'Source code and project files for programming',
      icon: Code,
      count: categoryCounts['developer'] || 0
    },
    {
      slug: 'database',
      name: 'Database Files',
      description: 'Structured storage for database systems',
      icon: Database,
      count: categoryCounts['database'] || 0
    },
    {
      slug: 'system',
      name: 'System Files',
      description: 'Operating system and configuration files',
      icon: Settings,
      count: categoryCounts['system'] || 0
    },
    {
      slug: 'misc',
      name: 'Misc Files',
      description: 'Various file types in other categories',
      icon: FileText,
      count: categoryCounts['misc'] || 0
    }
  ].filter(cat => cat.count > 0); // Only show categories that have files

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
            <span className="text-gray-900 font-medium">Categories</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">File Type Categories</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Browse file types organized by category. Find detailed information about file extensions,
              compatible programs, and conversion options for each file type.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 group"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h2>
                    <p className="text-sm text-gray-600 mb-2">
                      {category.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {category.count} file type{category.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Popular File Types Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Popular File Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {['.pdf', '.jpg', '.png', '.docx', '.mp4', '.zip', '.json', '.csv', '.svg', '.gif', '.webp', '.jpeg'].map(ext => (
              <Link
                key={ext}
                href={`/${ext.slice(1)}`}
                className="text-center px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <span className="text-lg font-semibold text-blue-600">{ext}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}