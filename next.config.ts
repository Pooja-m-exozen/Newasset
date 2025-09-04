import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/v1/asset',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '192.168.0.5',
        port: '5021',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'digitalasset.zenapi.co.in',
      },
    ],
  },
};

export default nextConfig;
