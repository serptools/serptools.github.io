"use client";

import { Tool } from '@/lib/tool-utils';
import { categoryDefinitions, MainCategory } from '@/config/tool-categories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRightLeft, Minimize2, Combine, Edit, BarChart, Sparkles } from 'lucide-react';

const categoryIcons = {
  convert: ArrowRightLeft,
  compress: Minimize2,
  combine: Combine,
  edit: Edit,
  analyze: BarChart,
  generate: Sparkles,
};

interface ToolsByCategoryProps {
  tools: Tool[];
  selectedCategory?: MainCategory;
}

export function ToolsByCategory({ tools, selectedCategory }: ToolsByCategoryProps) {
  // Group tools by category
  const toolsByCategory = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<MainCategory, Tool[]>);

  // Sort tools by priority within each category
  Object.keys(toolsByCategory).forEach(category => {
    toolsByCategory[category as MainCategory].sort((a, b) => 
      (b.priority || 0) - (a.priority || 0)
    );
  });

  const categoriesToShow = selectedCategory 
    ? [selectedCategory]
    : (Object.keys(categoryDefinitions) as MainCategory[]);

  return (
    <div className="space-y-12">
      {categoriesToShow.map(category => {
        const categoryInfo = categoryDefinitions[category];
        const categoryTools = toolsByCategory[category] || [];
        const Icon = categoryIcons[category];

        if (categoryTools.length === 0) return null;

        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg bg-${categoryInfo.color}-100 dark:bg-${categoryInfo.color}-900/20`}>
                <Icon className={`h-6 w-6 text-${categoryInfo.color}-600 dark:text-${categoryInfo.color}-400`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{categoryInfo.name} Tools</h2>
                <p className="text-muted-foreground">{categoryInfo.description}</p>
              </div>
              <span className="ml-auto px-3 py-1 rounded-full bg-muted text-sm font-medium">
                {categoryTools.length} tools
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryTools.map(tool => (
                <Link key={tool.id} href={tool.route}>
                  <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{tool.name}</span>
                        {tool.priority && tool.priority >= 9 && (
                          <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
                            Popular
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tool.description}
                      </p>
                      {tool.subcategory && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">
                            {tool.subcategory.replace(/-/g, ' ')}
                          </span>
                          {tool.from && tool.to && (
                            <span className="text-xs text-muted-foreground">
                              {tool.from.toUpperCase()} → {tool.to.toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}