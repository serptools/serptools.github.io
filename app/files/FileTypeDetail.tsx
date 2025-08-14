'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { 
  Star, 
  Monitor, 
  Smartphone, 
  Globe, 
  Apple,
  ArrowLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Info,
  Code,
  FolderOpen,
  Server
} from 'lucide-react';

interface Program {
  name: string;
  url?: string;
  license?: string;
  icon?: string;
  external?: boolean;
  status?: string;
}

interface FileTypeDetailData {
  slug: string;
  extension: string;
  name: string;
  summary?: string;
  developer?: string;
  developer_slug?: string;
  category?: string;
  category_slug?: string;
  format_type?: string;
  mime_type?: string;
  magic_number?: string;
  rating?: number;
  votes?: number;
  last_updated?: string;
  more_information?: {
    content?: string[];
    screenshot?: {
      url: string;
      srcset?: string;
      alt: string;
      width?: string;
      height?: string;
      caption: string;
    };
  };
  how_to_open?: {
    instructions?: string[];
    programs?: Array<{
      name: string;
      url?: string;
    }>;
  };
  programs?: {
    [platform: string]: Program[];
  };
  scraped_at?: string;
  source?: {
    url: string;
    file: string;
  };
}

interface FileTypeDetailProps {
  slug: string;
}

