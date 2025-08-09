/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://serptools.github.io',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  outDir: 'out',
  changefreq: 'weekly',
  priority: 0.7,
  exclude: ['/dev/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dev'],
      },
    ],
  },
  transform: async (config, path) => {
    // Set higher priority for main pages
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      };
    }
    
    // Set medium-high priority for tool pages
    if (path.startsWith('/tools/')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      };
    }
    
    // Default transformation
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};