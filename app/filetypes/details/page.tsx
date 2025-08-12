'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  ExternalLink,
  FileCode,
  ArrowRight,
  Info
} from 'lucide-react';

interface FileTypeDetail {
  slug: string;
  extension: string;
  name: string;
  category: string;
  developer_org?: string;
  developer_name?: string;
  popularity?: {
    rating: number;
    votes: number;
    source: string;
  };
  summary: string;
  more_information?: {
    description?: string[];
    screenshot?: {
      url: string;
      alt: string;
      caption: string;
    };
  };
  common_filenames?: Array<{
    filename?: string;
    description?: string;
    text?: string;
  }>;
  how_to_open?: {
    detailed_instructions?: string[];
  };
  how_to_convert?: {
    instructions?: string[];
    formats?: Array<{
      extension?: string;
      name?: string;
      text?: string;
    }>;
  };
  standards?: string[];
  mime_types?: string[];
  related_types?: string[];
  programs_by_platform?: {
    [key: string]: Array<{
      software: string;
      display_name: string;
      status?: string;
      url?: string;
      paid?: boolean;
    }>;
  };
  images?: Array<{
    url?: string;
    caption: string;
    alt: string;
    source_url?: string;
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

export default function FileTypeDetailsEnhancedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ext = searchParams.get('ext');
  const [fileType, setFileType] = useState<FileTypeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFileType() {
      if (searchParams === null) {
        return;
      }

      if (!ext) {
        setError('No file extension specified');
        setLoading(false);
        return;
      }

      try {
        console.log('Loading file type:', ext);
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

      {/* Header with Title and Popularity */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-primary">.{fileType.extension?.toUpperCase() || fileType.slug.toUpperCase()}</span> File Extension
            </h1>
            <h2 className="text-2xl text-muted-foreground">{fileType.name}</h2>
            {fileType.developer_name && (
              <div className="flex items-center gap-2 mt-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Developer: <strong>{fileType.developer_name}</strong></span>
              </div>
            )}
          </div>
          {fileType.popularity && (
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Popularity</div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-2xl font-bold">{fileType.popularity.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {fileType.popularity.votes.toLocaleString()} Votes
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* What is a [EXT] file? */}
          <Card>
            <CardHeader>
              <CardTitle>What is a {fileType.extension?.toUpperCase()} file?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">{fileType.summary || 'No description available.'}</p>
            </CardContent>
          </Card>

          {/* More Information Section */}
          {fileType.more_information && (fileType.more_information.description?.length || fileType.more_information.screenshot) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  More Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fileType.more_information.screenshot && (
                  <figure className="mb-6">
                    <img 
                      src={fileType.more_information.screenshot.url} 
                      alt={fileType.more_information.screenshot.alt}
                      className="rounded-lg border w-full"
                    />
                    <figcaption className="text-sm text-muted-foreground mt-2 text-center">
                      {fileType.more_information.screenshot.caption}
                    </figcaption>
                  </figure>
                )}
                {fileType.more_information.description?.map((para, idx) => (
                  <p key={idx} className="text-base leading-relaxed mb-4 last:mb-0">
                    {para}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Common Filenames */}
          {fileType.common_filenames && fileType.common_filenames.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Common {fileType.extension?.toUpperCase()} Filenames
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fileType.common_filenames.map((item, idx) => (
                    <div key={idx} className="bg-muted/50 p-4 rounded-lg">
                      {item.filename && (
                        <div>
                          <code className="font-mono font-semibold text-lg text-primary">
                            {item.filename}
                          </code>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description.replace(item.filename, '').replace(/^[\s-]+/, '')}
                            </p>
                          )}
                        </div>
                      )}
                      {item.text && !item.filename && (
                        <p className="text-sm">{item.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* How to Open */}
          {fileType.how_to_open?.detailed_instructions && fileType.how_to_open.detailed_instructions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>How to open a {fileType.extension?.toUpperCase()} file</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fileType.how_to_open.detailed_instructions.map((instruction, idx) => (
                    <p key={idx} className="text-base leading-relaxed">
                      {instruction}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* How to Convert */}
          {fileType.how_to_convert && (fileType.how_to_convert.instructions?.length || fileType.how_to_convert.formats?.length) && (
            <Card>
              <CardHeader>
                <CardTitle>How to convert a {fileType.extension?.toUpperCase()} file</CardTitle>
              </CardHeader>
              <CardContent>
                {fileType.how_to_convert.instructions?.map((instruction, idx) => (
                  <p key={idx} className="text-base leading-relaxed mb-4">
                    {instruction}
                  </p>
                ))}
                
                {fileType.how_to_convert.formats && fileType.how_to_convert.formats.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Supported conversion formats:</h4>
                    <div className="grid gap-2">
                      {fileType.how_to_convert.formats.map((format, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                          {format.extension && (
                            <>
                              <code className="font-mono font-bold text-primary">
                                {format.extension}
                              </code>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </>
                          )}
                          <span className="text-sm">{format.name || format.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Programs by Platform */}
          {fileType.programs_by_platform && Object.keys(fileType.programs_by_platform).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Programs that open {fileType.extension?.toUpperCase()} files</CardTitle>
                <CardDescription>
                  Software applications that support this file type across different platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={Object.keys(fileType.programs_by_platform)[0]} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-4">
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
                              {program.paid && (
                                <Badge variant="secondary" className="text-xs">
                                  Paid
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

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">File Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">File Extension</dt>
                  <dd className="text-xl font-mono font-bold">.{fileType.extension || fileType.slug}</dd>
                </div>
                
                <Separator />
                
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                  <dd>{formatCategory(fileType.category)}</dd>
                </div>
                
                {fileType.developer_org && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Developer</dt>
                    <dd>{fileType.developer_name || formatDeveloper(fileType.developer_org)}</dd>
                  </div>
                )}
                
                {fileType.mime_types && fileType.mime_types.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground mb-2">MIME Types</dt>
                      <dd className="space-y-1">
                        {fileType.mime_types.map((mime, idx) => (
                          <code key={idx} className="block font-mono text-xs bg-muted px-2 py-1 rounded">
                            {mime}
                          </code>
                        ))}
                      </dd>
                    </div>
                  </>
                )}
                
                {fileType.updated_at && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Updated: {fileType.updated_at}</span>
                    </div>
                  </>
                )}
              </dl>
              
              <Separator className="my-6" />
              
              <div>
                <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Link href={`/tools/${fileType.slug}-to-pdf`} className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Convert to PDF
                    </Button>
                  </Link>
                  <Link href={`/tools/${fileType.slug}-to-jpg`} className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start">
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