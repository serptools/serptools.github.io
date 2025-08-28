import React from 'react';
import { FileText } from 'lucide-react';

interface TechnicalInfoSectionProps {
  moreInfo: string;
}

export default function TechnicalInfoSection({ moreInfo }: TechnicalInfoSectionProps) {
  if (!moreInfo || moreInfo.trim() === '') return null;
  
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-blue-600" />
        More Information
      </h3>
      <div className="prose prose-gray max-w-none">
        {moreInfo.split('\n\n').map((paragraph, idx) => (
          <p key={idx} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}