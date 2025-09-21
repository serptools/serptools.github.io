/**
 * Shared Business Logic Layer
 * 
 * Common core functionality that can be shared between web and desktop versions,
 * ensuring consistency and reducing duplication.
 */

import { PluginManager, PluginContext } from './plugin-system';
import { Tool } from './tool-generator';

export interface ProcessingOptions {
  quality?: number;
  compression?: number;
  maxSize?: number;
  preserveMetadata?: boolean;
  outputFormat?: string;
  customSettings?: Record<string, any>;
}

export interface ProcessingResult {
  success: boolean;
  data?: Blob | Buffer | string;
  metadata?: Record<string, any>;
  warnings?: string[];
  errors?: string[];
  processingTime: number;
  outputSize?: number;
}

export interface BatchProcessingOptions extends ProcessingOptions {
  parallel?: boolean;
  maxConcurrency?: number;
  stopOnError?: boolean;
  progressCallback?: (progress: number, current: number, total: number) => void;
}

export interface BatchProcessingResult {
  success: boolean;
  results: Array<{ index: number; result: ProcessingResult; filename?: string }>;
  totalProcessingTime: number;
  successCount: number;
  errorCount: number;
  overallProgress: number;
}

export interface ToolCapabilities {
  supportedInputFormats: string[];
  supportedOutputFormats: string[];
  maxFileSize: number;
  supportsBatch: boolean;
  supportsQuality: boolean;
  supportsCompression: boolean;
  requiresFFmpeg: boolean;
  platform: 'browser' | 'desktop' | 'both';
}

export class ToolProcessor {
  private pluginManager: PluginManager;
  private capabilities: Map<string, ToolCapabilities> = new Map();

  constructor(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
    this.initializeCapabilities();
  }

