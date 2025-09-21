/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Removed to enable API routes
  transpilePackages: ["@serp-tools/ui"],
  trailingSlash: true,
};

export default nextConfig;
