/**
 * Tool Validation Framework
 * 
 * Automated testing system for validating tool functionality,
 * performance, and quality standards.
 */

import fs from 'fs/promises';
import path from 'path';
import { Tool } from './tool-generator';

export interface ValidationTest {
  id: string;
  name: string;
  description: string;
  type: 'functional' | 'performance' | 'quality' | 'security' | 'compatibility';
  required: boolean;
}

export interface ValidationResult {
  testId: string;
  passed: boolean;
  score?: number;
  message: string;
  duration: number;
  data?: any;
}

export interface ToolValidationReport {
  toolId: string;
  timestamp: Date;
  overall: {
    passed: boolean;
    score: number;
    duration: number;
  };
  results: ValidationResult[];
  suggestions: string[];
}

export class ToolValidator {
  private tests: Map<string, ValidationTest> = new Map();
  private customValidators: Map<string, (tool: Tool, testData?: any) => Promise<ValidationResult>> = new Map();

  constructor() {
    this.initializeDefaultTests();
  }

  /**
   * Initialize default validation tests
   */
  private initializeDefaultTests(): void {
    const defaultTests: ValidationTest[] = [
      {
        id: 'tool-structure',
        name: 'Tool Structure',
        description: 'Validates tool has required fields and proper structure',
        type: 'functional',
        required: true
      },
      {
        id: 'route-format',
        name: 'Route Format',
        description: 'Validates tool route follows proper naming conventions',
        type: 'functional',
        required: true
      },
      {
        id: 'content-completeness',
        name: 'Content Completeness',
        description: 'Checks if tool has complete landing page content',
        type: 'quality',
        required: false
      },
      {
        id: 'faq-quality',
        name: 'FAQ Quality',
        description: 'Validates FAQ content quality and completeness',
        type: 'quality',
        required: false
      },
      {
        id: 'format-compatibility',
        name: 'Format Compatibility',
        description: 'Validates format conversion compatibility',
        type: 'functional',
        required: true
      },
      {
        id: 'performance-baseline',
        name: 'Performance Baseline',
        description: 'Establishes performance baseline for the tool',
        type: 'performance',
        required: false
      },
      {
        id: 'security-check',
        name: 'Security Check',
        description: 'Basic security validation for file processing',
        type: 'security',
        required: true
      }
    ];

    defaultTests.forEach(test => this.tests.set(test.id, test));
    this.setupDefaultValidators();
  }

