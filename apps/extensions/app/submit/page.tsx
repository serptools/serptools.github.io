"use client";

import { useState } from 'react';
import { Button } from "@serp-tools/ui/components/button";
import { Badge } from "@serp-tools/ui/components/badge";
import {
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle,
  Info,
  Link as LinkIcon
} from "lucide-react";
import Link from 'next/link';

export default function SubmitExtensionPage() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url && (!name || !description)) {
      setError('Please provide either a Chrome Web Store URL or extension name and description');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/submissions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          name,
          description,
          submittedBy: submittedBy || 'Anonymous',
          email
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit extension');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen">
        <section className="container max-w-2xl py-12">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Your extension has been submitted for review. We'll evaluate it and add it to our directory if approved.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/extensions">
                  Browse Extensions
                </Link>
              </Button>
              <Button variant="outline" onClick={() => {
                setSubmitted(false);
                setUrl('');
                setName('');
                setDescription('');
                setSubmittedBy('');
                setEmail('');
              }}>
                Submit Another
              </Button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <section className="container max-w-2xl py-12">
        <Link href="/extensions" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back to extensions
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit an Extension</h1>
          <p className="text-muted-foreground">
            Suggest a browser extension to be added to our directory. We'll review and categorize it for you!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Chrome Web Store URL */}
          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex items-start gap-3">
              <LinkIcon className="h-5 w-5 mt-1 text-muted-foreground" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">Extension URL (Recommended)</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Paste the Chrome Web Store URL and we'll automatically fetch the details
                </p>
                <input
                  type="url"
                  placeholder="https://chromewebstore.google.com/detail/extension-name/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                />
              </div>
            </div>
          </div>

          {/* Manual Entry */}
          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 mt-1 text-muted-foreground" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">Or Provide Details Manually</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  If you don't have a Chrome Web Store URL, you can provide the extension details manually
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Extension Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                  />
                  <textarea
                    placeholder="Extension Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border bg-background min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submitter Info (Optional) */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold mb-2">Your Information (Optional)</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Let us know who's making this suggestion
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your Name"
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-background"
              />
              <input
                type="email"
                placeholder="Your Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-background"
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-950 p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting || (!url && (!name || !description))}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit for Review
              </>
            )}
          </Button>

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              All submissions are reviewed before being added to ensure quality and proper categorization.
              We typically review submissions within 24-48 hours.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}