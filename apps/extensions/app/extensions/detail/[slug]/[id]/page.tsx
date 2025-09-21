import { Button } from "@serp-tools/ui/components/button";
import { Badge } from "@serp-tools/ui/components/badge";
import { ExternalLink, Download, Star, Users, Shield, Calendar, Globe, ChevronRight, Image as ImageIcon } from "lucide-react";
import { notFound } from 'next/navigation';
import { getExtensionById, getAllExtensions, getRelatedExtensions } from '@/lib/extensions';
import type { Metadata } from 'next';

// Generate static params for all extensions with slug and id
export async function generateStaticParams() {
  return getAllExtensions().map(ext => ({
    slug: ext.slug,
    id: ext.id,
  }));
}

interface PageProps {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const extension = getExtensionById(id);

  if (!extension) {
    return {};
  }

  return {
    title: `${extension.name} - Browser Extension`,
    description: extension.description,
    openGraph: {
      title: extension.name,
      description: extension.description,
      images: extension.logoUrl ? [extension.logoUrl] : [],
    },
  };
}

export default async function ExtensionDetailPage({ params }: PageProps) {
  const { slug, id } = await params;

  // Get extension using the shared library
  const extension = getExtensionById(id);

  // Verify the slug matches
  if (!extension || extension.slug !== slug) {
    notFound();
  }

  const Icon = extension.icon;

  // Get related extensions
  const alternatives = getRelatedExtensions(extension.id, 6)
    .map((ext) => ({
      id: ext.id,
      slug: ext.slug,
      name: ext.name,
      description: ext.description,
      icon: ext.icon,
      rating: ext.rating,
      users: ext.users
    }));

  // Mock additional data for now (would come from Chrome Web Store API)
  const mockData = {
    version: extension.version || "2.0.0",
    lastUpdated: extension.lastUpdated || "2024-01-15",
    size: extension.size || "1.2 MB",
    developer: extension.developer || {
      name: "Unknown Developer",
      verified: false,
      website: extension.url
    },
    permissions: extension.permissions || [
      "activeTab",
      "storage",
      "notifications"
    ],
    languages: extension.languages || ["English"],
    screenshots: extension.screenshots || [],
    reviews: extension.reviews || {
      total: 0,
      average: extension.rating || 4.5,
      distribution: {
        5: 60,
        4: 25,
        3: 10,
        2: 3,
        1: 2
      }
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b bg-muted/30">
        <div className="container max-w-6xl py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Extension Icon/Logo */}
            <div className="flex-shrink-0">
              {extension.logoUrl ? (
                <img
                  src={extension.logoUrl}
                  alt={extension.name}
                  className="w-24 h-24 rounded-2xl shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Icon className="h-12 w-12" />
                </div>
              )}
            </div>

            {/* Extension Info */}
            <div className="flex-grow">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{extension.name}</h1>
                  <p className="text-lg text-muted-foreground mb-4">{extension.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3" />
                      {extension.rating || 4.5}
                    </Badge>
                    {extension.users && (
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        {extension.users} users
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {extension.category}
                    </Badge>
                    {extension.isNew && (
                      <Badge variant="default" className="bg-green-600">
                        New
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Updated {mockData.lastUpdated}
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Size: {mockData.size}
                    </div>
                    {mockData.developer.verified && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        Verified Developer
                      </div>
                    )}
                  </div>
                </div>

                {/* Install Button */}
                <div className="flex flex-col gap-2">
                  {extension.chromeStoreUrl && (
                    <Button size="lg" className="gap-2" asChild>
                      <a href={extension.chromeStoreUrl} target="_blank" rel="noopener noreferrer">
                        Add to Chrome
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {extension.firefoxAddonUrl && (
                    <Button size="sm" variant="outline" className="gap-2" asChild>
                      <a href={extension.firefoxAddonUrl} target="_blank" rel="noopener noreferrer">
                        Add to Firefox
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container max-w-6xl py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Screenshots */}
            {mockData.screenshots.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Screenshots</h2>
                <div className="grid grid-cols-2 gap-4">
                  {mockData.screenshots.slice(0, 4).map((screenshot, index) => (
                    <img
                      key={index}
                      src={screenshot}
                      alt={`Screenshot ${index + 1}`}
                      className="rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Overview */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Overview</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>{extension.overview || extension.description}</p>

                {extension.features && (
                  <>
                    <h3>Key Features</h3>
                    <ul>
                      {extension.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-xl font-semibold mb-4">User Reviews</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold">{mockData.reviews.average}</div>
                  <div className="flex-grow">
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < Math.floor(mockData.reviews.average) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{mockData.reviews.total} reviews</p>
                  </div>
                </div>

                {/* Rating distribution */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm w-3">{rating}</span>
                      <Star className="h-3 w-3" />
                      <div className="flex-grow bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full"
                          style={{ width: `${mockData.reviews.distribution[rating]}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {mockData.reviews.distribution[rating]}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Developer Info */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Developer</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span>{mockData.developer.name}</span>
                </div>
                {mockData.developer.website && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Website</span>
                    <a
                      href={mockData.developer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Visit
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-3">Additional Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span>{mockData.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span>{mockData.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Languages</span>
                  <span>{mockData.languages.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Permissions */}
            {mockData.permissions.length > 0 && (
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Permissions</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {mockData.permissions.map((permission, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <ChevronRight className="h-3 w-3" />
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Extensions */}
            {alternatives.length > 0 && (
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Similar Extensions</h3>
                <div className="space-y-3">
                  {alternatives.slice(0, 3).map((alt) => {
                    const AltIcon = alt.icon;
                    return (
                      <a
                        key={alt.id}
                        href={`/extensions/detail/${alt.slug}/${alt.id}/`}
                        className="flex items-start gap-3 group hover:bg-muted/50 rounded p-2 -m-2 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <AltIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                            {alt.name}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {alt.description}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}