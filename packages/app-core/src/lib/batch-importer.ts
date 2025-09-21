/**
 * Batch Tool Import System
 * 
 * Allows administrators to import large lists of tools and automatically
 * detect which ones already exist vs. which are new.
 */

import fs from 'fs/promises';
import { Tool } from './tool-generator';
import { ToolRegistryManager } from './tool-registry';

export interface ImportToolRequest {
  from: string;
  to: string;
  operation?: string;
  priority?: number;
  tags?: string[];
}

export interface ImportAnalysisResult {
  total: number;
  existing: Array<{
    request: ImportToolRequest;
    existingTool: Tool;
    match: 'exact' | 'similar';
  }>;
  new: ImportToolRequest[];
  conflicts: Array<{
    request: ImportToolRequest;
    issue: string;
  }>;
}

export interface ImportExecutionResult {
  success: boolean;
  created: Tool[];
  skipped: Array<{ tool: ImportToolRequest; reason: string }>;
  errors: Array<{ tool: ImportToolRequest; error: string }>;
}

export class BatchToolImporter {
  private registryManager: ToolRegistryManager;
  private supportedFormats: Set<string>;

  constructor(registryManager: ToolRegistryManager) {
    this.registryManager = registryManager;
    this.supportedFormats = new Set([
      // Image formats
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif',
      'heic', 'heif', 'avif', 'jfif', 'psd', 'raw', 'cr2', 'nef', 'arw', 'dng',
      'rw2', 'orf', 'raf', 'pef', 'srw', 'x3f', 'gpr', 'dcr', 'mrw', 'erf',
      'mef', 'mos', 'srf', 'sr2', '3fr', 'fff', 'iiq', 'k25', 'kdc', 'mdc',
      'xbm', 'pam', 'pcd', 'wbmp', 'dot', 'sk', 'ktx', 'ktx2', 'odt',
      // Video formats  
      'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'mpeg', 'mpg', 'mts',
      'm4v', '3gp', 'asf', 'divx', 'f4v', 'hevc', 'm2ts', 'mjpeg', 'vob', 'ts',
      // Audio formats
      'mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'm4a', 'aiff', 'opus',
      // Document formats
      'pdf', 'doc', 'docx', 'txt', 'rtf', 'odf', 'pages',
      // Data formats
      'json', 'csv', 'xml', 'yaml'
    ]);
  }

  /**
   * Parse a batch import list from various formats
   */
  parseImportList(input: string): ImportToolRequest[] {
    const requests: ImportToolRequest[] = [];
    const lines = input.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Handle different formats
      let from: string, to: string;

      // Format: "jpeg to rw2" or "jpg to ktx"
      const toMatch = trimmed.match(/^(\w+)\s+to\s+(\w+)$/i);
      if (toMatch) {
        from = toMatch[1].toLowerCase();
        to = toMatch[2].toLowerCase();
      }
      // Format: "jpeg -> rw2" or "jpg → ktx"
      else {
        const arrowMatch = trimmed.match(/^(\w+)\s*[-→>]+\s*(\w+)$/i);
        if (arrowMatch) {
          from = arrowMatch[1].toLowerCase();
          to = arrowMatch[2].toLowerCase();
        }
        // Format: "jpeg,rw2" or "jpg:ktx"
        else {
          const separatorMatch = trimmed.match(/^(\w+)[,:;|]+(\w+)$/i);
          if (separatorMatch) {
            from = separatorMatch[1].toLowerCase();
            to = separatorMatch[2].toLowerCase();
          } else {
            continue; // Skip lines we can't parse
          }
        }
      }

      // Validate formats
      if (!this.isValidFormat(from) || !this.isValidFormat(to)) {
        continue;
      }

      // Generate operation type
      const operation = this.determineOperation(from, to);
      
      requests.push({
        from,
        to,
        operation,
        priority: 5,
        tags: [from, to, operation]
      });
    }

