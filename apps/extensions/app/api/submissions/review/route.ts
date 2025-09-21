import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Submission } from '../submit/route';

const SUBMISSIONS_PATH = path.join(process.cwd(), 'data', 'submissions.json');
const LOCAL_EXTENSIONS_PATH = path.join(process.cwd(), 'data', 'local-extensions.json');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, action, reviewNotes, extensionData } = body;

    if (!submissionId || !action) {
      return NextResponse.json(
        { error: 'Missing submissionId or action' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Read submissions
    let submissions: Submission[] = [];
    try {
      const fileContent = await fs.readFile(SUBMISSIONS_PATH, 'utf-8');
      submissions = JSON.parse(fileContent);
    } catch (error) {
      return NextResponse.json(
        { error: 'No submissions found' },
        { status: 404 }
      );
    }

    // Find submission
    const submissionIndex = submissions.findIndex(s => s.id === submissionId);
    if (submissionIndex === -1) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const submission = submissions[submissionIndex];

    // Update submission status
    submission.status = action === 'approve' ? 'approved' : 'rejected';
    submission.reviewedAt = new Date().toISOString();
    submission.reviewNotes = reviewNotes;

    // If approved, add to local extensions
    let newExtensionId = null;
    if (action === 'approve' && extensionData) {
      // Read existing local extensions
      let localExtensions = [];
      try {
        const fileContent = await fs.readFile(LOCAL_EXTENSIONS_PATH, 'utf-8');
        localExtensions = JSON.parse(fileContent);
      } catch (error) {
        localExtensions = [];
      }

      // Ensure the extension has required fields
      const extension = {
        ...extensionData,
        id: extensionData.id || submission.id,
        name: extensionData.name || submission.name,
        description: extensionData.description || submission.description,
        slug: extensionData.slug || generateSlug(extensionData.name || submission.name),
        isActive: true,
        createdAt: new Date().toISOString(),
        submissionId: submission.id
      };

      newExtensionId = extension.id;

      // Check if extension already exists
      const existingIndex = localExtensions.findIndex((ext: any) => ext.id === extension.id);

      if (existingIndex !== -1) {
        // Update existing
        localExtensions[existingIndex] = {
          ...localExtensions[existingIndex],
          ...extension,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new
        localExtensions.push(extension);
      }

      // Save local extensions
      await fs.writeFile(
        LOCAL_EXTENSIONS_PATH,
        JSON.stringify(localExtensions, null, 2)
      );
    }

    // Save updated submissions
    await fs.writeFile(
      SUBMISSIONS_PATH,
      JSON.stringify(submissions, null, 2)
    );

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Extension approved and published' : 'Extension rejected',
      extensionId: newExtensionId,
      pageUrl: newExtensionId ? `/extensions/${newExtensionId}` : null
    });

  } catch (error) {
    console.error('Error reviewing submission:', error);
    return NextResponse.json(
      { error: 'Failed to review submission' },
      { status: 500 }
    );
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}