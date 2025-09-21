import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { CategoryPageClient } from './client';
import { getCategoryBySlug, getExtensionsByCategory, getAllCategorySlugs } from '@/lib/extensions';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  return getAllCategorySlugs().map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = getCategoryBySlug(params.slug);

  if (!category) {
    return {};
  }

  return {
    title: `${category.name} Extensions - Browser Extension Directory`,
    description: category.description,
  };
}

export default function CategoryPage({ params }: PageProps) {
  const category = getCategoryBySlug(params.slug);

  if (!category) {
    notFound();
  }

  const extensions = getExtensionsByCategory(params.slug);

  return <CategoryPageClient category={category} extensions={extensions} />;
}