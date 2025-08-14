"use client";

import HeroConverter from "@/components/HeroConverter";
import LanderHeroTwoColumn from "@/components/LanderHeroTwoColumn";
import { VideoSection } from "@/components/sections/VideoSection";
import { AboutFormatsSection } from "@/components/sections/AboutFormatsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { ToolsLinkHub } from "@/components/sections/ToolsLinkHub";
import { BlogSection } from "@/components/sections/BlogSection";
import { ChangelogSection } from "@/components/sections/ChangelogSection";
import type { 
  ToolInfo, 
  VideoSectionData,
  FAQ,
  AboutFormatsSection as AboutFormatsSectionData,
  ChangelogEntry,
  RelatedTool,
  BlogPost 
} from "@/types";

type ToolPageProps = {
  tool: ToolInfo;
  videoSection?: VideoSectionData;
  useTwoColumnLayout?: boolean;
  faqs?: FAQ[];
  aboutSection?: AboutFormatsSectionData;
  changelog?: ChangelogEntry[];
  relatedTools?: RelatedTool[];
  blogPosts?: BlogPost[];
};

export default function ToolPageTemplate({
  tool,
  videoSection,
  useTwoColumnLayout = true, // Default to true for two-column layout
  faqs,
  aboutSection,
  changelog,
  relatedTools,
  blogPosts,
}: ToolPageProps) {
  return (
    <main className="min-h-screen bg-background">
        {/* Hero Section with Tool */}
        {useTwoColumnLayout && videoSection?.embedId ? (
          <>
            <LanderHeroTwoColumn
              title={tool.title}
              subtitle={tool.subtitle}
              from={tool.from}
              to={tool.to}
              accept={tool.accept}
              videoEmbedId={videoSection.embedId}
            />
            {/* About the Formats Section - Right after 2-column hero */}
            {aboutSection && (
              <AboutFormatsSection
                fromFormat={aboutSection.fromFormat}
                toFormat={aboutSection.toFormat}
              />
            )}
          </>
        ) : (
          <>
            <HeroConverter
              title={tool.title}
              subtitle={tool.subtitle}
              from={tool.from}
              to={tool.to}
              accept={tool.accept}
            />
            {/* About the Formats Section - Right after regular hero */}
            {aboutSection && (
              <AboutFormatsSection
                fromFormat={aboutSection.fromFormat}
                toFormat={aboutSection.toFormat}
              />
            )}
            {/* Video Section - only show if not using 2-column layout */}
            {videoSection && <VideoSection embedId={videoSection.embedId} />}
          </>
        )}

        {/* FAQs Section */}
        {faqs && <FAQSection faqs={faqs} />}

        {/* Blog Articles Section */}
        {blogPosts && <BlogSection blogPosts={blogPosts} />}

        {/* Changelog Section */}
        {changelog && <ChangelogSection changelog={changelog} />}

        {/* Related Tools Link Hub */}
        <ToolsLinkHub relatedTools={relatedTools} />
    </main>
  );
}