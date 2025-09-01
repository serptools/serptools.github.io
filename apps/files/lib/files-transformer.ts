import type { FileTypeRawData, FileTypeTemplateData } from '@/types';
import toolsData from '@serp-tools/app-core/data/tools.json';

/**
 * Transform raw filetype data from JSON to the format expected by FileTypePageTemplate
 */
export function transformFileTypeData(raw: FileTypeRawData): FileTypeTemplateData {
  // Extract description from more_information
  const description = raw.more_information?.description?.join(' ') || raw.summary || '';

  // Extract screenshot info
  const screenshot = raw.more_information?.screenshot || raw.images?.[0];

  // Build whatIs section - Use summary first, then fall back to description
  const whatIs = raw.summary ||
    raw.more_information?.description?.join('\n\n') ||
    `A .${raw.extension} file is a ${raw.name}${raw.developer_name ? ` developed by ${raw.developer_name}` : ''}.`;

  // Build moreInfo section - Use more_information.content if available
  const moreInfo = raw.more_information?.content?.join('\n\n') ||
    raw.technical_info?.content?.join('\n\n') || '';

  // Build howToOpen section
  const howToOpen = raw.how_to_open?.instructions?.join('\n\n') ||
    `To open a .${raw.extension} file, you need compatible software that supports this file format.`;

  // Build additional sections
  const additionalSections: Array<{ title: string; content: string }> = [];

  // Add Common Filenames section if available
  if (raw.common_filenames && raw.common_filenames.length > 0) {
    additionalSections.push({
      title: 'Common Filenames',
      content: raw.common_filenames.join('\n')
    });
  }

  // Add How to Convert section if available
  if (raw.how_to_convert?.instructions) {
    additionalSections.push({
      title: 'How to Convert',
      content: raw.how_to_convert.instructions.join('\n\n')
    });
  }

  // Add technical details section if available and not already included
  if (raw.technical_info?.content && raw.technical_info.content.length > 0 &&
    !raw.more_information?.content) {
    additionalSections.push({
      title: 'Technical Details',
      content: raw.technical_info.content.join('\n\n')
    });
  }

  // Build relevant tools based on actual available converters
  const fromExtension = raw.extension.toLowerCase();
  const availableConverters = (toolsData as any[]).filter(
    tool => tool.from === fromExtension && tool.operation === 'convert' && tool.isActive
  );

  const converterTools = availableConverters.map(tool => ({
    title: `${fromExtension.toUpperCase()} to ${tool.to.toUpperCase()}`,
    href: tool.route,
    description: `Convert ${fromExtension.toUpperCase()} files to ${tool.to.toUpperCase()} format`
  }));

  // Also check for converters TO this format
  const toConverters = (toolsData as any[]).filter(
    tool => tool.to === fromExtension && tool.operation === 'convert' && tool.isActive
  );

  const toConverterTools = toConverters.slice(0, 3).map(tool => ({
    title: `${tool.from.toUpperCase()} to ${fromExtension.toUpperCase()}`,
    href: tool.route,
    description: `Convert ${tool.from.toUpperCase()} files to ${fromExtension.toUpperCase()} format`
  }));

  const relevantTools = [];

  if (converterTools.length > 0) {
    relevantTools.push({
      category: `Convert from ${fromExtension.toUpperCase()}`,
      description: `Convert .${raw.extension} files to other formats`,
      tools: converterTools.slice(0, 5) // Limit to 5 converters
    });
  }

  if (toConverterTools.length > 0) {
    relevantTools.push({
      category: `Convert to ${fromExtension.toUpperCase()}`,
      description: `Convert other formats to .${raw.extension} files`,
      tools: toConverterTools
    });
  }

  return {
    extension: raw.extension,
    name: raw.name,
    title: `${raw.extension.toUpperCase()} File - ${raw.name}`,
    description: description,
    summary: raw.summary || '',
    category: raw.category,
    categorySlug: raw.category_slug,
    developer: raw.developer_name || raw.developer_org || raw.developer,
    popularity: raw.popularity || (raw.rating && raw.votes ? { rating: raw.rating, votes: raw.votes } : undefined),
    image: {
      icon: undefined, // Could be generated or fetched
      screenshot: screenshot?.url,
      screenshotCaption: screenshot?.caption
    },
    whatIs: whatIs,
    moreInfo: moreInfo,
    howToOpen: howToOpen,
    programsThatOpen: raw.programs || {},
    additionalSections: additionalSections,
    relevantTools: relevantTools,
    lastUpdated: raw.last_updated || raw.updated_at || new Date().toISOString()
  };
}