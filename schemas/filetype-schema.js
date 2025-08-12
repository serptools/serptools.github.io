/**
 * File Type Data Schema Definition
 * 
 * This schema defines the structure for file type data extracted from FileInfo.com
 * and stored as JSON files in our static site.
 * 
 * Version: 1.0.0
 * Last Updated: 2024-08-12
 */

const FILETYPE_SCHEMA = {
  // Core identification
  extension: {
    type: 'string',
    required: true,
    description: 'File extension without dot (e.g., "pdf", "jpg")',
    pattern: '^[a-z0-9]+$',
    maxLength: 10
  },
  
  name: {
    type: 'string', 
    required: true,
    description: 'Human-readable name (e.g., "Portable Document Format")',
    maxLength: 100
  },
  
  title: {
    type: 'string',
    required: true,
    description: 'Full page title from source',
    maxLength: 200
  },
  
  description: {
    type: 'string',
    required: true,
    description: 'Meta description from source',
    maxLength: 300
  },
  
  summary: {
    type: 'string',
    required: true,
    description: 'Brief summary of what this file type is (max 500 chars)',
    maxLength: 500
  },
  
  // Developer and popularity
  developer: {
    type: 'string',
    required: false,
    description: 'Company or person who created the format',
    maxLength: 100
  },
  
  popularity: {
    type: 'object',
    required: false,
    properties: {
      rating: {
        type: 'number',
        minimum: 0,
        maximum: 5,
        description: 'Average rating (0-5 stars)'
      },
      votes: {
        type: 'integer',
        minimum: 0,
        description: 'Total number of votes'
      }
    }
  },
  
  // Visual assets
  image: {
    type: 'object',
    required: true,
    properties: {
      icon: {
        type: 'string',
        description: 'URL to file type icon image',
        pattern: '^https?://'
      },
      screenshot: {
        type: 'string', 
        description: 'URL to screenshot of file in application',
        pattern: '^https?://'
      },
      screenshotCaption: {
        type: 'string',
        description: 'Caption describing the screenshot',
        maxLength: 200
      }
    }
  },
  
  // Content sections
  whatIs: {
    type: 'string',
    required: true,
    description: 'What is this file type explanation (max 1000 chars)',
    maxLength: 1000
  },
  
  moreInfo: {
    type: 'string',
    required: true,
    description: 'Additional technical information (max 1000 chars)',
    maxLength: 1000
  },
  
  howToOpen: {
    type: 'string',
    required: true,
    description: 'Instructions on how to open this file type (max 1000 chars)',
    maxLength: 1000
  },
  
  // Software that opens this file type
  programsThatOpen: {
    type: 'object',
    required: true,
    description: 'Programs organized by platform',
    patternProperties: {
      '^(win|mac|linux|android|ios)$': {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              required: true,
              maxLength: 100
            },
            license: {
              type: 'string',
              enum: ['Free', 'Free+', 'Subscription', 'One-time', 'Included with OS', ''],
              description: 'License/pricing model'
            },
            url: {
              type: 'string',
              description: 'Relative URL to software page'
            }
          }
        }
      }
    }
  },
  
  // Additional sections (catchall)
  additionalSections: {
    type: 'array',
    required: true,
    description: 'Any additional sections found (convert, filenames, etc.)',
    items: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          required: true,
          maxLength: 100
        },
        content: {
          type: 'string',
          required: true,
          maxLength: 1500
        }
      }
    }
  },
  
  // Tools on our site that are relevant
  relevantTools: {
    type: 'array',
    required: true,
    description: 'Tools on our site related to this file type',
    items: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['Convert From', 'Convert To', 'Text Analysis', 'Data Processing'],
          required: true
        },
        description: {
          type: 'string',
          required: true,
          maxLength: 200
        },
        tools: {
          type: 'array',
          required: true,
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                required: true,
                maxLength: 50
              },
              href: {
                type: 'string',
                required: true,
                pattern: '^/tools/',
                description: 'Relative URL to our tool'
              },
              description: {
                type: 'string',
                required: true,
                maxLength: 100
              }
            }
          }
        }
      }
    }
  },
  
  // Metadata
  lastUpdated: {
    type: 'string',
    required: true,
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    description: 'Date in YYYY-MM-DD format'
  }
};

// Index schema for the main index.json file
const INDEX_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      slug: {
        type: 'string',
        required: true,
        description: 'Same as extension field'
      },
      name: {
        type: 'string',
        required: true,
        description: 'Human-readable name'
      },
      category: {
        type: 'string',
        enum: ['images', 'video', 'audio', 'documents', 'spreadsheets', 'presentations', 'archives', 'programming', 'games', 'system', 'misc'],
        required: true
      },
      extension: {
        type: 'string',
        required: true
      },
      popularity: {
        type: 'object',
        required: false
      },
      updated_at: {
        type: 'string',
        required: true
      },
      developer_org: {
        type: 'string',
        required: false
      },
      summary: {
        type: 'string',
        required: true
      }
    }
  }
};

module.exports = {
  FILETYPE_SCHEMA,
  INDEX_SCHEMA,
  VERSION: '1.0.0'
};