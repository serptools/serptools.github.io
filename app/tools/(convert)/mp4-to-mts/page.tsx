"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import HeroConverter from "@/components/HeroConverter";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["mp4-to-mts"];
  
  if (!content) {
    // Fallback to HeroConverter for tools without content
    return (
      <HeroConverter
        title="MP4 to MTS"
        subtitle="Convert MP4 video files to MTS format"
        from="mp4"
        to="mts"
      />
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
