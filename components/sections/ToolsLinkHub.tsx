import toolsData from '@/data/tools.json';

type ToolsLinkHubProps = {
  relatedTools?: Array<{
    title: string;
    href: string;
  }>;
};

interface Tool {
  id: string;
  name: string;
  route: string;
  tags?: string[];
  priority?: number;
  isActive: boolean;
}

// Generate dynamic tools from tools.json
function generateAllTools() {
  const allTools = (toolsData as Tool[]).filter(tool => tool.isActive);
  
  // Group tools by their primary tag
  const groupedTools = allTools.reduce((groups, tool) => {
    const primaryTag = tool.tags?.[0] || 'Other';
    if (!groups[primaryTag]) {
      groups[primaryTag] = [];
    }
    groups[primaryTag].push({
      title: tool.name,
      href: tool.route
    });
    return groups;
  }, {} as Record<string, Array<{ title: string; href: string }>>);

  // Sort tools within each group by priority (higher first) then name
  Object.values(groupedTools).forEach(tools => {
    tools.sort((a, b) => {
      const toolA = allTools.find(t => t.route === a.href);
      const toolB = allTools.find(t => t.route === b.href);
      
      const priorityA = toolA?.priority || 0;
      const priorityB = toolB?.priority || 0;
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      return a.title.localeCompare(b.title);
    });
  });

  return groupedTools;
}

export function ToolsLinkHub({ relatedTools }: ToolsLinkHubProps) {
  const allTools = generateAllTools();
  
  return (
    <section className="py-20 bg-gradient-to-b from-gray-100 to-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          All Conversion Tools
        </h2>
        
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-10">
          {Object.entries(allTools).map(([category, tools]) => (
            <div key={category}>
              <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-4">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {tools.map((tool) => (
                  <li key={tool.href}>
                    <a
                      href={tool.href}
                      className="text-sm text-gray-700 hover:text-blue-600 transition-colors duration-150 hover:underline"
                    >
                      {tool.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Can&apos;t find what you&apos;re looking for?
            </p>
            <a
              href="/tools"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Browse All Tools
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}