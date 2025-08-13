import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import FileTypePageTemplate from '@/components/FileTypePageTemplate';

interface FileTypeData {
  extension: string;
  name: string;
  title: string;
  description: string;
  summary: string;
  developer?: string;
  popularity?: {
    rating: number;
    votes: number;
  };
  image: {
    icon?: string;
    screenshot?: string;
    screenshotCaption?: string;
  };
  whatIs: string;
  moreInfo: string;
  howToOpen: string;
  programsThatOpen: Record<string, Array<{
    name: string;
    license?: string;
    url?: string;
  }>>;
  additionalSections: Array<{
    title: string;
    content: string;
  }>;
  relevantTools: Array<{
    category: string;
    description: string;
    tools: Array<{
      title: string;
      href: string;
      description: string;
    }>;
  }>;
  lastUpdated: string;
}

async function getFileTypeData(slug: string): Promise<FileTypeData | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'filetypes', 'json', `${slug}.json`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'filetypes', 'index.json');
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