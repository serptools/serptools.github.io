import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface FileTypeBreadcrumbProps {
  extension: string;
}

export default function FileTypeBreadcrumb({ extension }: FileTypeBreadcrumbProps) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <nav className="flex items-center space-x-2 text-sm">
          <a href="/" className="text-gray-500 hover:text-gray-700">Home</a>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <Link href="/" className="text-gray-500 hover:text-gray-700">File Types</Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">.{extension.toUpperCase()}</span>
        </nav>
      </div>
    </div>
  );
}