'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Star, 
  Monitor, 
  Smartphone, 
  Globe, 
  Apple,
  ArrowLeft,
  Calendar,
  Building,
  Download,
  ExternalLink
} from 'lucide-react';

interface FileTypeDetail {
  slug: string;
  extension: string;
  name: string;
  category: string;
  developer_org?: string;
  popularity?: {
    rating: number;
    votes: number;
    source: string;
  };
  summary: string;
  standards?: string[];
  mime_types?: string[];
  related_types?: string[];
  how_to?: {
    save_as?: any[];
    open?: any[];
    convert?: any[];
  };
  programs_by_platform?: {
    [key: string]: Array<{
      software: string;
      display_name: string;
      status?: string;
    }>;
  };
  images?: Array<{
    caption: string;
    alt: string;
    source_url: string;
  }>;
  updated_at?: string;
}

const platformIcons: { [key: string]: any } = {
  windows: Monitor,
  macos: Apple,
  linux: Monitor,
  android: Smartphone,
  ios: Apple,
  web: Globe,
  chromeos: Globe
};

export default function FileTypeDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ext = searchParams.get('ext');
  const [fileType, setFileType] = useState<FileTypeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFileType() {
      // Wait for searchParams to be ready
      if (searchParams === null) {
        return;
      }

      if (!ext) {
        setError('No file extension specified');
        setLoading(false);
        return;
      }

      try {
        console.log('Loading file type:', ext); // Debug log
        const response = await fetch(`/data/filetypes/json/${ext}.json`);
        if (!response.ok) {
          throw new Error(`File type not found: ${response.status}`);
        }
        const data = await response.json();
        setFileType(data);
        setError(null);
      } catch (error) {
        console.error('Failed to load file type:', error);
        setError(`Failed to load file type information for "${ext}"`);
      } finally {
        setLoading(false);
      }
    }
    
    loadFileType();
  }, [ext, searchParams]);

  const formatCategory = (category: string) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDeveloper = (dev: string) => {
    return dev.split('-').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading file type information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !fileType) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">File type not found</h3>
              <p className="text-muted-foreground mb-4">
                {error || `The file type "${ext}" could not be found.`}
              </p>
              <Link href="/filetypes">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to File Types
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/filetypes" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to File Types
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">
                    .{fileType.extension?.toUpperCase() || fileType.slug.toUpperCase()} File
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {fileType.name}
                  </CardDescription>
                </div>
                {fileType.popularity && (
                  <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <div>
                      <div className="font-semibold">{fileType.popularity.rating.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">{fileType.popularity.votes} votes</div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-base leading-relaxed">{fileType.summary}</p>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="outline">
                  <FileText className="mr-1 h-3 w-3" />
                  {formatCategory(fileType.category)}
                </Badge>
                {fileType.developer_org && (
                  <Badge variant="secondary">
                    <Building className="mr-1 h-3 w-3" />
                    {formatDeveloper(fileType.developer_org)}
                  </Badge>
                )}
                {fileType.updated_at && (
                  <Badge variant="outline">
                    <Calendar className="mr-1 h-3 w-3" />
                    Updated: {fileType.updated_at}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {fileType.programs_by_platform && Object.keys(fileType.programs_by_platform).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>How to Open {fileType.extension?.toUpperCase() || fileType.slug.toUpperCase()} Files</CardTitle>
                <CardDescription>
                  Programs that support this file type across different platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={Object.keys(fileType.programs_by_platform)[0]} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                    {Object.keys(fileType.programs_by_platform).map(platform => {
                      const Icon = platformIcons[platform] || Monitor;
                      return (
                        <TabsTrigger key={platform} value={platform} className="capitalize">
                          <Icon className="h-4 w-4 mr-1" />
                          {platform}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  
                  {Object.entries(fileType.programs_by_platform).map(([platform, programs]) => (
                    <TabsContent key={platform} value={platform}>
                      <div className="grid gap-2">
                        {programs.map((program, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Download className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{program.display_name}</span>
                              {program.status === 'discontinued' && (
                                <Badge variant="destructive" className="text-xs">
                                  Discontinued
                                </Badge>
                              )}
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">File Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Extension</dt>
                  <dd className="text-lg font-mono">.{fileType.extension || fileType.slug}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                  <dd>{formatCategory(fileType.category)}</dd>
                </div>
                
                {fileType.developer_org && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Developer</dt>
                    <dd>{formatDeveloper(fileType.developer_org)}</dd>
                  </div>
                )}
                
                {fileType.mime_types && fileType.mime_types.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">MIME Types</dt>
                    <dd className="space-y-1">
                      {fileType.mime_types.map((mime, idx) => (
                        <div key={idx} className="font-mono text-sm">
                          {mime}
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
                
                {fileType.related_types && fileType.related_types.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Related Types</dt>
                    <dd className="flex flex-wrap gap-1">
                      {fileType.related_types.map((type, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
              
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Link href={`/tools/${fileType.slug}-to-pdf`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Convert to PDF
                    </Button>
                  </Link>
                  <Link href={`/tools/${fileType.slug}-to-jpg`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Convert to JPG
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}