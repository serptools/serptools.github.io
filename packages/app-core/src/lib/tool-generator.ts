/**
 * Tool Generation System
 * 
 * This module provides utilities for automatically generating tool pages,
 * configurations, and related files from the central tools registry.
 */

import fs from 'fs/promises';
import path from 'path';
import toolsData from '../data/tools.json';

export interface Tool {
  id: string;
  name: string;
  description: string;
  operation: string;
  route: string;
  from?: string;
  to?: string;
  isActive: boolean;
  tags?: string[];
  priority?: number;
  isBeta?: boolean;
  isNew?: boolean;
  requiresFFmpeg?: boolean;
  content?: any;
}

export interface ToolGeneratorConfig {
  outputDir: string;
  templateDir: string;
  skipExisting?: boolean;
}

export class ToolGenerator {
  private tools: Tool[];
  private config: ToolGeneratorConfig;

  constructor(config: ToolGeneratorConfig) {
    this.tools = toolsData as Tool[];
    this.config = config;
  }

  /**
   * Generate all tool pages based on the tools registry
   */
  async generateAllTools(): Promise<void> {
    console.log(`Generating ${this.tools.length} tool pages...`);
    
    for (const tool of this.tools.filter(t => t.isActive)) {
      await this.generateTool(tool);
    }
    
    console.log('Tool generation complete!');
  }

  /**
   * Generate a single tool page
   */
  async generateTool(tool: Tool): Promise<void> {
    const toolDir = path.join(this.config.outputDir, tool.route);
    
    // Check if tool already exists and skip if configured
    if (this.config.skipExisting) {
      try {
        await fs.access(path.join(toolDir, 'page.tsx'));
        console.log(`Skipping existing tool: ${tool.id}`);
        return;
      } catch {
        // Tool doesn't exist, continue with generation
      }
    }

    // Ensure directory exists
    await fs.mkdir(toolDir, { recursive: true });

    // Generate page.tsx
    await this.generatePageFile(tool, toolDir);
    
    // Generate metadata if needed
    await this.generateMetadata(tool, toolDir);
    
    console.log(`Generated tool page: ${tool.id} -> ${tool.route}`);
  }

  /**
   * Generate the main page.tsx file for a tool
   */
  private async generatePageFile(tool: Tool, toolDir: string): Promise<void> {
    const pageContent = this.generatePageTemplate(tool);
    await fs.writeFile(path.join(toolDir, 'page.tsx'), pageContent);
  }

  /**
   * Generate page template content
   */
  private generatePageTemplate(tool: Tool): string {
    return `"use client";

import ToolPageTemplate from "@/components/ToolPageTemplate";
import { toolContent } from '@/lib/tool-content';

export default function ${this.toPascalCase(tool.id)}Page() {
  const content = toolContent["${tool.id}"];
  
  if (!content) {
    return <div>Tool not found</div>;
  }
  
  return (
    <ToolPageTemplate
      tool={content.tool}
      videoSection={content.videoSection}
      useTwoColumnLayout={true}
      faqs={content.faqs}
      aboutSection={content.aboutSection}
      changelog={content.changelog}
      relatedTools={content.relatedTools}
      blogPosts={content.blogPosts}
    />
  );
}
`;
  }

  /**
   * Generate metadata file if needed
   */
  private async generateMetadata(tool: Tool, toolDir: string): Promise<void> {
    // For now, metadata is handled in the page.tsx
    // Could be expanded to separate files if needed
  }

  /**
   * Convert tool ID to PascalCase for component names
   */
  private toPascalCase(str: string): string {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Get statistics about tools
   */
  getToolStats(): {
    total: number;
    active: number;
    byOperation: Record<string, number>;
    byFormat: Record<string, number>;
  } {
    const active = this.tools.filter(t => t.isActive);
    
    const byOperation: Record<string, number> = {};
    const byFormat: Record<string, number> = {};

    for (const tool of active) {
      byOperation[tool.operation] = (byOperation[tool.operation] || 0) + 1;
      
      if (tool.from) {
        byFormat[tool.from] = (byFormat[tool.from] || 0) + 1;
      }
      if (tool.to) {
        byFormat[tool.to] = (byFormat[tool.to] || 0) + 1;
      }
    }

    return {
      total: this.tools.length,
      active: active.length,
      byOperation,
      byFormat
    };
  }

  /**
   * Validate tools configuration
   */
  validateTools(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const routes = new Set<string>();
    
    for (const tool of this.tools) {
      // Check for duplicate routes
      if (routes.has(tool.route)) {
        errors.push(`Duplicate route: ${tool.route} (${tool.id})`);
      }
      routes.add(tool.route);

      // Check required fields
      if (!tool.id || !tool.name || !tool.description) {
        errors.push(`Missing required fields in tool: ${tool.id}`);
      }

      // Check route format
      if (!tool.route.startsWith('/')) {
        errors.push(`Invalid route format: ${tool.route} (${tool.id})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Utility function to create a new tool generator
 */
export function createToolGenerator(config: ToolGeneratorConfig): ToolGenerator {
  return new ToolGenerator(config);
}