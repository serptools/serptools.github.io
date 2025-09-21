/**
 * Plugin Architecture System
 * 
 * Modular system for extending tools functionality with plugins
 * for different conversion types, processors, and features.
 */

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: 'converter' | 'processor' | 'validator' | 'ui-component' | 'workflow';
  supportedFormats?: string[];
  dependencies?: string[];
  permissions?: string[];
  entryPoint: string;
  config?: Record<string, any>;
}

export interface PluginContext {
  toolId: string;
  operation: string;
  formats: { from?: string; to?: string };
  metadata: Record<string, any>;
  utils: {
    logger: Logger;
    fileUtils: FileUtils;
    validationUtils: ValidationUtils;
  };
}

export interface Logger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
}

export interface FileUtils {
  readFile(path: string): Promise<Buffer>;
  writeFile(path: string, data: Buffer): Promise<void>;
  getFileInfo(file: File): { name: string; size: number; type: string };
  validateFileType(file: File, allowedTypes: string[]): boolean;
}

export interface ValidationUtils {
  validateFormat(format: string, data: Buffer): Promise<boolean>;
  sanitizeFilename(filename: string): string;
  checkFileSize(file: File, maxSize: number): boolean;
}

export interface PluginInstance {
  manifest: PluginManifest;
  initialize(context: PluginContext): Promise<void>;
  execute(input: any, options?: Record<string, any>): Promise<any>;
  cleanup?(): Promise<void>;
  getCapabilities?(): string[];
  validateInput?(input: any): boolean;
  getDefaultOptions?(): Record<string, any>;
}

export interface PluginHook {
  name: string;
  handler: (data: any, context: PluginContext) => Promise<any>;
  priority: number;
}

export class PluginManager {
  private plugins: Map<string, PluginInstance> = new Map();
  private hooks: Map<string, PluginHook[]> = new Map();
  private pluginRegistry: Map<string, PluginManifest> = new Map();
  private logger: Logger;
  private fileUtils: FileUtils;
  private validationUtils: ValidationUtils;

  constructor() {
    this.logger = this.createLogger();
    this.fileUtils = this.createFileUtils();
    this.validationUtils = this.createValidationUtils();
  }

  /**
   * Register a plugin
   */
  async registerPlugin(manifest: PluginManifest, pluginClass: new () => PluginInstance): Promise<void> {
    // Validate plugin manifest
    if (!this.validateManifest(manifest)) {
      throw new Error(`Invalid plugin manifest: ${manifest.id}`);
    }

    // Check dependencies
    await this.checkDependencies(manifest);

    // Create plugin instance
    const plugin = new pluginClass();
    plugin.manifest = manifest;

    // Store in registry
    this.pluginRegistry.set(manifest.id, manifest);
    this.plugins.set(manifest.id, plugin);

    this.logger.info(`Plugin registered: ${manifest.id} v${manifest.version}`);
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // Cleanup plugin
    if (plugin.cleanup) {
      await plugin.cleanup();
    }

    // Remove from registry
    this.plugins.delete(pluginId);
    this.pluginRegistry.delete(pluginId);

    // Remove hooks
    for (const [hookName, hooks] of this.hooks.entries()) {
      this.hooks.set(hookName, hooks.filter(hook => 
        !hook.name.startsWith(`${pluginId}:`)
      ));
    }

    this.logger.info(`Plugin unregistered: ${pluginId}`);
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins by type
   */
  getPluginsByType(type: string): PluginInstance[] {
    return Array.from(this.plugins.values()).filter(
      plugin => plugin.manifest.type === type
    );
  }

  /**
   * Get plugins supporting specific formats
   */
  getPluginsByFormat(format: string): PluginInstance[] {
    return Array.from(this.plugins.values()).filter(
      plugin => plugin.manifest.supportedFormats?.includes(format)
    );
  }

  /**
   * Execute plugin
   */
  async executePlugin(
    pluginId: string,
    input: any,
    context: PluginContext,
    options?: Record<string, any>
  ): Promise<any> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // Initialize plugin if needed
    await plugin.initialize(context);

    // Validate input
    if (plugin.validateInput && !plugin.validateInput(input)) {
      throw new Error(`Invalid input for plugin: ${pluginId}`);
    }

    // Merge options with defaults
    const finalOptions = {
      ...plugin.getDefaultOptions?.(),
      ...options
    };

    // Execute pre-hooks
    await this.executeHooks(`before:${pluginId}`, input, context);

    try {
      // Execute plugin
      const result = await plugin.execute(input, finalOptions);

      // Execute post-hooks
      await this.executeHooks(`after:${pluginId}`, result, context);

      this.logger.debug(`Plugin executed successfully: ${pluginId}`);
      return result;

    } catch (error) {
      this.logger.error(`Plugin execution failed: ${pluginId}`, error);
      throw error;
    }
  }

