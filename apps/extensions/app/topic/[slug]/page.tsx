import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { TopicPageClient } from './client';
import { getTopicBySlug, getExtensionsByTopic, getAllTopicSlugs } from '@/lib/extensions';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  return getAllTopicSlugs().map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const topic = getTopicBySlug(params.slug);

  if (!topic) {
    return {};
  }

  return {
    title: `${topic.name} Extensions - Browser Extension Directory`,
    description: topic.description,
  };
}

export default function TopicPage({ params }: PageProps) {
  const topic = getTopicBySlug(params.slug);

  if (!topic) {
    notFound();
  }

  const extensions = getExtensionsByTopic(topic.id);

  return <TopicPageClient topic={topic} extensions={extensions} />;
}