"use client";

import { useState } from 'react';
import { Button } from "@serp-tools/ui/components/button";
import { Badge } from "@serp-tools/ui/components/badge";
import { ArrowLeft, Loader2, Copy, Check, Save, ExternalLink } from "lucide-react";
import Link from 'next/link';

export default function AddExtensionPage() {
  const [url, setUrl] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pageUrl, setPageUrl] = useState('');

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/extensions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url || undefined,
          name: manualName || undefined,
          description: manualDescription || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze extension');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/extensions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });

      if (!response.ok) {
        throw new Error('Failed to save extension');
      }

      const data = await response.json();
      setSaved(true);
      setPageUrl(data.pageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen">
      <section className="container max-w-4xl py-12">
        <Link href="/extensions" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back to extensions
        </Link>

        <h1 className="text-3xl font-bold mb-8">Add New Extension</h1>

        <div className="space-y-8">
          {/* URL Input Section */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Option 1: Add from Chrome Web Store</h2>
            <p className="text-sm text-muted-foreground">
              Paste a Chrome Web Store URL and we'll fetch the extension details automatically
            </p>
            <input
              type="url"
              placeholder="https://chrome.google.com/webstore/detail/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border bg-background"
            />
          </div>

          {/* Manual Input Section */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Option 2: Manual Entry</h2>
            <p className="text-sm text-muted-foreground">
              Or provide the extension details manually
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Extension Name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-background"
              />
              <textarea
                placeholder="Extension Description"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-background min-h-[100px]"
              />
            </div>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || (!url && (!manualName || !manualDescription))}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Extension...
              </>
            ) : (
              'Analyze Extension'
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-950 p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="rounded-lg border p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Analysis Result</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1 h-3 w-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3 w-3" />
                        Copy JSON
                      </>
                    )}
                  </Button>
                  {!saved && (
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-1 h-3 w-3" />
                          Save & Create Page
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="font-medium">Name:</span> {result.name}
                </div>
                <div>
                  <span className="font-medium">Slug:</span> <code className="px-2 py-1 bg-muted rounded">{result.slug}</code>
                </div>
                <div>
                  <span className="font-medium">Description:</span> {result.description}
                </div>
                <div>
                  <span className="font-medium">Category:</span>{' '}
                  <Badge variant="secondary">{result.category}</Badge>
                </div>
                {result.topics && result.topics.length > 0 && (
                  <div>
                    <span className="font-medium">Topics:</span>{' '}
                    {result.topics.map((topic: string) => (
                      <Badge key={topic} variant="outline" className="mr-2">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}
                {result.tags && result.tags.length > 0 && (
                  <div>
                    <span className="font-medium">Tags:</span>{' '}
                    {result.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="mr-2 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">JSON Output:</p>
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>

              {saved ? (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm font-medium mb-2 text-green-600 dark:text-green-400">
                    ✓ Extension saved successfully!
                  </p>
                  <div className="flex items-center gap-2">
                    <Link href={pageUrl} className="text-sm underline text-green-600 dark:text-green-400">
                      View Extension Page
                    </Link>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground">
                    The extension is now live and accessible at {pageUrl}
                  </p>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-sm">
                    <strong>Next Step:</strong> Click "Save & Create Page" to make this extension live, or copy the JSON to add it manually to{' '}
                    <code className="px-2 py-1 bg-muted rounded">
                      @serp-tools/app-core/data/extensions.json
                    </code>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}