import type { FileTypeRawData, FileTypeTemplateData } from '@/types/filetypes';

/**
 * Transform raw filetype data from JSON to the format expected by FileTypePageTemplate
 */
export function transformFileTypeData(raw: FileTypeRawData): FileTypeTemplateData {
  // Extract description from more_information
  const description = raw.more_information?.description?.join(' ') || raw.summary || '';
  
  // Extract screenshot info
  const screenshot = raw.more_information?.screenshot || raw.images?.[0];
  
  // Build whatIs section
  const whatIs = raw.more_information?.description?.join('\n\n') || 
    `A .${raw.extension} file is a ${raw.name}${raw.developer_name ? ` developed by ${raw.developer_name}` : ''}.`;
  
  // Build moreInfo section from technical_info
  const moreInfo = raw.technical_info?.content?.join('\n\n') || '';
  
  // Build howToOpen section
  const howToOpen = raw.how_to_open?.instructions?.join('\n\n') || 
    `To open a .${raw.extension} file, you need compatible software that supports this file format.`;
  
  // Build additional sections (empty for now, can be expanded)
  const additionalSections: Array<{ title: string; content: string }> = [];
  
  // Add technical details section if available
  if (raw.technical_info?.content && raw.technical_info.content.length > 0) {
    additionalSections.push({
      title: 'Technical Details',
      content: raw.technical_info.content.join('\n\n')
    });
  }
  
  // Build relevant tools (can be expanded with actual tool recommendations)
  const relevantTools = [
    {
      category: 'File Converters',
      description: `Convert .${raw.extension} files to other formats`,
      tools: [
        {
          title: `${raw.extension.toUpperCase()} to PDF`,
          href: `/tools/${raw.extension}-to-pdf`,
          description: `Convert ${raw.extension.toUpperCase()} files to PDF format`
        },
        {
          title: `${raw.extension.toUpperCase()} to JPG`,
          href: `/tools/${raw.extension}-to-jpg`,
          description: `Convert ${raw.extension.toUpperCase()} files to JPG format`
        }
      ]
    }
  ];
  
  return {
    extension: raw.extension,
    name: raw.name,
    title: `${raw.extension.toUpperCase()} File - ${raw.name}`,
    description: description,
    summary: raw.summary || '',
    category: raw.category,
    categorySlug: raw.category_slug,
    developer: raw.developer_name || raw.developer_org || raw.developer,
    popularity: raw.popularity,
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
    lastUpdated: raw.updated_at || new Date().toISOString()
  };
}