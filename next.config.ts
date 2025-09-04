import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // basePath: '/v1/asset', // Commented out for development
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
