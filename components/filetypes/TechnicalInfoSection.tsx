import React from 'react';
import { Settings } from 'lucide-react';

interface TechnicalInfoSectionProps {
  moreInfo: string;
}

export default function TechnicalInfoSection({ moreInfo }: TechnicalInfoSectionProps) {
  if (!moreInfo) return null;
  
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Settings className="w-5 h-5 mr-2 text-blue-600" />
        Technical Information
      </h3>
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-700 leading-relaxed">{moreInfo}</p>
      </div>
    </section>
  );
}