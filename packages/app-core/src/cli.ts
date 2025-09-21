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

program.parse();