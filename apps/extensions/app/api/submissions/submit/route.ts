import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SUBMISSIONS_PATH = path.join(process.cwd(), 'data', 'submissions.json');

export interface Submission {
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
  extensionData?: any; // Analyzed extension data
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, name, description, submittedBy, email } = body;

    // Validate input
    if (!url && (!name || !description)) {
      return NextResponse.json(
        { error: 'Please provide either a URL or name and description' },
        { status: 400 }
      );
    }

    // Create submission
    const submission: Submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url,
      name,
      description,
      submittedBy: submittedBy || 'Anonymous',
      email,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    // If URL provided, try to analyze it
    if (url) {
      try {
        const analyzeResponse = await fetch(
          new URL('/api/extensions/analyze', request.url).toString(),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          }
        );

        if (analyzeResponse.ok) {
          const extensionData = await analyzeResponse.json();
          submission.extensionData = extensionData;
          // Override name/description with analyzed data if available
          if (extensionData.name) submission.name = extensionData.name;
          if (extensionData.description) submission.description = extensionData.description;
        }
      } catch (error) {
        console.log('Could not auto-analyze URL, will require manual review');
      }
    }

    // Read existing submissions
    let submissions: Submission[] = [];
    try {
      const fileContent = await fs.readFile(SUBMISSIONS_PATH, 'utf-8');
      submissions = JSON.parse(fileContent);
    } catch (error) {
      submissions = [];
    }

    // Add new submission
    submissions.push(submission);

    // Save submissions
    await fs.writeFile(
      SUBMISSIONS_PATH,
      JSON.stringify(submissions, null, 2)
    );

    return NextResponse.json({
      success: true,
      message: 'Extension submitted for review',
      submissionId: submission.id
    });

  } catch (error) {
    console.error('Error submitting extension:', error);
    return NextResponse.json(
      { error: 'Failed to submit extension' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Read submissions
    let submissions: Submission[] = [];
    try {
      const fileContent = await fs.readFile(SUBMISSIONS_PATH, 'utf-8');
      submissions = JSON.parse(fileContent);
    } catch (error) {
      submissions = [];
    }

    // Filter by status if provided
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (status) {
      submissions = submissions.filter(s => s.status === status);
    }

    return NextResponse.json(submissions);

  } catch (error) {
    console.error('Error reading submissions:', error);
    return NextResponse.json(
      { error: 'Failed to read submissions' },
      { status: 500 }
    );
  }
}