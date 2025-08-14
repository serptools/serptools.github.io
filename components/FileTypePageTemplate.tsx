'use client';

import React from 'react';
import FileTypeBreadcrumb from './files/FileTypeBreadcrumb';
import FileTypeHero from './files/FileTypeHero';
import WhatIsSection from './files/WhatIsSection';
import TechnicalInfoSection from './files/TechnicalInfoSection';
import AdditionalSection from './files/AdditionalSection';
import HowToOpenSection from './files/HowToOpenSection';
import FileTypeSidebar from './files/FileTypeSidebar';

interface FileTypeData {
  extension: string;
  name: string;
  title: string;
  description: string;
  summary: string;
  category?: string;
  categorySlug?: string;
  developer?: string;
  popularity?: {
    rating: number;
    votes: number;
  };
  image: {
    icon?: string;
    screenshot?: string;
    screenshotCaption?: string;
  };
  whatIs: string;
  moreInfo: string;
  howToOpen: string;
  programsThatOpen: Record<string, Array<{
    name: string;
    license?: string;
    url?: string;
  }>>;
  additionalSections: Array<{
    title: string;
    content: string;
  }>;
  relevantTools: Array<{
    category: string;
    description: string;
    tools: Array<{
      title: string;
      href: string;
      description: string;
    }>;
  }>;
  lastUpdated: string;
}

export default function FileTypePageTemplate({ data }: { data: FileTypeData }) {
  console.log('FileTypePageTemplate rendering with data:', {
    extension: data.extension,
    programCount: Object.keys(data.programsThatOpen || {}).length,
    platforms: Object.keys(data.programsThatOpen || {})
  });
  
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <FileTypeBreadcrumb extension={data.extension} />

      {/* Hero Section */}
      <FileTypeHero 
        extension={data.extension}
        name={data.name}
        summary={data.summary}
        category={data.category}
        categorySlug={data.categorySlug}
        developer={data.developer}
        popularity={data.popularity}
        image={data.image}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What Is Section */}
            <WhatIsSection 
              extension={data.extension} 
              whatIs={data.whatIs} 
            />

            {/* Technical Information */}
            <TechnicalInfoSection moreInfo={data.moreInfo} />

            {/* Additional Sections */}
            {data.additionalSections.map((section, idx) => (
              <AdditionalSection 
                key={idx} 
                title={section.title} 
                content={section.content} 
              />
            ))}

            {/* How to Open Section */}
            <HowToOpenSection 
              extension={data.extension}
              howToOpen={data.howToOpen}
              programsThatOpen={data.programsThatOpen}
            />
          </div>

          {/* Sidebar */}
          <FileTypeSidebar 
            extension={data.extension}
            developer={data.developer}
            name={data.name}
            lastUpdated={data.lastUpdated}
            relevantTools={data.relevantTools}
          />
        </div>
      </div>
    </main>
  );
}