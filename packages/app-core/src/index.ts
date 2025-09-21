/**
 * SerpTools Core Library
 * 
 * Main export file for the core functionality
 */

// Tool Management
export { 
  ToolGenerator, 
  createToolGenerator,
  type Tool,
  type ToolGeneratorConfig 
} from './lib/tool-generator';

export { 
  ToolRegistryManager, 
  createRegistryManager,
  type ToolRegistry,
  type ToolDependency,
  type ToolMetrics 
} from './lib/tool-registry';

// Plugin System
export {
  PluginManager,
  BasePlugin,
  ImageConverterPlugin,
  createPluginManager,
  type PluginManifest,
  type PluginInstance,
  type PluginContext,
  type PluginHook
} from './lib/plugin-system';

// Tool Processing
export {
  ToolProcessor,
  PerformanceMonitor,
  createToolProcessor,
  createPerformanceMonitor,
  type ProcessingOptions,
  type ProcessingResult,
  type BatchProcessingOptions,
  type BatchProcessingResult,
  type ToolCapabilities
} from './lib/tool-processor';

// Validation
export {
  ToolValidator,
  createToolValidator,
  type ValidationTest,
  type ValidationResult,
  type ToolValidationReport
} from './lib/tool-validator';

// Analytics
export {
  AnalyticsManager,
  InMemoryAnalyticsStorage,
  createAnalyticsManager,
  type AnalyticsEvent,
  type ToolUsageEvent,
  type PerformanceMetrics,
  type UsageStatistics,
  type AlertRule,
  type AnalyticsStorage
} from './lib/analytics';

// Documentation
export {
  DocumentationGenerator,
  createDocumentationGenerator,
  type DocumentationSection,
  type APIDocumentation
} from './lib/documentation';

// Data
export { default as toolsData } from './data/tools.json';
export { default as extensionsData } from './data/extensions.json';