    return requests;
  }

  /**
   * Analyze import requests against existing tools
   */
  async analyzeImportRequests(requests: ImportToolRequest[]): Promise<ImportAnalysisResult> {
    const existingTools = await this.registryManager.getAllTools();
    const existing: ImportAnalysisResult['existing'] = [];
    const newRequests: ImportToolRequest[] = [];
    const conflicts: ImportAnalysisResult['conflicts'] = [];

    for (const request of requests) {
      // Check for exact matches
      const exactMatch = existingTools.find(tool => 
        tool.from === request.from && 
        tool.to === request.to &&
        tool.operation === request.operation
      );

      if (exactMatch) {
        existing.push({
          request,
          existingTool: exactMatch,
          match: 'exact'
        });
        continue;
      }

      // Check for similar matches (same conversion, different operation)
      const similarMatch = existingTools.find(tool => 
        tool.from === request.from && 
        tool.to === request.to
      );

      if (similarMatch) {
        existing.push({
          request,
          existingTool: similarMatch,
          match: 'similar'
        });
        continue;
      }

      // Validate request
      const validationIssues = this.validateImportRequest(request);
      if (validationIssues.length > 0) {
        conflicts.push({
          request,
          issue: validationIssues.join('; ')
        });
        continue;
      }

      newRequests.push(request);
    }

    return {
      total: requests.length,
      existing,
      new: newRequests,
      conflicts
    };
  }

  /**
   * Execute import of new tools
   */
  async executeImport(
    requests: ImportToolRequest[], 
    options: {
      skipExisting?: boolean;
      generateContent?: boolean;
      dryRun?: boolean;
    } = {}
  ): Promise<ImportExecutionResult> {
    const created: Tool[] = [];
    const skipped: Array<{ tool: ImportToolRequest; reason: string }> = [];
    const errors: Array<{ tool: ImportToolRequest; error: string }> = [];

    for (const request of requests) {
      try {
        // Generate tool configuration
        const tool = this.generateToolFromRequest(request);
        
        // Check if tool already exists
        const existing = await this.registryManager.getTool(tool.id);
        if (existing && options.skipExisting) {
          skipped.push({
            tool: request,
            reason: 'Tool already exists and skipExisting is enabled'
          });
          continue;
        }

        // Generate content if requested
        if (options.generateContent) {
          tool.content = this.generateBasicContent(tool);
        }

        if (!options.dryRun) {
          // Register the tool
          await this.registryManager.registerTool(tool);
        }

        created.push(tool);

      } catch (error) {
        errors.push({
          tool: request,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      success: errors.length === 0,
      created,
      skipped,
      errors
    };
  }

  /**
   * Import from file
   */
  async importFromFile(filePath: string, options?: Parameters<BatchToolImporter['executeImport']>[1]): Promise<{
    analysis: ImportAnalysisResult;
    execution?: ImportExecutionResult;
  }> {
    const content = await fs.readFile(filePath, 'utf-8');
    const requests = this.parseImportList(content);
    const analysis = await this.analyzeImportRequests(requests);
    
    let execution;
    if (analysis.new.length > 0) {
      execution = await this.executeImport(analysis.new, options);
    }

    return { analysis, execution };
  }

  /**
   * Generate import statistics
   */
  generateImportReport(analysis: ImportAnalysisResult, execution?: ImportExecutionResult): string {
    let report = `# Batch Tool Import Report\n\n`;
    
    report += `## Summary\n`;
    report += `- **Total requests**: ${analysis.total}\n`;
    report += `- **Existing tools**: ${analysis.existing.length}\n`;
    report += `- **New tools**: ${analysis.new.length}\n`;
    report += `- **Conflicts**: ${analysis.conflicts.length}\n\n`;

    if (analysis.existing.length > 0) {
      report += `## Existing Tools\n`;
      analysis.existing.forEach(({ request, existingTool, match }) => {
        report += `- \`${request.from} → ${request.to}\` - ${match} match with "${existingTool.name}" (${existingTool.id})\n`;
      });
      report += `\n`;
    }

    if (analysis.conflicts.length > 0) {
      report += `## Conflicts\n`;
      analysis.conflicts.forEach(({ request, issue }) => {
        report += `- \`${request.from} → ${request.to}\` - ${issue}\n`;
      });
      report += `\n`;
    }

    if (execution) {
      report += `## Execution Results\n`;
      report += `- **Created**: ${execution.created.length}\n`;
      report += `- **Skipped**: ${execution.skipped.length}\n`;
      report += `- **Errors**: ${execution.errors.length}\n\n`;

      if (execution.created.length > 0) {
        report += `### Successfully Created\n`;
        execution.created.forEach(tool => {
          report += `- ${tool.name} (${tool.id})\n`;
        });
        report += `\n`;
      }

      if (execution.errors.length > 0) {
        report += `### Errors\n`;
        execution.errors.forEach(({ tool, error }) => {
          report += `- \`${tool.from} → ${tool.to}\` - ${error}\n`;
        });
      }
    }

    return report;
  }

  /**
   * Validate an import request
   */
  private validateImportRequest(request: ImportToolRequest): string[] {
    const issues: string[] = [];

    if (!this.isValidFormat(request.from)) {
      issues.push(`Unsupported source format: ${request.from}`);
    }

    if (!this.isValidFormat(request.to)) {
      issues.push(`Unsupported target format: ${request.to}`);
    }

    if (request.from === request.to) {
      issues.push('Source and target formats cannot be the same');
    }

    return issues;
  }

  /**
   * Check if a format is valid/supported
   */
  private isValidFormat(format: string): boolean {
    return this.supportedFormats.has(format.toLowerCase());
  }

  /**
   * Determine the operation type based on formats
   */
  private determineOperation(from: string, to: string): string {
    const imageFormats = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'heic', 'heif', 'avif', 'psd', 'raw']);
    const videoFormats = new Set(['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'mpeg']);
    const audioFormats = new Set(['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma']);

    if (imageFormats.has(from) && imageFormats.has(to)) return 'convert';
    if (videoFormats.has(from) && videoFormats.has(to)) return 'convert';
    if (audioFormats.has(from) && audioFormats.has(to)) return 'convert';
    if (videoFormats.has(from) && imageFormats.has(to)) return 'convert'; // video thumbnail
    if (videoFormats.has(from) && audioFormats.has(to)) return 'extract'; // audio extraction

    return 'convert'; // default
  }

  /**
   * Generate a Tool object from an import request
   */
  private generateToolFromRequest(request: ImportToolRequest): Tool {
    const id = `${request.from}-to-${request.to}`;
    const name = `${request.from.toUpperCase()} to ${request.to.toUpperCase()}`;
    const description = `Convert ${request.from.toUpperCase()} files to ${request.to.toUpperCase()} format`;

    return {
      id,
      name,
      description,
      operation: request.operation || 'convert',
      route: `/${id}`,
      from: request.from,
      to: request.to,
      isActive: true,
      tags: request.tags || [request.from, request.to, request.operation || 'convert'],
      priority: request.priority || 5
    };
  }

  /**
   * Generate basic content for a tool
   */
  private generateBasicContent(tool: Tool): any {
    return {
      tool: {
        title: tool.name,
        subtitle: `Convert ${tool.from?.toUpperCase()} files to ${tool.to?.toUpperCase()} format quickly and easily.`,
        from: tool.from,
        to: tool.to
      },
      faqs: [
        {
          question: `What is ${tool.from?.toUpperCase()} format?`,
          answer: `${tool.from?.toUpperCase()} is a file format used for storing digital content.`
        },
        {
          question: `Why convert ${tool.from?.toUpperCase()} to ${tool.to?.toUpperCase()}?`,
          answer: `Converting to ${tool.to?.toUpperCase()} can provide better compatibility, smaller file sizes, or different features.`
        },
        {
          question: 'Is the conversion free?',
          answer: 'Yes, our online converter is completely free to use.'
        },
        {
          question: 'Is my data secure?',
          answer: 'All conversions happen locally in your browser. Your files never leave your device.'
        }
      ],
      aboutSection: {
        fromFormat: {
          name: tool.from?.toUpperCase() || '',
          fullName: tool.from?.toUpperCase() || '',
          description: `${tool.from?.toUpperCase()} files are commonly used for digital content.`
        },
        toFormat: {
          name: tool.to?.toUpperCase() || '',
          fullName: tool.to?.toUpperCase() || '',
          description: `${tool.to?.toUpperCase()} is a widely supported format with excellent compatibility.`
        }
      }
    };
  }
}

/**
 * Create a batch tool importer instance
 */
export function createBatchToolImporter(registryManager: ToolRegistryManager): BatchToolImporter {
  return new BatchToolImporter(registryManager);
}