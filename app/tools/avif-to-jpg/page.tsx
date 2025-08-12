"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import { toolContent } from "@/config/tool-content";

export default function Page() {
  const content = toolContent["avif-to-jpg"];
  
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