import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only apply basePath in production
  ...(process.env.NODE_ENV === 'production' && { 
    basePath: '/v1/asset',
    assetPrefix: '/v1/asset'
  }),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'digitalasset.zenapi.co.in',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
