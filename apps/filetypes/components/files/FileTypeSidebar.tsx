import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Tool {
  title: string;
  href: string;
  description: string;
}

interface RelevantTool {
  category: string;
  description: string;
  tools: Tool[];
}

interface FileTypeSidebarProps {
  extension: string;
  developer?: string;
  name: string;
  lastUpdated: string;
  relevantTools: RelevantTool[];
}

export default function FileTypeSidebar({
  extension,
  developer,
  name,
  lastUpdated,
  relevantTools
}: FileTypeSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Relevant Tools */}
      {relevantTools.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Convert .{extension} Files
          </h3>
          <div className="space-y-4">
            {relevantTools.map((category, idx) => (
              <div key={idx}>
                <h4 className="text-sm font-medium text-gray-600 mb-2">{category.category}</h4>
                <div className="space-y-2">
                  {category.tools.map((tool, toolIdx) => (
                    <a
                      key={toolIdx}
                      href={`/tools/${tool.href}`}
                      className="block bg-blue-50 hover:bg-blue-100 rounded-lg p-3 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 group-hover:text-blue-600">
                            {tool.title}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {tool.description}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Facts */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Facts</h3>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-gray-600">File Extension</dt>
            <dd className="font-mono text-sm font-medium text-gray-900">.{extension}</dd>
          </div>
          {developer && (
            <div>
              <dt className="text-sm text-gray-600">Developer</dt>
              <dd className="text-sm font-medium text-gray-900">{developer}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-gray-600">File Type</dt>
            <dd className="text-sm font-medium text-gray-900">{name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">Last Updated</dt>
            <dd className="text-sm font-medium text-gray-900">{lastUpdated}</dd>
          </div>
        </dl>
      </div>

      {/* Related File Types */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Related File Types</h3>
        <div className="space-y-2">
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm">
            Browse all file types →
          </Link>
        </div>
      </div>
    </div>
  );
}