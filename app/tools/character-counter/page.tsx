"use client";

import CharacterCounter from "@/components/tools/CharacterCounter";
import { FAQSection } from "@/components/sections/FAQSection";
import { BlogSection } from "@/components/sections/BlogSection";
import { ChangelogSection } from "@/components/sections/ChangelogSection";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import { toolContent } from '@/lib/tool-content';

export default function Page() {
  const content = toolContent["character-counter"];
  
  if (!content) {
    return <div>Tool not found</div>;
  }
  
  return (
    <main className="min-h-screen bg-background">
        {/* Custom Character Counter Component */}
        <CharacterCounter />
        
        {/* FAQs Section */}
        {content.faqs && <FAQSection faqs={content.faqs} />}
        
        {/* Blog Articles Section */}
        {content.blogPosts && <BlogSection blogPosts={content.blogPosts} />}
        
        {/* Changelog Section */}
        {content.changelog && <ChangelogSection changelog={content.changelog} />}
        
        {/* Related Tools Link Hub */}
        <ToolsLinkHub relatedTools={content.relatedTools} />
    </main>
  );
}