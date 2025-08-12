import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import CategoryPageTemplate from '@/components/CategoryPageTemplate';

interface FileTypeData {
  extension: string;
  name: string;
  summary: string;
  category?: string;
  categorySlug?: string;
  developer?: string;
  popularity?: {
    rating: number;
    votes: number;
  };
  image?: {
    icon?: string;
  };
}

interface CategoryInfo {
  name: string;
  slug: string;
  description: string;
  fileTypes: FileTypeData[];
}

const categoryMetadata: Record<string, { name: string; description: string }> = {
  'web': {
    name: 'Web Files',
    description: 'Files used for web development and internet applications, including data interchange formats, stylesheets, and web technologies.'
  },
  'page_layout': {
    name: 'Page Layout Files',
    description: 'Document and page layout files used for creating, viewing, and sharing formatted documents across different platforms.'
  },
  'raster_image': {
    name: 'Raster Image Files',
    description: 'Bitmap image files composed of pixels, commonly used for photographs, digital art, and web graphics.'
  },
  'vector_image': {
    name: 'Vector Image Files',
    description: 'Scalable graphics files that use mathematical formulas to represent images, ideal for logos, illustrations, and designs.'
  },
  'data': {
    name: 'Data Files',
    description: 'Structured data files used for storing and exchanging information between applications and databases.'
  },
  'text': {
    name: 'Text Files',
    description: 'Plain text and formatted text documents used for writing, coding, and documentation.'
  },
  'video': {
    name: 'Video Files',
    description: 'Digital video files containing moving images and audio, used for movies, clips, and streaming content.'
  },
  'audio': {
    name: 'Audio Files',
    description: 'Digital audio files containing music, podcasts, sound effects, and other audio content.'
  },
  'compressed': {
    name: 'Compressed Files',
    description: 'Archive files that contain one or more compressed files or folders, used for storage and file transfer.'
  },
  'executable': {
    name: 'Executable Files',
    description: 'Program files that can be run directly by the operating system to perform specific tasks or launch applications.'
  },
  'game': {
    name: 'Game Files',
    description: 'Files used by video games for storing game data, saves, configurations, and resources.'
  },
  'database': {
    name: 'Database Files',
    description: 'Structured data storage files used by database management systems to organize and retrieve information.'
  },
  'developer': {
    name: 'Developer Files',
    description: 'Source code, configuration, and project files used in software development and programming.'
  },
  'system': {
    name: 'System Files',
    description: 'Operating system and configuration files essential for system functionality and settings.'
  },
  'misc': {
    name: 'Misc Files',
    description: 'Various file types that don\'t fit into other standard categories.'
  }
};

async function getCategoryData(categorySlug: string): Promise<CategoryInfo | null> {
  try {
    // Get category metadata
    const categoryInfo = categoryMetadata[categorySlug];
    if (!categoryInfo) {
      return null;
    }

    // Read all file type data files
    const dataDir = path.join(process.cwd(), 'public', 'data', 'filetypes');
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
    
    const fileTypes: FileTypeData[] = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(dataDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        // Check if this file type belongs to the current category
        if (data.categorySlug === categorySlug) {
          fileTypes.push({
            extension: data.extension,
            name: data.name,
            summary: data.summary,
            category: data.category,
            categorySlug: data.categorySlug,
            developer: data.developer,
            popularity: data.popularity,
            image: data.image
          });
        }
      } catch (error) {
        console.error(`Error reading ${file}:`, error);
      }
    }

    // Sort file types by popularity (if available) or alphabetically
    fileTypes.sort((a, b) => {
      if (a.popularity && b.popularity) {
        return b.popularity.rating - a.popularity.rating;
      }
      return a.extension.localeCompare(b.extension);
    });

    return {
      name: categoryInfo.name,
      slug: categorySlug,
      description: categoryInfo.description,
      fileTypes
    };
  } catch (error) {
    console.error('Error getting category data:', error);
    return null;
  }
}

export async function generateStaticParams() {
  // Generate params for all known categories
  return Object.keys(categoryMetadata).map(slug => ({
    category: slug
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const categoryData = await getCategoryData(category);
  
  if (!categoryData) {
    return {
      title: 'Category Not Found',
      description: 'The requested file category could not be found.'
    };
  }

  return {
    title: `${categoryData.name} - File Types & Extensions`,
    description: `Browse ${categoryData.fileTypes.length} ${categoryData.name.toLowerCase()}. ${categoryData.description}`,
    keywords: `${categoryData.name}, file types, file extensions, ${categoryData.fileTypes.slice(0, 5).map(ft => `.${ft.extension}`).join(', ')}`,
    openGraph: {
      title: `${categoryData.name} - File Types & Extensions`,
      description: categoryData.description,
      type: 'website',
    }
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categoryData = await getCategoryData(category);

  if (!categoryData) {
    notFound();
  }

  return <CategoryPageTemplate data={categoryData} />;
}