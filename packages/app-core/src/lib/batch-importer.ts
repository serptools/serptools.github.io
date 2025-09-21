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
   * Parse a batch import list from various formats with fuzzy matching
   */
  parseImportList(input: string): ImportToolRequest[] {
    const requests: ImportToolRequest[] = [];
    const lines = input.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue; // Skip empty lines and comments

      const parsed = this.parseConversionLine(trimmed);
      if (parsed) {
        // Validate formats
        if (!this.isValidFormat(parsed.from) || !this.isValidFormat(parsed.to)) {
          continue;
        }

        // Generate operation type
        const operation = this.determineOperation(parsed.from, parsed.to);
        
        requests.push({
          from: parsed.from,
          to: parsed.to,
          operation,
          priority: 5,
          tags: [parsed.from, parsed.to, operation]
        });
      }
    }

    return requests;
  }

  /**
   * Parse a single conversion line with multiple format support
   * Handles: "jpg to png", "convert jpg to png", "jpg 2 png", "jpg->png", etc.
   */
  private parseConversionLine(line: string): { from: string; to: string } | null {
    // Remove common prefixes and clean up
    let cleaned = line
      .toLowerCase()
      .replace(/^(convert|change|transform|turn)\s+/i, '') // Remove action words
      .replace(/\s+(file|image|video|audio|document)?\s*$/i, '') // Remove file type suffixes
      .trim();

    // Handle different separator patterns
    const patterns = [
      // "jpeg to rw2", "jpg to ktx" - most common
      /^(\w+)\s+to\s+(\w+)$/i,
      // "jpeg → rw2", "jpg -> ktx", "jpg=>png" - arrow formats
      /^(\w+)\s*[-→>=]+\s*(\w+)$/i,
      // "jpeg 2 png", "jpg 2 ktx" - number separator
      /^(\w+)\s+2\s+(\w+)$/i,
      // "jpeg into png", "jpg into ktx" - into separator  
      /^(\w+)\s+into\s+(\w+)$/i,
      // "jpeg,rw2", "jpg:ktx", "jpg|png" - punctuation separators
      /^(\w+)[,:;|]+(\w+)$/i,
      // "jpeg rw2", "jpg ktx" - space separated (fallback)
      /^(\w+)\s+(\w+)$/i
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        return {
          from: match[1].toLowerCase(),
          to: match[2].toLowerCase()
        };
      }
    }

    return null;
  }

    return requests;
  }

  /**
   * Analyze import requests against existing tools with enhanced duplicate detection
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

      // Enhanced fuzzy matching for different naming patterns
      const fuzzyMatch = this.findFuzzyMatch(request, existingTools);
      if (fuzzyMatch) {
        existing.push({
          request,
          existingTool: fuzzyMatch.tool,
          match: fuzzyMatch.matchType as 'exact' | 'similar'
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
   * Find fuzzy matches for tools that might be duplicates with different naming
   */
  private findFuzzyMatch(request: ImportToolRequest, existingTools: Tool[]): { tool: Tool; matchType: string } | null {
    for (const tool of existingTools) {
      // Check for format aliases (e.g., jpg vs jpeg)
      const fromMatch = this.areFormatsEquivalent(request.from, tool.from || '');
      const toMatch = this.areFormatsEquivalent(request.to, tool.to || '');

      if (fromMatch && toMatch) {
        return { tool, matchType: 'similar' };
      }

      // Check tool name patterns for semantic matches
      if (this.isSemanticMatch(request, tool)) {
        return { tool, matchType: 'similar' };
      }
    }

    return null;
  }

  /**
   * Check if two formats are equivalent (e.g., jpg vs jpeg)
   */
  private areFormatsEquivalent(format1: string, format2: string): boolean {
    if (format1 === format2) return true;

    // Define format aliases
    const aliases: Record<string, string[]> = {
      'jpg': ['jpeg', 'jfif'],
      'jpeg': ['jpg', 'jfif'],
      'jfif': ['jpg', 'jpeg'],
      'tiff': ['tif'],
      'tif': ['tiff'],
      'mpeg': ['mpg'],
      'mpg': ['mpeg'],
      'mov': ['qt'],
      'qt': ['mov']
    };

    const format1Aliases = aliases[format1.toLowerCase()] || [];
    const format2Aliases = aliases[format2.toLowerCase()] || [];

    return format1Aliases.includes(format2.toLowerCase()) || 
           format2Aliases.includes(format1.toLowerCase());
  }

  /**
   * Check if request semantically matches existing tool based on name patterns
   */
  private isSemanticMatch(request: ImportToolRequest, tool: Tool): boolean {
    const toolName = tool.name.toLowerCase();
    const toolId = tool.id.toLowerCase();
    
    // Generate expected patterns for the request
    const expectedPatterns = [
      `${request.from} to ${request.to}`,
      `${request.from}-to-${request.to}`,
      `${request.from}2${request.to}`,
      `${request.from} ${request.to}`,
      `convert ${request.from} to ${request.to}`,
      `${request.from} converter`,
      `${request.to} converter`
    ];

    // Check if tool name or ID matches any expected pattern
    for (const pattern of expectedPatterns) {
      if (toolName.includes(pattern) || toolId.includes(pattern.replace(/\s+/g, '-'))) {
        return true;
      }
    }

    // Check reverse patterns (in case formats are swapped)
    const reversePatterns = [
      `${request.to} to ${request.from}`,
      `${request.to}-to-${request.from}`
    ];

    for (const pattern of reversePatterns) {
      if (toolName.includes(pattern) || toolId.includes(pattern.replace(/\s+/g, '-'))) {
        return true;
      }
    }

    return false;
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
   * Generate import statistics with enhanced duplicate detection info
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
      
      // Group by match type for better organization
      const exactMatches = analysis.existing.filter(e => e.match === 'exact');
      const similarMatches = analysis.existing.filter(e => e.match === 'similar');

      if (exactMatches.length > 0) {
        report += `\n### Exact Matches (${exactMatches.length})\n`;
        exactMatches.forEach(({ request, existingTool }) => {
          report += `- \`${request.from} → ${request.to}\` - **exact match** with "${existingTool.name}" (${existingTool.id})\n`;
        });
      }

      if (similarMatches.length > 0) {
        report += `\n### Similar/Fuzzy Matches (${similarMatches.length})\n`;
        similarMatches.forEach(({ request, existingTool }) => {
          report += `- \`${request.from} → ${request.to}\` - **fuzzy match** with "${existingTool.name}" (${existingTool.id})\n`;
        });
      }
      
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
   * Test the parsing capabilities with sample inputs
   */
  testParsingCapabilities(): { input: string; parsed: any; success: boolean }[] {
    const testCases = [
      // Basic formats
      'jpg to png',
      'jpeg to webp',
      
      // With prefixes
      'convert jpg to png',
      'convert jpeg to webp',
      'change gif to mp4',
      'transform pdf to doc',
      'turn mp3 to wav',
      
      // Number separator
      'jpg 2 png',
      'jpeg 2 webp',
      'mp4 2 gif',
      
      // Arrow formats  
      'jpg -> png',
      'jpeg → webp',
      'gif=>mp4',
      'pdf >= doc',
      
      // Other separators
      'jpg into png',
      'jpeg,webp',
      'gif:mp4',
      'pdf|doc',
      'mp3;wav',
      
      // With suffixes
      'jpg to png file',
      'convert jpeg to webp image',
      'mp4 to gif video',
      
      // Space separated (fallback)
      'jpg png',
      'jpeg webp',
      
      // Should fail
      'invalid input',
      'jpg to',
      'to png',
      ''
    ];

    return testCases.map(input => {
      const parsed = this.parseConversionLine(input);
      return {
        input,
        parsed,
        success: parsed !== null
      };
    });
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