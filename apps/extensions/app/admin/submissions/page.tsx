"use client";

import { useState, useEffect } from 'react';
import { Button } from "@serp-tools/ui/components/button";
import { Badge } from "@serp-tools/ui/components/badge";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ExternalLink,
  Clock,
  Loader2,
  RefreshCw
} from "lucide-react";
import Link from 'next/link';

interface Submission {
  id: string;
  url?: string;
  name?: string;
  description?: string;
  submittedBy?: string;
  email?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  extensionData?: any;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/submissions/submit');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (submissionId: string, action: 'approve' | 'reject', extensionData?: any) => {
    setProcessingId(submissionId);
    try {
      const response = await fetch('/api/submissions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          action,
          extensionData: action === 'approve' ? extensionData : undefined
        })
      });

      if (response.ok) {
        await loadSubmissions();
      }
    } catch (error) {
      console.error('Error reviewing submission:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredSubmissions = submissions.filter(s =>
    filter === 'all' || s.status === filter
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <main className="min-h-screen">
      <section className="container max-w-6xl py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin/add-extension" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="mr-1 h-3 w-3" />
              Back to admin
            </Link>
            <h1 className="text-3xl font-bold">Extension Submissions</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSubmissions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'pending' && (
                <Badge variant="secondary" className="ml-2">
                  {submissions.filter(s => s.status === 'pending').length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">No {filter !== 'all' ? filter : ''} submissions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">
                        {submission.name || submission.extensionData?.name || 'Unnamed Extension'}
                      </h3>
                      {getStatusBadge(submission.status)}
                    </div>
                    <p className="text-muted-foreground mb-2">
                      {submission.description || submission.extensionData?.description || 'No description'}
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Submitted by: {submission.submittedBy}</span>
                      <span>•</span>
                      <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                      {submission.email && (
                        <>
                          <span>•</span>
                          <span>{submission.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {submission.url && (
                  <div className="mb-4">
                    <a
                      href={submission.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {submission.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {submission.extensionData && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Auto-analyzed data:</p>
                    <div className="text-sm space-y-1">
                      <div>Category: <Badge variant="outline">{submission.extensionData.category}</Badge></div>
                      {submission.extensionData.topics?.length > 0 && (
                        <div>
                          Topics: {submission.extensionData.topics.map((t: string) => (
                            <Badge key={t} variant="outline" className="mr-1 text-xs">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {submission.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReview(submission.id, 'approve', submission.extensionData)}
                      disabled={processingId === submission.id}
                    >
                      {processingId === submission.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      )}
                      Approve & Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReview(submission.id, 'reject')}
                      disabled={processingId === submission.id}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}

                {submission.reviewedAt && (
                  <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                    Reviewed on {new Date(submission.reviewedAt).toLocaleDateString()}
                    {submission.reviewNotes && (
                      <p className="mt-1">Notes: {submission.reviewNotes}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}