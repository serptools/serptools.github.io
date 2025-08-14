// Helper to get tool content from the tools data
import toolsData from '@/data/tools.json';
import type { Tool, ToolContent } from '@/types';

const tools = toolsData as Tool[];

// Create a map of tool content by ID
export const toolContent: Record<string, ToolContent | undefined> = {};

tools.forEach(tool => {
  if (tool.content) {
    toolContent[tool.id] = tool.content;
  }
});

// Helper to get content for a specific tool
export function getToolContent(toolId: string): ToolContent | undefined {
  return toolContent[toolId];
}