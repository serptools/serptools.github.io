import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: 'export',
  basePath: "/files",
  transpilePackages: ["@serp-tools/ui"],
  trailingSlash: true,
};

export default nextConfig;