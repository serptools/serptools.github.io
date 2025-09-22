import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import FileTypePageTemplate from '@/components/FileTypePageTemplate';
import { transformFileTypeData } from '@/lib/files-transformer';
import type { FileTypeRawData, FileTypeTemplateData } from '@/types';


async function getFileTypeData(slug: string): Promise<FileTypeTemplateData | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'files', 'individual', `${slug}.json`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rawData: FileTypeRawData = JSON.parse(fileContent);
    return transformFileTypeData(rawData);
  } catch (error) {
    console.error(`Error loading filetype ${slug}:`, error);
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'files', 'index.json');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const fileTypes = JSON.parse(indexContent);

    return fileTypes.map((fileType: { slug: string }) => ({
      slug: fileType.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getFileTypeData(slug);

  if (!data) {
    return {
      title: 'File Type Not Found',
    };
  }

  return {
    title: `${data.extension.toUpperCase()} File - ${data.name} | What is .${data.extension}?`,
    description: data.description || data.summary,
    openGraph: {
      title: `${data.extension.toUpperCase()} File - ${data.name}`,
      description: data.description || data.summary,
      type: 'article',
    },
  };
}

export default async function FileTypePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getFileTypeData(slug);

  if (!data) {
    notFound();
  }

  return <FileTypePageTemplate data={data} />;
}