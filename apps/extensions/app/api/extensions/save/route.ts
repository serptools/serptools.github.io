import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const LOCAL_EXTENSIONS_PATH = path.join(process.cwd(), 'data', 'local-extensions.json');

export async function POST(request: NextRequest) {
  try {
    const extensionData = await request.json();

    // Validate required fields
    if (!extensionData.id || !extensionData.name || !extensionData.slug) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, slug' },
        { status: 400 }
      );
    }

    // Read existing local extensions
    let localExtensions = [];
    try {
      const fileContent = await fs.readFile(LOCAL_EXTENSIONS_PATH, 'utf-8');
      localExtensions = JSON.parse(fileContent);
    } catch (error) {
      // File doesn't exist yet or is empty
      localExtensions = [];
    }

    // Check if extension already exists
    const existingIndex = localExtensions.findIndex((ext: any) => ext.id === extensionData.id);

    if (existingIndex !== -1) {
      // Update existing extension
      localExtensions[existingIndex] = {
        ...localExtensions[existingIndex],
        ...extensionData,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new extension
      localExtensions.push({
        ...extensionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Save back to file
    await fs.writeFile(
      LOCAL_EXTENSIONS_PATH,
      JSON.stringify(localExtensions, null, 2)
    );

    return NextResponse.json({
      success: true,
      message: existingIndex !== -1 ? 'Extension updated' : 'Extension added',
      id: extensionData.id,
      slug: extensionData.slug,
      pageUrl: `/extensions/${extensionData.id}`
    });

  } catch (error) {
    console.error('Error saving extension:', error);
    return NextResponse.json(
      { error: 'Failed to save extension' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Read local extensions
    let localExtensions = [];
    try {
      const fileContent = await fs.readFile(LOCAL_EXTENSIONS_PATH, 'utf-8');
      localExtensions = JSON.parse(fileContent);
    } catch (error) {
      localExtensions = [];
    }

    return NextResponse.json(localExtensions);

  } catch (error) {
    console.error('Error reading extensions:', error);
    return NextResponse.json(
      { error: 'Failed to read extensions' },
      { status: 500 }
    );
  }
}