import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    // Turbopack configuration
    rules: {
      '*.svg': ['@svgr/webpack'],
    },
  },
};

export default nextConfig;
