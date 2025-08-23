import Link from "next/link";
import { Card } from "@/components/ui/card";
import toolsData from "@/data/tools.json";

type Tool = {
  id: string;
  name: string;
  description: string;
  route: string;
  from?: string;
  to?: string;
  isActive: boolean;
};

type RelatedToolsSectionProps = {
  currentFrom: string;
  currentTo: string;
  currentPath: string; // to exclude current tool
};

export function RelatedToolsSection({ currentFrom, currentTo, currentPath }: RelatedToolsSectionProps) {
  const allTools = (toolsData as any[]).filter(tool => tool.isActive);
  
  // Find all tools that involve either format
  const fromTools = allTools.filter(tool => 
    (tool.from === currentFrom || tool.to === currentFrom) && 
    tool.route !== currentPath
  );
  
  const toTools = allTools.filter(tool => 
    (tool.from === currentTo || tool.to === currentTo) && 
    tool.route !== currentPath &&
    !fromTools.includes(tool) // avoid duplicates
  );

  // If no related tools, don't render the section
  if (fromTools.length === 0 && toTools.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          Related Tools
        </h2>
        
        {fromTools.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
              More {currentFrom.toUpperCase()} Tools
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fromTools.map((tool) => (
                <Link key={tool.id} href={tool.route}>
                  <Card className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-gray-200 hover:border-blue-300">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {tool.name}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {tool.description}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {toTools.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
              More {currentTo.toUpperCase()} Tools
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {toTools.map((tool) => (
                <Link key={tool.id} href={tool.route}>
                  <Card className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-gray-200 hover:border-purple-300">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {tool.name}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {tool.description}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}