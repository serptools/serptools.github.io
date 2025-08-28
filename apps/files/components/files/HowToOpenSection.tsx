import React from 'react';
import { HelpCircle, Monitor, Smartphone, Cloud } from 'lucide-react';

interface Program {
  name: string;
  license?: string;
  url?: string;
}

interface HowToOpenSectionProps {
  extension: string;
  howToOpen: string;
  programsThatOpen: Record<string, Program[]>;
}

const platformIcons: Record<string, React.JSX.Element> = {
  win: <Monitor className="w-4 h-4" />,
  mac: <Monitor className="w-4 h-4" />,
  lin: <Monitor className="w-4 h-4" />,
  linux: <Monitor className="w-4 h-4" />,
  and: <Smartphone className="w-4 h-4" />,
  android: <Smartphone className="w-4 h-4" />,
  ios: <Smartphone className="w-4 h-4" />,
  web: <Cloud className="w-4 h-4" />,
  cos: <Monitor className="w-4 h-4" />
};

const platformNames: Record<string, string> = {
  win: 'Windows',
  mac: 'macOS',
  lin: 'Linux',
  linux: 'Linux',
  and: 'Android',
  android: 'Android',
  ios: 'iOS',
  web: 'Web',
  cos: 'Chrome OS'
};

export default function HowToOpenSection({ extension, howToOpen, programsThatOpen }: HowToOpenSectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
        How to open .{extension} files
      </h3>
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-700 leading-relaxed">{howToOpen}</p>
      </div>

      {/* Programs by Platform */}
      {Object.keys(programsThatOpen).length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="font-semibold text-gray-900">Programs that open .{extension} files:</h4>
          {Object.entries(programsThatOpen).map(([platform, programs]) => (
            <div key={platform} className="border-l-2 border-blue-200 pl-4">
              <div className="flex items-center space-x-2 mb-2">
                {platformIcons[platform]}
                <span className="font-medium text-gray-900">{platformNames[platform]}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {programs.map((program, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                    <span className="text-sm text-gray-700">{program.name}</span>
                    {program.license && (
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        {program.license}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}