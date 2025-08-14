"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["gif-to-jpg"];
  
  if (!content) {
    // Fallback to basic converter if no content exists
    return (
      <div>Tool content not found for gif-to-jpg</div>
    );
  }
  
  return (
    <ToolPageTemplate
      tool={content.tool}
      videoSection={content.videoSection}
      faqs={content.faqs}
      aboutSection={content.aboutSection}
      changelog={content.changelog}
      relatedTools={content.relatedTools}
      blogPosts={content.blogPosts}
    />
  );
}