function FileTypeDetail({ slug }: FileTypeDetailProps) {
  const [fileType, setFileType] = useState<FileTypeDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/data/files/individual/${slug}.json`);
        if (response.ok) {
          const data = await response.json();
          setFileType(data);
        }
      } catch (error) {
        console.error('Error fetching file type data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!fileType) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              File Type Not Found
            </h1>
            <Link 
              href="/files" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to File Types
            </Link>
          </div>
        </div>
      </>
    );
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'windows':
        return <Monitor className="w-5 h-5" />;
      case 'macos':
      case 'mac':
        return <Apple className="w-5 h-5" />;
      case 'linux':
        return <Server className="w-5 h-5" />;
      case 'android':
        return <Smartphone className="w-5 h-5" />;
      case 'ios':
        return <Smartphone className="w-5 h-5" />;
      case 'web':
        return <Globe className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const getLicenseBadge = (license?: string) => {
    if (!license) return null;
    
    let badgeClass = "px-2 py-0.5 text-xs rounded-full ";
    let text = license;
    
    switch (license?.toLowerCase()) {
      case 'free':
        badgeClass += "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
        text = "Free";
        break;
      case 'freemium':
        badgeClass += "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
        text = "Free+";
        break;
      case 'paid':
        badgeClass += "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
        text = "Paid";
        break;
      case 'bundled':
        badgeClass += "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
        text = "Included";
        break;
      default:
        badgeClass += "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
    
    return <span className={badgeClass}>{text}</span>;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-5 h-5 fill-yellow-200 text-yellow-400" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-5 h-5 text-gray-300 dark:text-gray-600" />
        );
      }
    }
    
    return stars;
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Breadcrumb */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                Home
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Link href="/files" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                File Types
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 dark:text-white font-medium">
                .{fileType.extension.toUpperCase()}
              </span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      .{fileType.extension.toUpperCase()} File Extension
                    </h1>
                    <h2 className="text-xl text-gray-600 dark:text-gray-400">
                      {fileType.name}
                    </h2>
                  </div>
                  <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                    .{fileType.extension}
                  </div>
                </div>

                {/* Rating and metadata */}
                {(fileType.rating || fileType.developer || fileType.category) && (
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {fileType.rating && (
                      <div className="flex items-center gap-1">
                        {renderStars(fileType.rating)}
                        <span className="ml-2">
                          {fileType.rating.toFixed(1)} ({fileType.votes?.toLocaleString()} votes)
                        </span>
                      </div>
                    )}
                    {fileType.developer && (
                      <div>
                        <span className="font-medium">Developer:</span> {fileType.developer}
                      </div>
                    )}
                    {fileType.category && (
                      <div>
                        <span className="font-medium">Category:</span> {fileType.category}
                      </div>
                    )}
                  </div>
                )}

                {/* Summary */}
                {fileType.summary && (
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {fileType.summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'overview'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Overview
                    </button>
                    {fileType.more_information && (
                      <button
                        onClick={() => setActiveTab('more')}
                        className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'more'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        More Information
                      </button>
                    )}
                    {fileType.how_to_open && (
                      <button
                        onClick={() => setActiveTab('open')}
                        className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'open'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        How to Open
                      </button>
                    )}
                    {fileType.programs && Object.keys(fileType.programs).length > 0 && (
                      <button
                        onClick={() => setActiveTab('programs')}
                        className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'programs'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        Programs
                      </button>
                    )}
                  </nav>
                </div>

                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          File Format Details
                        </h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              File Extension
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                              .{fileType.extension}
                            </dd>
                          </div>
                          {fileType.format_type && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Format Type
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                {fileType.format_type}
                              </dd>
                            </div>
                          )}
                          {fileType.mime_type && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                MIME Type
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                                {fileType.mime_type}
                              </dd>
                            </div>
                          )}
                          {fileType.magic_number && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Magic Number
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                                {fileType.magic_number}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      {fileType.summary && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            What is a .{fileType.extension} file?
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {fileType.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* More Information Tab */}
                  {activeTab === 'more' && fileType.more_information && (
                    <div className="space-y-6">
                      {fileType.more_information.screenshot && (
                        <figure className="mb-6">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={fileType.more_information.screenshot.url}
                            srcSet={fileType.more_information.screenshot.srcset}
                            alt={fileType.more_information.screenshot.alt}
                            width={fileType.more_information.screenshot.width}
                            height={fileType.more_information.screenshot.height}
                            className="rounded-lg shadow-md w-full"
                          />
                          {fileType.more_information.screenshot.caption && (
                            <figcaption className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                              {fileType.more_information.screenshot.caption}
                            </figcaption>
                          )}
                        </figure>
                      )}
                      
                      {fileType.more_information.content && (
                        <div className="prose prose-gray dark:prose-invert max-w-none">
                          {fileType.more_information.content.map((paragraph, index) => (
                            <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* How to Open Tab */}
                  {activeTab === 'open' && fileType.how_to_open && (
                    <div className="space-y-6">
                      {fileType.how_to_open.instructions && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Opening .{fileType.extension} Files
                          </h3>
                          <div className="prose prose-gray dark:prose-invert max-w-none">
                            {fileType.how_to_open.instructions.map((instruction, index) => (
                              <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                {instruction}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {fileType.how_to_open.programs && fileType.how_to_open.programs.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                            Recommended Programs
                          </h4>
                          <ul className="space-y-2">
                            {fileType.how_to_open.programs.map((program, index) => (
                              <li key={index} className="flex items-center">
                                <Code className="w-4 h-4 text-gray-400 mr-2" />
                                {program.url ? (
                                  <a
                                    href={program.url}
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    {program.name}
                                  </a>
                                ) : (
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {program.name}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Programs Tab */}
                  {activeTab === 'programs' && fileType.programs && (
                    <div className="space-y-6">
                      {Object.entries(fileType.programs).map(([platform, programs]) => (
                        <div key={platform}>
                          <div className="flex items-center gap-2 mb-3">
                            {getPlatformIcon(platform)}
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                              {platform}
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {programs.map((program, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  {program.icon && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src={program.icon}
                                      alt={program.name}
                                      className="w-8 h-8"
                                    />
                                  )}
                                  <div>
                                    {program.url ? (
                                      <a
                                        href={program.url}
                                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                      >
                                        {program.name}
                                      </a>
                                    ) : (
                                      <span className="text-gray-900 dark:text-white font-medium">
                                        {program.name}
                                      </span>
                                    )}
                                    {program.status === 'discontinued' && (
                                      <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                                        (Discontinued)
                                      </span>
                                    )}
                                    {program.external && (
                                      <ExternalLink className="inline-block w-3 h-3 ml-1 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                                {getLicenseBadge(program.license)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {/* Program List Section */}
                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Program List
                        </h3>
                        <div className="prose prose-gray dark:prose-invert max-w-none">
                          <p className="text-gray-700 dark:text-gray-300 mb-4">
                            The following is a comprehensive list of programs that can open, edit, convert, or otherwise work with .{fileType.extension} files:
                          </p>
                          <ul className="space-y-1 list-disc list-inside text-gray-700 dark:text-gray-300">
                            {Object.entries(fileType.programs).map(([platform, programs]) => 
                              programs.map((program, index) => (
                                <li key={`${platform}-${index}`}>
                                  <strong>{platform}:</strong> {program.name}
                                  {program.license && program.license !== 'Free' && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                                      ({program.license})
                                    </span>
                                  )}
                                  {program.status === 'discontinued' && (
                                    <span className="text-sm text-red-600 dark:text-red-400 ml-1">
                                      (Discontinued)
                                    </span>
                                  )}
                                </li>
                              ))
                            ).flat()}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Info
                </h3>
                
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Extension
                    </dt>
                    <dd className="mt-1 text-lg font-mono text-gray-900 dark:text-white">
                      .{fileType.extension}
                    </dd>
                  </div>
                  
                  {fileType.developer && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Developer
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {fileType.developer}
                      </dd>
                    </div>
                  )}
                  
                  {fileType.category && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Category
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {fileType.category}
                      </dd>
                    </div>
                  )}
                  
                  {fileType.format_type && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Format
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {fileType.format_type}
                      </dd>
                    </div>
                  )}
                  
                  {fileType.last_updated && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Updated
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {fileType.last_updated}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/files"
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    View All File Types
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FileTypeDetail;