"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import HeroConverter from "@/components/HeroConverter";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["mp4-to-mpeg2"];
  
  if (!content) {
    // Fallback to HeroConverter for tools without content
    return (
      <HeroConverter
        title="MP4 to MPEG2"
        subtitle="Convert MP4 video files to MPEG2 format"
        from="mp4"
        to="mpeg2"
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
