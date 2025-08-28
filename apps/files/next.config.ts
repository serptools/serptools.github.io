import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  basePath: "/files",
  transpilePackages: ["@serp-tools/ui"],
};

export default nextConfig;