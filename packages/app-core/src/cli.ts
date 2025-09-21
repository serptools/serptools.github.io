#!/usr/bin/env node

/**
 * SerpTools CLI - Tool Management System
 * 
 * Command-line interface for managing tools, generating pages,
 * and maintaining the tools ecosystem.
 */

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ToolGenerator, createToolGenerator, Tool } from './lib/tool-generator.js';
import { ToolRegistryManager, createRegistryManager } from './lib/tool-registry.js';
import { BatchToolImporter, createBatchToolImporter } from './lib/batch-importer.js';
import { createLibraryManager, getConversionRecommendations, generateLibraryMatrix } from './lib/library-integration.js';
import path from 'path';

const DEFAULT_TOOLS_DIR = './apps/tools/app';
const DEFAULT_REGISTRY_PATH = '/tmp/tool-registry.json';

program
  .name('serptools')
  .description('SerpTools CLI for managing conversion tools')
  .version('1.0.0');

// Generate command
program
  .command('generate')
  .description('Generate tool pages from registry')
  .option('-d, --dir <directory>', 'Output directory for tool pages', DEFAULT_TOOLS_DIR)
  .option('-s, --skip-existing', 'Skip existing tools')
  .option('-t, --tool <toolId>', 'Generate specific tool only')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔧 Generating tool pages...'));
      
      const generator = createToolGenerator({
        outputDir: options.dir,
        templateDir: './templates',
        skipExisting: options.skipExisting
      });

      if (options.tool) {
        // Generate specific tool
        const registryManager = createRegistryManager(DEFAULT_REGISTRY_PATH);
        const tool = await registryManager.getTool(options.tool);
        
        if (!tool) {
          console.error(chalk.red(`❌ Tool ${options.tool} not found`));
          process.exit(1);
        }

        await generator.generateTool(tool);
        console.log(chalk.green(`✅ Generated tool: ${options.tool}`));
      } else {
        // Generate all tools
        await generator.generateAllTools();
        console.log(chalk.green('✅ All tools generated successfully'));
      }

      // Show statistics
      const stats = generator.getToolStats();
      console.log(chalk.cyan(`📊 Statistics:`));
      console.log(`  Total tools: ${stats.total}`);
      console.log(`  Active tools: ${stats.active}`);
      console.log(`  Operations: ${Object.keys(stats.byOperation).length}`);
      console.log(`  Formats: ${Object.keys(stats.byFormat).length}`);

    } catch (error) {
      console.error(chalk.red('❌ Generation failed:'), error);
      process.exit(1);
    }
  });