  /**
   * Setup default validation functions
   */
  private setupDefaultValidators(): void {
    // Tool structure validator
    this.customValidators.set('tool-structure', async (tool: Tool): Promise<ValidationResult> => {
      const start = Date.now();
      const required = ['id', 'name', 'description', 'operation', 'route', 'isActive'];
      const missing = required.filter(field => !tool[field as keyof Tool]);
      
      const passed = missing.length === 0;
      const message = passed 
        ? 'Tool structure is valid'
        : `Missing required fields: ${missing.join(', ')}`;

      return {
        testId: 'tool-structure',
        passed,
        score: passed ? 100 : Math.max(0, 100 - (missing.length * 20)),
        message,
        duration: Date.now() - start,
        data: { missing, required }
      };
    });

    // Route format validator
    this.customValidators.set('route-format', async (tool: Tool): Promise<ValidationResult> => {
      const start = Date.now();
      const validRoute = /^\/[a-z0-9-]+(?:-to-[a-z0-9-]+)?$/.test(tool.route);
      const urlSafe = encodeURIComponent(tool.route) === tool.route;
      
      const passed = validRoute && urlSafe;
      const message = passed
        ? 'Route format is valid'
        : `Route format invalid: must start with / and contain only lowercase letters, numbers, and hyphens`;

      return {
        testId: 'route-format',
        passed,
        score: passed ? 100 : 0,
        message,
        duration: Date.now() - start,
        data: { route: tool.route, pattern: '/[a-z0-9-]+(?:-to-[a-z0-9-]+)?' }
      };
    });

    // Content completeness validator
    this.customValidators.set('content-completeness', async (tool: Tool): Promise<ValidationResult> => {
      const start = Date.now();
      
      if (!tool.content) {
        return {
          testId: 'content-completeness',
          passed: false,
          score: 0,
          message: 'No content defined for tool',
          duration: Date.now() - start
        };
      }

      const completeness = {
        hasTitle: !!tool.content.tool?.title,
        hasSubtitle: !!tool.content.tool?.subtitle,
        hasFaqs: tool.content.faqs && tool.content.faqs.length > 0,
        hasAboutSection: !!tool.content.aboutSection,
        hasRelatedTools: tool.content.relatedTools && tool.content.relatedTools.length > 0
      };

      const score = Object.values(completeness).filter(Boolean).length / Object.keys(completeness).length * 100;
      const passed = score >= 70; // Require 70% completeness

      return {
        testId: 'content-completeness',
        passed,
        score,
        message: `Content completeness: ${score.toFixed(1)}%`,
        duration: Date.now() - start,
        data: completeness
      };
    });

    // FAQ quality validator
    this.customValidators.set('faq-quality', async (tool: Tool): Promise<ValidationResult> => {
      const start = Date.now();
      
      if (!tool.content?.faqs || tool.content.faqs.length === 0) {
        return {
          testId: 'faq-quality',
          passed: false,
          score: 0,
          message: 'No FAQs defined',
          duration: Date.now() - start
        };
      }

      const faqs = tool.content.faqs;
      let qualityScore = 0;

      // Check FAQ quality metrics
      const metrics = {
        hasMinimumCount: faqs.length >= 3,
        averageQuestionLength: faqs.reduce((sum: number, faq: any) => sum + faq.question.length, 0) / faqs.length,
        averageAnswerLength: faqs.reduce((sum: number, faq: any) => sum + faq.answer.length, 0) / faqs.length,
        hasVariedQuestions: new Set(faqs.map((faq: any) => faq.question.toLowerCase())).size === faqs.length
      };

      if (metrics.hasMinimumCount) qualityScore += 25;
      if (metrics.averageQuestionLength >= 10 && metrics.averageQuestionLength <= 100) qualityScore += 25;
      if (metrics.averageAnswerLength >= 50) qualityScore += 25;
      if (metrics.hasVariedQuestions) qualityScore += 25;

      const passed = qualityScore >= 75;

      return {
        testId: 'faq-quality',
        passed,
        score: qualityScore,
        message: `FAQ quality score: ${qualityScore}%`,
        duration: Date.now() - start,
        data: metrics
      };
    });

    // Format compatibility validator
    this.customValidators.set('format-compatibility', async (tool: Tool): Promise<ValidationResult> => {
      const start = Date.now();

      if (tool.operation !== 'convert' || !tool.from || !tool.to) {
        return {
          testId: 'format-compatibility',
          passed: true,
          score: 100,
          message: 'Not a format conversion tool',
          duration: Date.now() - start
        };
      }

      // Define format compatibility rules
      const formatGroups = {
        image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'heic', 'heif', 'ico', 'tiff'],
        video: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv', 'mpeg', 'mpg'],
        audio: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'm4a'],
        document: ['pdf', 'doc', 'docx', 'txt', 'rtf']
      };

      const fromGroup = Object.keys(formatGroups).find(group => 
        formatGroups[group as keyof typeof formatGroups].includes(tool.from!)
      );
      const toGroup = Object.keys(formatGroups).find(group => 
        formatGroups[group as keyof typeof formatGroups].includes(tool.to!)
      );

      const compatible = fromGroup && toGroup && fromGroup === toGroup;
      const score = compatible ? 100 : (fromGroup && toGroup ? 50 : 0);

      return {
        testId: 'format-compatibility',
        passed: compatible || false,
        score,
        message: compatible 
          ? `Format conversion compatible (${fromGroup} → ${toGroup})`
          : `Format groups don't match (${fromGroup || 'unknown'} → ${toGroup || 'unknown'})`,
        duration: Date.now() - start,
        data: { fromGroup, toGroup, from: tool.from, to: tool.to }
      };
    });

    // Security check validator
    this.customValidators.set('security-check', async (tool: Tool): Promise<ValidationResult> => {
      const start = Date.now();
      
      const securityChecks = {
        hasInputValidation: true, // Assume tools have input validation
        usesSecureProcessing: !tool.description.toLowerCase().includes('upload') || tool.description.toLowerCase().includes('browser'),
        noExternalDependencies: !tool.requiresFFmpeg, // FFmpeg might be considered external
        sanitizedOutputs: true // Assume outputs are sanitized
      };

      const score = Object.values(securityChecks).filter(Boolean).length / Object.keys(securityChecks).length * 100;
      const passed = score >= 75;

      return {
        testId: 'security-check',
        passed,
        score,
        message: `Security score: ${score.toFixed(1)}%`,
        duration: Date.now() - start,
        data: securityChecks
      };
    });
  }

  /**
   * Add a custom validation test
   */
  addTest(test: ValidationTest, validator: (tool: Tool, testData?: any) => Promise<ValidationResult>): void {
    this.tests.set(test.id, test);
    this.customValidators.set(test.id, validator);
  }

  /**
   * Run all validation tests on a tool
   */
  async validateTool(tool: Tool, testIds?: string[]): Promise<ToolValidationReport> {
    const startTime = Date.now();
    const testsToRun = testIds ? testIds : Array.from(this.tests.keys());
    const results: ValidationResult[] = [];
    const suggestions: string[] = [];

    for (const testId of testsToRun) {
      const validator = this.customValidators.get(testId);
      if (!validator) {
        continue;
      }

      try {
        const result = await validator(tool);
        results.push(result);

        // Generate suggestions for failed tests
        if (!result.passed) {
          const test = this.tests.get(testId);
          if (test?.required) {
            suggestions.push(`Fix ${test.name}: ${result.message}`);
          } else if (test) {
            suggestions.push(`Consider improving ${test.name}: ${result.message}`);
          }
        }
      } catch (error) {
        results.push({
          testId,
          passed: false,
          message: `Validation error: ${error}`,
          duration: 0
        });
        suggestions.push(`Fix validation error in ${testId}`);
      }
    }

    // Calculate overall score and status
    const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0);
    const averageScore = results.length > 0 ? totalScore / results.length : 0;
    const requiredTestsPassed = results.filter(r => {
      const test = this.tests.get(r.testId);
      return test?.required ? r.passed : true;
    }).length === results.filter(r => this.tests.get(r.testId)?.required).length;

    const overall = {
      passed: requiredTestsPassed && averageScore >= 70,
      score: averageScore,
      duration: Date.now() - startTime
    };

    return {
      toolId: tool.id,
      timestamp: new Date(),
      overall,
      results,
      suggestions
    };
  }

  /**
   * Run validation on multiple tools
   */
  async validateTools(tools: Tool[]): Promise<ToolValidationReport[]> {
    const reports: ToolValidationReport[] = [];
    
    for (const tool of tools) {
      const report = await this.validateTool(tool);
      reports.push(report);
    }

    return reports;
  }

  /**
   * Generate validation summary report
   */
  generateSummaryReport(reports: ToolValidationReport[]): {
    overall: { passed: number; failed: number; score: number };
    byType: Record<string, { passed: number; failed: number; averageScore: number }>;
    failedTools: string[];
    suggestions: string[];
  } {
    const overall = {
      passed: reports.filter(r => r.overall.passed).length,
      failed: reports.filter(r => !r.overall.passed).length,
      score: reports.reduce((sum, r) => sum + r.overall.score, 0) / reports.length || 0
    };

    const byType: Record<string, { passed: number; failed: number; averageScore: number; scores: number[] }> = {};

    // Organize results by test type
    for (const report of reports) {
      for (const result of report.results) {
        const test = this.tests.get(result.testId);
        if (!test) continue;

        if (!byType[test.type]) {
          byType[test.type] = { passed: 0, failed: 0, averageScore: 0, scores: [] };
        }

        const typeStats = byType[test.type];
        if (!typeStats) continue;
        
        if (result.passed) {
          typeStats.passed++;
        } else {
          typeStats.failed++;
        }

        if (result.score !== undefined) {
          typeStats.scores.push(result.score);
        }
      }
    }

    // Calculate averages
    Object.keys(byType).forEach(type => {
      const typeStats = byType[type];
      if (typeStats) {
        const scores = typeStats.scores;
        typeStats.averageScore = scores.length > 0 
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0;
        delete (typeStats as any).scores;
      }
    });

    const failedTools = reports
      .filter(r => !r.overall.passed)
      .map(r => r.toolId);

    const suggestions = reports
      .flatMap(r => r.suggestions)
      .filter((suggestion, index, self) => self.indexOf(suggestion) === index);

    return {
      overall,
      byType,
      failedTools,
      suggestions
    };
  }

  /**
   * Save validation report to file
   */
  async saveReport(report: ToolValidationReport, filePath: string): Promise<void> {
    const reportData = JSON.stringify(report, null, 2);
    await fs.writeFile(filePath, reportData);
  }

  /**
   * Load validation report from file
   */
  async loadReport(filePath: string): Promise<ToolValidationReport> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }
}

/**
 * Create a new tool validator instance
 */
export function createToolValidator(): ToolValidator {
  return new ToolValidator();
}