import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Only apply basePath in production
  ...(isProduction && { 
    basePath: '/v1/asset',
    assetPrefix: '/v1/asset'
  }),
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'digitalasset.zenapi.co.in',
        pathname: '/uploads/**',
      },
    ],
  },
  // Ensure static assets are served correctly
  async rewrites() {
    if (isProduction) {
      return [
        {
          source: '/v1/asset/_next/static/:path*',
          destination: '/_next/static/:path*',
        },
        {
          source: '/v1/asset/:path*',
          destination: '/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