// Create tool command
program
  .command('create')
  .description('Create a new tool interactively')
  .action(async () => {
    try {
      console.log(chalk.blue('🛠️  Creating new tool...'));

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Tool name (e.g., "PNG to JPG"):',
          validate: (input) => input.trim() !== '' || 'Tool name is required'
        },
        {
          type: 'input',
          name: 'description',
          message: 'Tool description:',
          validate: (input) => input.trim() !== '' || 'Description is required'
        },
        {
          type: 'list',
          name: 'operation',
          message: 'Tool operation:',
          choices: ['convert', 'compress', 'combine', 'extract', 'validate', 'optimize']
        },
        {
          type: 'input',
          name: 'from',
          message: 'Input format (e.g., "png"):',
          when: (answers) => answers.operation === 'convert'
        },
        {
          type: 'input',
          name: 'to',
          message: 'Output format (e.g., "jpg"):',
          when: (answers) => answers.operation === 'convert'
        },
        {
          type: 'input',
          name: 'tags',
          message: 'Tags (comma-separated):',
          filter: (input: string) => input.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        },
        {
          type: 'confirm',
          name: 'requiresFFmpeg',
          message: 'Does this tool require FFmpeg?',
          default: false
        },
        {
          type: 'confirm',
          name: 'isBeta',
          message: 'Is this tool in beta?',
          default: false
        }
      ]);

      // Generate tool ID and route
      const toolId = `${answers.from || answers.operation}-to-${answers.to || 'processed'}`.toLowerCase();
      const route = `/${toolId}`;

      const tool: Tool = {
        id: toolId,
        name: answers.name,
        description: answers.description,
        operation: answers.operation,
        route: route,
        from: answers.from,
        to: answers.to,
        isActive: true,
        tags: answers.tags,
        isBeta: answers.isBeta,
        requiresFFmpeg: answers.requiresFFmpeg
      };

      // Register tool
      const registryManager = createRegistryManager(DEFAULT_REGISTRY_PATH);
      await registryManager.registerTool(tool);

      // Generate tool page
      const generator = createToolGenerator({
        outputDir: DEFAULT_TOOLS_DIR,
        templateDir: './templates',
        skipExisting: false
      });
      await generator.generateTool(tool);

      console.log(chalk.green(`✅ Tool created successfully!`));
      console.log(chalk.cyan(`   ID: ${tool.id}`));
      console.log(chalk.cyan(`   Route: ${tool.route}`));

    } catch (error) {
      console.error(chalk.red('❌ Tool creation failed:'), error);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate tools configuration and registry')
  .action(async () => {
    try {
      console.log(chalk.blue('🔍 Validating tools...'));

      // Validate generator
      const generator = createToolGenerator({
        outputDir: DEFAULT_TOOLS_DIR,
        templateDir: './templates'
      });

      const validation = generator.validateTools();
      
      if (!validation.valid) {
        console.log(chalk.red('❌ Validation failed:'));
        validation.errors.forEach((error: string) => {
          console.log(chalk.red(`  • ${error}`));
        });
        process.exit(1);
      }

      // Validate registry
      const registryManager = createRegistryManager(DEFAULT_REGISTRY_PATH);
      const registryValidation = await registryManager.validateRegistry();
      
      if (!registryValidation.valid) {
        console.log(chalk.red('❌ Registry validation failed:'));
        registryValidation.errors.forEach((error: string) => {
          console.log(chalk.red(`  • ${error}`));
        });
        process.exit(1);
      }

      console.log(chalk.green('✅ All validations passed'));

    } catch (error) {
      console.error(chalk.red('❌ Validation failed:'), error);
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show tools statistics')
  .action(async () => {
    try {
      console.log(chalk.blue('📊 Tools Statistics'));

      const generator = createToolGenerator({
        outputDir: DEFAULT_TOOLS_DIR,
        templateDir: './templates'
      });

      const stats = generator.getToolStats();
      const registryManager = createRegistryManager(DEFAULT_REGISTRY_PATH);
      const registryStats = await registryManager.getRegistryStats();

      console.log(chalk.cyan('\n📈 Overview:'));
      console.log(`  Total tools: ${stats.total}`);
      console.log(`  Active tools: ${stats.active}`);
      console.log(`  Categories: ${Object.keys(registryStats.categoryCounts).length}`);

      console.log(chalk.cyan('\n🔧 Operations:'));
      Object.entries(stats.byOperation).forEach(([op, count]) => {
        console.log(`  ${op}: ${count}`);
      });

      console.log(chalk.cyan('\n📁 Top Formats:'));
      Object.entries(stats.byFormat)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .forEach(([format, count]) => {
          console.log(`  ${format}: ${count}`);
        });

      console.log(chalk.cyan('\n🏆 Top Used Tools:'));
      registryStats.topUsedTools.slice(0, 5).forEach(({ toolId, usage }) => {
        console.log(`  ${toolId}: ${usage} uses`);
      });

    } catch (error) {
      console.error(chalk.red('❌ Failed to get statistics:'), error);
      process.exit(1);
    }
  });

// Search command
program
  .command('search <query>')
  .description('Search for tools')
  .action(async (query) => {
    try {
      console.log(chalk.blue(`🔍 Searching for: "${query}"`));

      const registryManager = createRegistryManager(DEFAULT_REGISTRY_PATH);
      const results = await registryManager.searchTools(query);

      if (results.length === 0) {
        console.log(chalk.yellow('No tools found'));
        return;
      }

      console.log(chalk.cyan(`\n📋 Found ${results.length} tools:`));
      results.forEach(tool => {
        const status = tool.isActive ? chalk.green('✓') : chalk.red('✗');
        const beta = tool.isBeta ? chalk.yellow(' [BETA]') : '';
        console.log(`  ${status} ${tool.name}${beta}`);
        console.log(`    ${chalk.gray(tool.description)}`);
        console.log(`    ${chalk.gray('Route:')} ${tool.route}`);
        if (tool.from && tool.to) {
          console.log(`    ${chalk.gray('Format:')} ${tool.from} → ${tool.to}`);
        }
        console.log('');
      });

    } catch (error) {
      console.error(chalk.red('❌ Search failed:'), error);
      process.exit(1);
    }
  });

// Sync command
program
  .command('sync')
  .description('Sync tools.json with registry')
  .action(async () => {
    try {
      console.log(chalk.blue('🔄 Syncing tools with registry...'));

      const registryManager = createRegistryManager(DEFAULT_REGISTRY_PATH);
      
      // Load tools from tools.json  
      const fs = await import('fs/promises');
      const path = await import('path');
      const toolsPath = path.join(process.cwd(), 'src/data/tools.json');
      const toolsContent = await fs.readFile(toolsPath, 'utf-8');
      const tools = JSON.parse(toolsContent) as Tool[];

      let synced = 0;
      for (const tool of tools) {
        const existing = await registryManager.getTool(tool.id);
        if (!existing) {
          await registryManager.registerTool(tool);
          synced++;
        }
      }

      console.log(chalk.green(`✅ Synced ${synced} new tools to registry`));

    } catch (error) {
      console.error(chalk.red('❌ Sync failed:'), error);
      process.exit(1);
    }
  });

// Batch import command
program
  .command('import')
  .description('Batch import tools from a file or input')
  .option('-f, --file <file>', 'Import from file')
  .option('-i, --input <input>', 'Import from direct input string')
  .option('--dry-run', 'Analyze without creating tools')
  .option('--skip-existing', 'Skip tools that already exist')
  .option('--generate-content', 'Generate basic content for new tools')
  .option('--report <file>', 'Save report to file')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📥 Batch Tool Import'));

      if (!options.file && !options.input) {
        console.error(chalk.red('❌ Please provide either --file or --input'));
        process.exit(1);
      }

      const registryManager = createRegistryManager(DEFAULT_REGISTRY_PATH);
      const importer = createBatchToolImporter(registryManager);

      let input: string;
      if (options.file) {
        console.log(chalk.gray(`Reading from file: ${options.file}`));
        const fs = await import('fs/promises');
        input = await fs.readFile(options.file, 'utf-8');
      } else {
        input = options.input;
      }

      // Parse input
      console.log(chalk.gray('Parsing import requests...'));
      const requests = importer.parseImportList(input);
      console.log(chalk.cyan(`Found ${requests.length} conversion requests`));

      // Analyze requests
      console.log(chalk.gray('Analyzing against existing tools...'));
      const analysis = await importer.analyzeImportRequests(requests);

      console.log(chalk.cyan(`\n📊 Analysis Results:`));
      console.log(`  Total requests: ${analysis.total}`);
      console.log(`  Existing tools: ${analysis.existing.length}`);
      console.log(`  New tools: ${analysis.new.length}`);
      console.log(`  Conflicts: ${analysis.conflicts.length}`);

      // Show existing tools
      if (analysis.existing.length > 0) {
        console.log(chalk.yellow(`\n⚠️  Existing Tools (${analysis.existing.length}):`));
        analysis.existing.slice(0, 5).forEach(({ request, existingTool, match }) => {
          console.log(`  ${match === 'exact' ? '🎯' : '🔍'} ${request.from} → ${request.to} (${match} match: ${existingTool.name})`);
        });
        if (analysis.existing.length > 5) {
          console.log(`  ... and ${analysis.existing.length - 5} more`);
        }
      }

      // Show conflicts
      if (analysis.conflicts.length > 0) {
        console.log(chalk.red(`\n❌ Conflicts (${analysis.conflicts.length}):`));
        analysis.conflicts.forEach(({ request, issue }) => {
          console.log(`  ${request.from} → ${request.to}: ${issue}`);
        });
      }

      // Execute import if not dry run
      let execution;
      if (!options.dryRun && analysis.new.length > 0) {
        console.log(chalk.blue(`\n🚀 Creating ${analysis.new.length} new tools...`));
        
        execution = await importer.executeImport(analysis.new, {
          skipExisting: options.skipExisting,
          generateContent: options.generateContent,
          dryRun: false
        });

        console.log(chalk.green(`✅ Import completed:`));
        console.log(`  Created: ${execution.created.length}`);
        console.log(`  Skipped: ${execution.skipped.length}`);
        console.log(`  Errors: ${execution.errors.length}`);

        if (execution.errors.length > 0) {
          console.log(chalk.red(`\n❌ Errors:`));
          execution.errors.forEach(({ tool, error }) => {
            console.log(`  ${tool.from} → ${tool.to}: ${error}`);
          });
        }
      } else if (options.dryRun) {
        console.log(chalk.yellow('\n🔍 Dry run completed - no tools were created'));
      }

      // Generate and save report
      const report = importer.generateImportReport(analysis, execution);
      
      if (options.report) {
        const fs = await import('fs/promises');
        await fs.writeFile(options.report, report);
        console.log(chalk.green(`\n📝 Report saved to: ${options.report}`));
      } else {
        console.log('\n' + report);
      }

    } catch (error) {
      console.error(chalk.red('❌ Import failed:'), error);
      process.exit(1);
    }
  });

// Libraries command
program
  .command('libraries')
  .description('Show available conversion libraries and their capabilities')
  .option('--check-availability', 'Check which libraries are currently available')
  .option('--matrix', 'Show conversion compatibility matrix')
  .option('--recommend <conversion>', 'Get library recommendations for a conversion (format: "jpg:png")')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📚 Conversion Libraries'));

      const manager = createLibraryManager();
      const libraries = manager.getAllLibraries();

      if (options.recommend) {
        const [from, to] = options.recommend.split(':');
        if (!from || !to) {
          console.error(chalk.red('❌ Conversion format should be "from:to" (e.g., "jpg:png")'));
          process.exit(1);
        }

        console.log(chalk.cyan(`\n🎯 Recommendations for ${from} → ${to}:`));
        const recommendations = await getConversionRecommendations(from, to);
        
        if (recommendations.recommended) {
          console.log(chalk.green(`\n✅ Recommended: ${recommendations.recommended.name}`));
          console.log(`   ${recommendations.recommended.description}`);
          console.log(`   Platform: ${recommendations.recommended.capabilities.platform}`);
          console.log(`   License: ${recommendations.recommended.capabilities.license}`);
        }

        if (recommendations.alternatives.length > 0) {
          console.log(chalk.yellow(`\n🔄 Alternatives:`));
          recommendations.alternatives.forEach(lib => {
            console.log(`   • ${lib.name} (${lib.capabilities.platform})`);
          });
        }

        if (recommendations.unsupported) {
          console.log(chalk.red('\n❌ This conversion is not supported by any available library'));
        }

        return;
      }

      if (options.matrix) {
        console.log(chalk.cyan('\n📊 Conversion Compatibility Matrix:'));
        const { matrix } = generateLibraryMatrix();
        
        // Show a sample of the matrix (top formats)
        const topFormats = ['jpg', 'png', 'gif', 'webp', 'mp4', 'pdf'];
        console.log('\nFormat compatibility (sample):');
        console.log('FROM \\ TO   ' + topFormats.map(f => f.padEnd(8)).join(''));
        console.log('─'.repeat(80));
        
        topFormats.forEach(from => {
          const row = from.padEnd(10) + topFormats.map(to => {
            const libs = matrix[from]?.[to];
            return libs ? `${libs.length}libs`.padEnd(8) : '─'.padEnd(8);
          }).join('');
          console.log(row);
        });
        console.log('\nNote: Numbers indicate available libraries for each conversion');
        return;
      }

      console.log(chalk.cyan(`\n📋 Available Libraries (${libraries.length}):`));

      for (const library of libraries) {
        console.log(`\n${chalk.bold(library.name)} (${library.id})`);
        console.log(`   ${library.description}`);
        console.log(`   Platform: ${library.capabilities.platform}`);
        console.log(`   License: ${library.capabilities.license}`);
        console.log(`   Input formats: ${library.capabilities.supportedFormats.input.slice(0, 10).join(', ')}${library.capabilities.supportedFormats.input.length > 10 ? '...' : ''}`);
        console.log(`   Output formats: ${library.capabilities.supportedFormats.output.slice(0, 10).join(', ')}${library.capabilities.supportedFormats.output.length > 10 ? '...' : ''}`);
        console.log(`   Operations: ${library.capabilities.operations.join(', ')}`);
        
        if (library.capabilities.homepage) {
          console.log(`   Homepage: ${library.capabilities.homepage}`);
        }
      }

      if (options.checkAvailability) {
        console.log(chalk.cyan('\n🔍 Checking library availability...'));
        const availability = await manager.checkLibraryAvailability();
        
        console.log('\nAvailability Status:');
        for (const [id, available] of availability) {
          const library = manager.getLibrary(id);
          const status = available ? chalk.green('✅ Available') : chalk.red('❌ Unavailable');
          console.log(`  ${library?.name}: ${status}`);
        }
      }

    } catch (error) {
      console.error(chalk.red('❌ Libraries command failed:'), error);
      process.exit(1);
    }
  });

program.parse();