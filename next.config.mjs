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
  // Apply CORS headers only to video conversion routes (they don't have YouTube embeds anyway)
  async headers() {
    if (isStatic) {
      return []
    }
    return [
      {
        // Apply CORS headers to MKV conversion routes
        source: '/tools/mkv-to-:path*',
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
      {
        // Apply CORS headers to MP4 conversion routes
        source: '/tools/mp4-to-:path*',
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
    ]
  },
  // Environment variables to pass to client
  env: {
    BUILD_MODE: isStatic ? 'static' : 'server',
    SUPPORTS_VIDEO_CONVERSION: isStatic ? 'false' : 'true',
  },
}

export default nextConfig