  /**
   * Process a single file
   */
  async processFile(
    toolId: string,
    file: File | Buffer,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Get tool capabilities
      const capabilities = this.capabilities.get(toolId);
      if (!capabilities) {
        throw new Error(`Tool ${toolId} not found or not supported`);
      }

      // Validate input
      await this.validateInput(file, capabilities, options);

      // Get appropriate plugin
      const plugin = this.getToolPlugin(toolId, capabilities);
      if (!plugin) {
        throw new Error(`No plugin available for tool ${toolId}`);
      }

      // Create processing context
      const context = this.createProcessingContext(toolId, capabilities);

      // Execute processing
      const result = await this.pluginManager.executePlugin(
        plugin.manifest.id,
        file,
        context,
        options
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          originalSize: this.getFileSize(file),
          outputSize: this.getDataSize(result),
          format: options.outputFormat
        },
        processingTime,
        outputSize: this.getDataSize(result)
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processingTime
      };
    }
  }

  /**
   * Process multiple files in batch
   */
  async processBatch(
    toolId: string,
    files: Array<File | Buffer>,
    options: BatchProcessingOptions = {}
  ): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    const results: Array<{ index: number; result: ProcessingResult; filename?: string }> = [];
    
    const {
      parallel = true,
      maxConcurrency = 4,
      stopOnError = false,
      progressCallback
    } = options;

    let successCount = 0;
    let errorCount = 0;

    const processFile = async (file: File | Buffer, index: number) => {
      const filename = file instanceof File ? file.name : `file_${index}`;
      const result = await this.processFile(toolId, file, options);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }

      const processedItem = { index, result, filename };
      results.push(processedItem);

      // Update progress
      if (progressCallback) {
        const progress = ((successCount + errorCount) / files.length) * 100;
        progressCallback(progress, successCount + errorCount, files.length);
      }

      return processedItem;
    };

    try {
      if (parallel) {
        // Process files in parallel with concurrency limit
        const chunks = this.chunkArray(files, maxConcurrency);
        
        for (const chunk of chunks) {
          const promises = chunk.map((file, chunkIndex) => {
            const globalIndex = chunks.flat().indexOf(file);
            return processFile(file, globalIndex);
          });

          const chunkResults = await Promise.all(promises);
          
          // Check if we should stop on error
          if (stopOnError && chunkResults.some(r => !r.result.success)) {
            break;
          }
        }
      } else {
        // Process files sequentially
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file) {
            const result = await processFile(file, i);
            
            if (stopOnError && !result.result.success) {
              break;
            }
          }
        }
      }

      const totalProcessingTime = Date.now() - startTime;
      const overallProgress = ((successCount + errorCount) / files.length) * 100;

      return {
        success: errorCount === 0,
        results: results.sort((a, b) => a.index - b.index),
        totalProcessingTime,
        successCount,
        errorCount,
        overallProgress
      };

    } catch (error) {
      return {
        success: false,
        results,
        totalProcessingTime: Date.now() - startTime,
        successCount,
        errorCount,
        overallProgress: ((successCount + errorCount) / files.length) * 100
      };
    }
  }

  /**
   * Get tool capabilities
   */
  getToolCapabilities(toolId: string): ToolCapabilities | undefined {
    return this.capabilities.get(toolId);
  }

  /**
   * Check if tool supports specific operation
   */
  supportsOperation(toolId: string, inputFormat: string, outputFormat: string): boolean {
    const capabilities = this.capabilities.get(toolId);
    if (!capabilities) return false;

    return capabilities.supportedInputFormats.includes(inputFormat) &&
           capabilities.supportedOutputFormats.includes(outputFormat);
  }

  /**
   * Get recommended settings for a tool
   */
  getRecommendedSettings(toolId: string, inputFormat: string, outputFormat: string): ProcessingOptions {
    const capabilities = this.capabilities.get(toolId);
    if (!capabilities) return {};

    const settings: ProcessingOptions = {};

    // Set quality based on format
    if (capabilities.supportsQuality) {
      if (['jpg', 'jpeg', 'webp'].includes(outputFormat)) {
        settings.quality = 85;
      }
    }

    // Set compression based on format
    if (capabilities.supportsCompression) {
      if (['png', 'gif'].includes(outputFormat)) {
        settings.compression = 6;
      }
    }

    // Set max size based on capabilities
    settings.maxSize = capabilities.maxFileSize;

    return settings;
  }

  /**
   * Estimate processing time
   */
  estimateProcessingTime(toolId: string, fileSize: number, options: ProcessingOptions = {}): number {
    const capabilities = this.capabilities.get(toolId);
    if (!capabilities) return 0;

    // Base time in milliseconds per MB
    let baseTime = 1000; // 1 second per MB

    // Adjust based on complexity
    if (capabilities.requiresFFmpeg) {
      baseTime *= 3; // FFmpeg operations are more complex
    }

    if (options.quality && options.quality > 90) {
      baseTime *= 1.5; // High quality takes longer
    }

    const fileSizeMB = fileSize / (1024 * 1024);
    return Math.max(500, baseTime * fileSizeMB); // Minimum 500ms
  }

  /**
   * Validate input file/buffer
   */
  private async validateInput(
    file: File | Buffer,
    capabilities: ToolCapabilities,
    options: ProcessingOptions
  ): Promise<void> {
    const fileSize = this.getFileSize(file);
    
    // Check file size
    if (fileSize > capabilities.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${capabilities.maxFileSize} bytes`);
    }

    // Validate input format
    if (file instanceof File) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && !capabilities.supportedInputFormats.includes(extension)) {
        throw new Error(`Unsupported input format: ${extension}`);
      }
    }

    // Validate output format
    if (options.outputFormat && !capabilities.supportedOutputFormats.includes(options.outputFormat)) {
      throw new Error(`Unsupported output format: ${options.outputFormat}`);
    }
  }

  /**
   * Get appropriate plugin for tool
   */
  private getToolPlugin(toolId: string, capabilities: ToolCapabilities) {
    // Find plugin that supports the required formats
    const availablePlugins = this.pluginManager.getAllPlugins();
    
    return availablePlugins.find(plugin => {
      const supportedFormats = plugin.manifest.supportedFormats || [];
      return capabilities.supportedInputFormats.some(format => 
        supportedFormats.includes(format)
      );
    });
  }

  /**
   * Create processing context
   */
  private createProcessingContext(toolId: string, capabilities: ToolCapabilities): PluginContext {
    return this.pluginManager.createContext(
      toolId,
      'convert', // Default operation
      {
        from: capabilities.supportedInputFormats[0],
        to: capabilities.supportedOutputFormats[0]
      }
    );
  }

  /**
   * Get file size
   */
  private getFileSize(file: File | Buffer): number {
    return file instanceof File ? file.size : file.length;
  }

  /**
   * Get data size
   */
  private getDataSize(data: any): number {
    if (data instanceof Blob) return data.size;
    if (data instanceof Buffer) return data.length;
    if (typeof data === 'string') return new Blob([data]).size;
    return 0;
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Initialize tool capabilities
   */
  private initializeCapabilities(): void {
    // This would normally load from configuration or be dynamically determined
    // For now, we'll set up some example capabilities
    
    const imageCapabilities: ToolCapabilities = {
      supportedInputFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic', 'heif'],
      supportedOutputFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
      maxFileSize: 50 * 1024 * 1024, // 50MB
      supportsBatch: true,
      supportsQuality: true,
      supportsCompression: true,
      requiresFFmpeg: false,
      platform: 'both'
    };

    const videoCapabilities: ToolCapabilities = {
      supportedInputFormats: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv'],
      supportedOutputFormats: ['mp4', 'webm', 'gif'],
      maxFileSize: 500 * 1024 * 1024, // 500MB
      supportsBatch: true,
      supportsQuality: true,
      supportsCompression: true,
      requiresFFmpeg: true,
      platform: 'desktop'
    };

    const audioCapabilities: ToolCapabilities = {
      supportedInputFormats: ['mp3', 'wav', 'aac', 'flac', 'ogg'],
      supportedOutputFormats: ['mp3', 'wav', 'aac', 'ogg'],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      supportsBatch: true,
      supportsQuality: true,
      supportsCompression: true,
      requiresFFmpeg: true,
      platform: 'desktop'
    };

    // Register capabilities for different tool types
    this.registerToolCapabilities('image-converter', imageCapabilities);
    this.registerToolCapabilities('video-converter', videoCapabilities);
    this.registerToolCapabilities('audio-converter', audioCapabilities);
  }

  /**
   * Register capabilities for a tool
   */
  private registerToolCapabilities(toolId: string, capabilities: ToolCapabilities): void {
    this.capabilities.set(toolId, capabilities);
  }
}

/**
 * Performance Monitor for tracking tool usage
 */
export class PerformanceMonitor {
  private metrics: Map<string, Array<{ timestamp: Date; duration: number; fileSize: number }>> = new Map();

  /**
   * Record performance metric
   */
  record(toolId: string, duration: number, fileSize: number): void {
    if (!this.metrics.has(toolId)) {
      this.metrics.set(toolId, []);
    }

    const toolMetrics = this.metrics.get(toolId)!;
    toolMetrics.push({
      timestamp: new Date(),
      duration,
      fileSize
    });

    // Keep only last 1000 entries per tool
    if (toolMetrics.length > 1000) {
      toolMetrics.splice(0, toolMetrics.length - 1000);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(toolId: string): {
    averageDuration: number;
    averageFileSize: number;
    throughput: number;
    usageCount: number;
  } | null {
    const metrics = this.metrics.get(toolId);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    const totalFileSize = metrics.reduce((sum, m) => sum + m.fileSize, 0);

    return {
      averageDuration: totalDuration / metrics.length,
      averageFileSize: totalFileSize / metrics.length,
      throughput: totalFileSize / (totalDuration / 1000), // bytes per second
      usageCount: metrics.length
    };
  }

  /**
   * Get all tools performance summary
   */
  getAllStats(): Record<string, ReturnType<PerformanceMonitor['getStats']>> {
    const allStats: Record<string, ReturnType<PerformanceMonitor['getStats']>> = {};
    
    for (const toolId of this.metrics.keys()) {
      allStats[toolId] = this.getStats(toolId);
    }

    return allStats;
  }
}

/**
 * Create tool processor instance
 */
export function createToolProcessor(pluginManager: PluginManager): ToolProcessor {
  return new ToolProcessor(pluginManager);
}

/**
 * Create performance monitor instance
 */
export function createPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor();
}