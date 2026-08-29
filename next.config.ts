import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  outputFileTracingIncludes: {
    '/api/generate': ['./node_modules/@sparticuz/chromium/bin/**/*'],
  }
};

export default nextConfig;
