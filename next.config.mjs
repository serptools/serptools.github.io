/** @type {import('next').NextConfig} */

// Determine build mode from environment
const isStatic = process.env.BUILD_MODE === 'static' || process.env.NODE_ENV === 'production';

const nextConfig = {
  // Conditional output based on environment
  ...(isStatic && { 
    output: 'export',
    trailingSlash: true,
  }),
  basePath: '',
  images: {
    unoptimized: true,
  },
  // Only add headers for server builds
  ...(!isStatic && {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Cross-Origin-Embedder-Policy',
              value: 'require-corp',
            },
            {
              key: 'Cross-Origin-Opener-Policy',
              value: 'same-origin',
            },
          ],
        },
      ];
    },
  }),
  // Environment variables to pass to client
  env: {
    BUILD_MODE: isStatic ? 'static' : 'server',
    SUPPORTS_VIDEO_CONVERSION: isStatic ? 'false' : 'true',
  },
}

export default nextConfig