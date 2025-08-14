"use client";

import type { Tool, OperationType, MediaType } from '@/types';
import { 
  operationDefinitions, 
  mediaTypeDefinitions, 
  formatToMediaType
} from '@/lib/tool-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRightLeft, Minimize2, Combine, Download, Image, Film, Music, FileText } from 'lucide-react';

const operationIcons = {
  convert: ArrowRightLeft,
  compress: Minimize2,
  combine: Combine,
  download: Download,
};

const mediaIcons = {
  image: Image,
  video: Film,
  audio: Music,
  document: FileText,
  text: FileText,
};

interface ToolWithMedia extends Tool {
  mediaTypes?: {
    source?: MediaType;
    target?: MediaType;
  };
}

interface ToolsByTaxonomyProps {
  tools: Tool[];
  groupBy?: 'operation' | 'media';
  selectedOperation?: OperationType;
  selectedMediaType?: MediaType;
}

export function ToolsByTaxonomy({ 
  tools, 
  groupBy = 'operation',
  selectedOperation,
  selectedMediaType 
}: ToolsByTaxonomyProps) {
  // Add media types to tools
  const toolsWithMedia: ToolWithMedia[] = tools.map(tool => ({
    ...tool,
    mediaTypes: {
      source: tool.from ? formatToMediaType[tool.from.toLowerCase()] : undefined,
      target: tool.to ? formatToMediaType[tool.to.toLowerCase()] : undefined,
    }
  }));

  // Filter tools based on selection
  let filteredTools = toolsWithMedia;
  if (selectedOperation) {
    filteredTools = filteredTools.filter(tool => tool.operation === selectedOperation);
  }
  if (selectedMediaType) {
    filteredTools = filteredTools.filter(tool => 
      tool.mediaTypes?.source === selectedMediaType || 
      tool.mediaTypes?.target === selectedMediaType
    );
  }

  if (groupBy === 'operation') {
    // Group by operation type
    const toolsByOperation = filteredTools.reduce((acc, tool) => {
      if (!acc[tool.operation]) {
        acc[tool.operation] = [];
      }
      acc[tool.operation].push(tool);
      return acc;
    }, {} as Record<OperationType, ToolWithMedia[]>);

    // Sort tools by priority within each operation
    Object.keys(toolsByOperation).forEach(operation => {
      toolsByOperation[operation as OperationType].sort((a, b) => 
        (b.priority || 0) - (a.priority || 0)
      );
    });

    const operationsToShow = selectedOperation 
      ? [selectedOperation]
      : (Object.keys(operationDefinitions) as OperationType[]);

    return (
      <div className="space-y-12">
        {operationsToShow.map(operation => {
          const operationInfo = operationDefinitions[operation];
          const operationTools = toolsByOperation[operation] || [];
          const Icon = operationIcons[operation];

          if (operationTools.length === 0) return null;

          return (
            <div key={operation} className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg bg-${operationInfo.color}-100 dark:bg-${operationInfo.color}-900/20`}>
                  <Icon className={`h-6 w-6 text-${operationInfo.color}-600 dark:text-${operationInfo.color}-400`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{operationInfo.name} Tools</h2>
                  <p className="text-muted-foreground">{operationInfo.description}</p>
                </div>
                <span className="ml-auto px-3 py-1 rounded-full bg-muted text-sm font-medium">
                  {operationTools.length} tools
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {operationTools.map(tool => (
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
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {tool.from && tool.to && (
                            <span className="text-xs text-muted-foreground">
                              {tool.from.toUpperCase()} → {tool.to.toUpperCase()}
                            </span>
                          )}
                          {tool.mediaTypes?.source && (
                            <span className="text-xs px-2 py-1 rounded-full bg-muted">
                              {mediaTypeDefinitions[tool.mediaTypes.source].name}
                            </span>
                          )}
                        </div>
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
  } else {
    // Group by media type
    const toolsByMedia = filteredTools.reduce((acc, tool) => {
      // Add to source media type
      if (tool.mediaTypes?.source) {
        if (!acc[tool.mediaTypes.source]) {
          acc[tool.mediaTypes.source] = [];
        }
        acc[tool.mediaTypes.source].push(tool);
      }
      // Add to target media type if different
      if (tool.mediaTypes?.target && tool.mediaTypes.target !== tool.mediaTypes.source) {
        if (!acc[tool.mediaTypes.target]) {
          acc[tool.mediaTypes.target] = [];
        }
        // Avoid duplicates
        if (!acc[tool.mediaTypes.target].find(t => t.id === tool.id)) {
          acc[tool.mediaTypes.target].push(tool);
        }
      }
      return acc;
    }, {} as Record<MediaType, Tool[]>);

    // Sort tools by priority within each media type
    Object.keys(toolsByMedia).forEach(media => {
      toolsByMedia[media as MediaType].sort((a, b) => 
        (b.priority || 0) - (a.priority || 0)
      );
    });

    const mediaTypesToShow = selectedMediaType 
      ? [selectedMediaType]
      : (Object.keys(mediaTypeDefinitions) as MediaType[]);

    return (
      <div className="space-y-12">
        {mediaTypesToShow.map(mediaType => {
          const mediaInfo = mediaTypeDefinitions[mediaType];
          const mediaTools = toolsByMedia[mediaType] || [];
          const Icon = mediaIcons[mediaType];

          if (mediaTools.length === 0) return null;

          return (
            <div key={mediaType} className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg bg-${mediaInfo.color}-100 dark:bg-${mediaInfo.color}-900/20`}>
                  <Icon className={`h-6 w-6 text-${mediaInfo.color}-600 dark:text-${mediaInfo.color}-400`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{mediaInfo.pluralName}</h2>
                  <p className="text-muted-foreground">{mediaInfo.description}</p>
                </div>
                <span className="ml-auto px-3 py-1 rounded-full bg-muted text-sm font-medium">
                  {mediaTools.length} tools
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {mediaTools.map(tool => (
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
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {tool.from && tool.to && (
                            <span className="text-xs text-muted-foreground">
                              {tool.from.toUpperCase()} → {tool.to.toUpperCase()}
                            </span>
                          )}
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">
                            {operationDefinitions[tool.operation].name}
                          </span>
                        </div>
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
}