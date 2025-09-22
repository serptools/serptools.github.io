import React from 'react';

interface AdditionalSectionProps {
  title: string;
  content: string;
}

export default function AdditionalSection({ title, content }: AdditionalSectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-700 leading-relaxed">{content}</p>
      </div>
    </section>
  );
}