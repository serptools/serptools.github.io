import { Button } from "@serp-tools/ui/components/button";
import { ExternalLink, Shield, Lock, CheckSquare, ShoppingCart, Coins, Moon, Bookmark, Palette, Code, Video, Clipboard, Gauge, Puzzle, DollarSign } from "lucide-react";
import extensionsData from '@serp-tools/app-core/data/extensions.json';
import { notFound } from 'next/navigation';

// Generate static params for all extensions
export async function generateStaticParams() {
  return extensionsData
    .filter((extension: any) => extension.isActive)
    .map((extension: any) => ({
      id: extension.id,
    }));
}

// Icon mapping for extensions using slug
const iconMap: { [key: string]: any } = {
  'ublock-origin': Shield,
  'lastpass': Lock,
  'grammarly': CheckSquare,
  'honey': ShoppingCart,
  'metamask': Coins,
  'dark-reader': Moon,
  'todoist': CheckSquare,
  'pocket': Bookmark,
  'colorpick-eyedropper': Palette,
  'wappalyzer': Code,
  'json-formatter': Code,
  'ghostery': Shield,
  'loom': Video,
  'notion-web-clipper': Clipboard,
  'momentum': Gauge,
};

interface PageProps {
  params: {
    id: string;
  };
}

export default function SingleExtensionPage({ params }: PageProps) {
  // Find the extension by ID from the JSON data
  const extensionData = extensionsData.find((ext: any) => ext.id === params.id);

  // If extension not found, return 404
  if (!extensionData) {
    notFound();
  }

  // Map the extension data
  const extension = {
    id: extensionData.id,
    slug: extensionData.slug,
    name: extensionData.name,
    icon: iconMap[extensionData.slug] || Puzzle,
    description: extensionData.description,
    category: extensionData.category,
    url: extensionData.url,
    chromeStoreUrl: extensionData.chromeStoreUrl,
    firefoxAddonUrl: extensionData.firefoxAddonUrl,
    rating: extensionData.rating,
    users: extensionData.users,
    tags: extensionData.tags,
  };

  const Icon = extension.icon;

  // Get related extensions from same category
  const alternatives = extensionsData
    .filter((ext: any) =>
      ext.category === extension.category &&
      ext.id !== extension.id &&
      ext.isActive
    )
    .slice(0, 10)
    .map((ext: any) => ({
      id: ext.id,
      name: ext.name,
      description: ext.description,
      icon: iconMap[ext.slug] || Puzzle,
      hasDeal: Math.random() > 0.7 // Simulate some having deals
    }));

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 pb-20 pt-8">
        <article>
          {/* Header Section */}
          <div className="mb-6 lg:mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-none mr-3 lg:mr-4 w-20 h-20 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                <Icon className="h-12 w-12" />
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
          <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
            <p>{extension.description}</p>

            {extension.tags && extension.tags.length > 0 && (
              <>
                <p><strong>Features:</strong></p>
                <ul>
                  {extension.tags.map((tag: string, index: number) => (
                    <li key={index}>
                      <p>{tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ')}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Additional info */}
            <div className="not-prose mt-6 space-y-2">
              {extension.rating && (
                <p className="text-sm text-muted-foreground">
                  <strong>Rating:</strong> {extension.rating} / 5 stars
                </p>
              )}
              {extension.users && (
                <p className="text-sm text-muted-foreground">
                  <strong>Users:</strong> {extension.users}
                </p>
              )}
              {extension.category && (
                <p className="text-sm text-muted-foreground">
                  <strong>Category:</strong> {extension.category.charAt(0).toUpperCase() + extension.category.slice(1)}
                </p>
              )}
            </div>

            {/* Store Links */}
            <div className="not-prose mt-6 space-y-2">
              {extension.chromeStoreUrl && (
                <p className="text-sm">
                  <a
                    href={extension.chromeStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Available on Chrome Web Store →
                  </a>
                </p>
              )}
              {extension.firefoxAddonUrl && (
                <p className="text-sm">
                  <a
                    href={extension.firefoxAddonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Available on Firefox Add-ons →
                  </a>
                </p>
              )}
            </div>
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
                    href={`/extensions/${alt.id}`}
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