  /**
   * Register a hook
   */
  registerHook(hookName: string, handler: PluginHook['handler'], priority: number = 0): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const hook: PluginHook = {
      name: hookName,
      handler,
      priority
    };

    const hooks = this.hooks.get(hookName)!;
    hooks.push(hook);

    // Sort by priority (higher priority first)
    hooks.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Execute hooks
   */
  async executeHooks(hookName: string, data: any, context: PluginContext): Promise<any> {
    const hooks = this.hooks.get(hookName);
    if (!hooks || hooks.length === 0) {
      return data;
    }

    let result = data;
    for (const hook of hooks) {
      try {
        result = await hook.handler(result, context);
      } catch (error) {
        this.logger.warn(`Hook execution failed: ${hook.name}`, error);
      }
    }

    return result;
  }

  /**
   * Create plugin context
   */
  createContext(toolId: string, operation: string, formats: { from?: string; to?: string }): PluginContext {
    return {
      toolId,
      operation,
      formats,
      metadata: {},
      utils: {
        logger: this.logger,
        fileUtils: this.fileUtils,
        validationUtils: this.validationUtils
      }
    };
  }

  /**
   * Get plugin capabilities
   */
  async getPluginCapabilities(pluginId: string): Promise<string[]> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return [];
    }

    return plugin.getCapabilities?.() || [];
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest): boolean {
    const required = ['id', 'name', 'version', 'type', 'entryPoint'];
    return required.every(field => manifest[field as keyof PluginManifest]);
  }

  /**
   * Check plugin dependencies
   */
  private async checkDependencies(manifest: PluginManifest): Promise<void> {
    if (!manifest.dependencies) {
      return;
    }

    for (const dependency of manifest.dependencies) {
      if (!this.plugins.has(dependency)) {
        throw new Error(`Missing dependency: ${dependency} for plugin ${manifest.id}`);
      }
    }
  }

  /**
   * Create logger instance
   */
  private createLogger(): Logger {
    return {
      debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data || ''),
      info: (message: string, data?: any) => console.info(`[INFO] ${message}`, data || ''),
      warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data || ''),
      error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || '')
    };
  }

  /**
   * Create file utilities
   */
  private createFileUtils(): FileUtils {
    return {
      readFile: async (path: string): Promise<Buffer> => {
        // Implementation would depend on environment (Node.js vs Browser)
        throw new Error('Not implemented');
      },
      writeFile: async (path: string, data: Buffer): Promise<void> => {
        // Implementation would depend on environment (Node.js vs Browser)
        throw new Error('Not implemented');
      },
      getFileInfo: (file: File) => ({
        name: file.name,
        size: file.size,
        type: file.type
      }),
      validateFileType: (file: File, allowedTypes: string[]): boolean => {
        return allowedTypes.includes(file.type) || 
               allowedTypes.some(type => file.name.toLowerCase().endsWith(`.${type}`));
      }
    };
  }

  /**
   * Create validation utilities
   */
  private createValidationUtils(): ValidationUtils {
    return {
      validateFormat: async (format: string, data: Buffer): Promise<boolean> => {
        // Basic format validation - would be expanded with actual validators
        return data.length > 0;
      },
      sanitizeFilename: (filename: string): string => {
        return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      },
      checkFileSize: (file: File, maxSize: number): boolean => {
        return file.size <= maxSize;
      }
    };
  }
}

/**
 * Base plugin class that can be extended
 */
export abstract class BasePlugin implements PluginInstance {
  manifest!: PluginManifest;

  abstract initialize(context: PluginContext): Promise<void>;
  abstract execute(input: any, options?: Record<string, any>): Promise<any>;

  async cleanup(): Promise<void> {
    // Override in subclasses if needed
  }

  getCapabilities(): string[] {
    return this.manifest.supportedFormats || [];
  }

  validateInput(input: any): boolean {
    return input !== null && input !== undefined;
  }

  getDefaultOptions(): Record<string, any> {
    return this.manifest.config || {};
  }
}

/**
 * Example converter plugin
 */
export class ImageConverterPlugin extends BasePlugin {
  async initialize(context: PluginContext): Promise<void> {
    context.utils.logger.info(`Initializing image converter for ${context.toolId}`);
  }

  async execute(input: File, options?: Record<string, any>): Promise<Blob> {
    const { from, to } = options || {};
    
    if (!from || !to) {
      throw new Error('Missing format parameters');
    }

    // Placeholder implementation
    // In reality, this would use Canvas API, WebAssembly, or similar
    return new Blob([await input.arrayBuffer()], { type: `image/${to}` });
  }

  getCapabilities(): string[] {
    return ['jpg', 'png', 'gif', 'bmp', 'webp'];
  }
}

/**
 * Create plugin manager instance
 */
export function createPluginManager(): PluginManager {
  return new PluginManager();
}