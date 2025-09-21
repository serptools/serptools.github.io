import { NextRequest, NextResponse } from 'next/server';
import { getAllExtensions, getExtensionById } from '@/lib/extensions';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // Get all extensions to debug
  const allExtensions = getAllExtensions();

  // Try to find specific extension if ID provided
  const specificExtension = id ? getExtensionById(id) : null;

  return NextResponse.json({
    totalExtensions: allExtensions.length,
    requestedId: id,
    foundExtension: specificExtension,
    allExtensionIds: allExtensions.map(e => e.id),
    // Show first few extensions for debugging
    sampleExtensions: allExtensions.slice(0, 5).map(e => ({
      id: e.id,
      name: e.name,
      slug: e.slug
    }))
  });
}