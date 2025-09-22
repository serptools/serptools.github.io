import { Button } from "@serp-tools/ui/components/button";
import { ExternalLink, Shield, Lock, CheckSquare, ShoppingCart, Coins, Moon, Bookmark, Palette, Code, Video, Clipboard, Gauge, Puzzle, DollarSign } from "lucide-react";
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

  // Get related extensions from same category
  const alternatives = getRelatedExtensions(extension.id, 10)
    .map((ext) => ({
      id: ext.id,
      slug: ext.slug,
      name: ext.name,
      description: ext.description,
      icon: ext.icon,
      hasDeal: Math.random() > 0.7 // Simulate some having deals
    }));

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pb-20 pt-8">
        <article>
          {/* Header Section */}
          <div className="mb-6 lg:mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-none mr-3 lg:mr-4 w-20 h-20 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                {extension.logoUrl ? (
                  <img src={extension.logoUrl} alt={extension.name} className="w-full h-full object-cover" />
                ) : (
                  <Icon className="h-12 w-12" />
                )}
              </div>
              <div>
                {(extension.url || extension.chromeStoreUrl) && (
                  <Button size="sm" className="gap-1" asChild>
                    <a href={extension.url || extension.chromeStoreUrl} target="_blank" rel="noopener noreferrer">
                      <span>{extension.url ? new URL(extension.url).hostname.replace('www.', '') : 'View Extension'}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">{extension.name}</h1>
              <h2 className="text-sm text-muted-foreground">{extension.description}</h2>
            </div>
          </div>

          {/* Content Section */}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="lead">{extension.overview || extension.description}</p>

            {extension.features && extension.features.length > 0 && (
              <>
                <h3>Features</h3>
                <ul>
                  {extension.features.map((feature: string, index: number) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </>
            )}

            {!extension.features && extension.tags && extension.tags.length > 0 && (
              <>
                <h3>Features</h3>
                <ul>
                  {extension.tags.map((tag: string, index: number) => (
                    <li key={index}>
                      {tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ')}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h3>Details</h3>
            <ul>
              {extension.rating && (
                <li>
                  <strong>Rating:</strong> {extension.rating} / 5 stars
                </li>
              )}
              {extension.users && (
                <li>
                  <strong>Users:</strong> {extension.users}
                </li>
              )}
              {extension.category && (
                <li>
                  <strong>Category:</strong> {extension.category.charAt(0).toUpperCase() + extension.category.slice(1)}
                </li>
              )}
            </ul>

            {/* Store Links */}
            {(extension.chromeStoreUrl || extension.firefoxAddonUrl) && (
              <>
                <h3>Download</h3>
                <ul>
                  {extension.chromeStoreUrl && (
                    <li>
                      <a
                        href={extension.chromeStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Available on Chrome Web Store →
                      </a>
                    </li>
                  )}
                  {extension.firefoxAddonUrl && (
                    <li>
                      <a
                        href={extension.firefoxAddonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Available on Firefox Add-ons →
                      </a>
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>
        </article>

        {/* Alternative Tools Section */}
        {alternatives.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center space-x-4 mb-10 md:mb-4">
              <h2 className="flex-none leading-none text-2xl font-bold">
                Alternative tools
              </h2>
              <div className="w-full h-[1px] bg-gradient-to-r from-border to-transparent" />
            </div>

            <div className="grid gap-10 md:gap-4">
              {alternatives.map((alt) => {
                const AltIcon = alt.icon;
                return (
                  <a
                    key={alt.id}
                    href={`/extensions/detail/${alt.slug}/${alt.id}/`}
                    className="relative flex items-center md:p-3 md:bg-muted/30 md:hover:shadow md:rounded-lg transition-all"
                  >
                    <div className="flex-none mr-3 rounded-xl w-16 h-16 overflow-hidden bg-muted flex items-center justify-center">
                      <AltIcon className="h-8 w-8" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-bold line-clamp-1 text-ellipsis overflow-hidden">
                          {alt.name}
                        </h3>
                        {alt.hasDeal && (
                          <div className="shrink-0 flex md:hidden items-center space-x-1">
                            <div className="shrink-0 flex items-center space-x-1 px-1.5 py-0.5 animate-pulse bg-green-200 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full">
                              <DollarSign className="w-3 h-3" />
                              <div className="font-medium text-xs">1 deal</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-sm md:text-xs text-muted-foreground line-clamp-2">
                        {alt.description}
                      </p>
                    </div>
                    {alt.hasDeal && (
                      <div className="absolute -top-2 right-3 hidden md:flex items-center space-x-1">
                        <div className="flex items-center space-x-1 px-1.5 py-0.5 animate-pulse bg-green-200 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full">
                          <DollarSign className="w-3 h-3" />
                          <div className="font-medium text-xs">1 deal</div>
                        </div>
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}