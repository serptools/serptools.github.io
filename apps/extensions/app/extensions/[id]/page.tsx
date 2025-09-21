import { redirect } from 'next/navigation';
import { getExtensionById, getAllExtensionIds } from '@/lib/extensions';

// Generate static params for all extensions (including local)
export async function generateStaticParams() {
  return getAllExtensionIds().map(id => ({
    id,
  }));
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Redirect old URLs to new URL structure
export default async function SingleExtensionRedirect({ params }: PageProps) {
  const { id } = await params;

  // Get extension to find its slug
  const extension = getExtensionById(id);

  // If extension found, redirect to new URL structure
  if (extension) {
    redirect(`/extensions/detail/${extension.slug}/${extension.id}/`);
  }

  // If not found, redirect to extensions page
  redirect('/extensions/');
}