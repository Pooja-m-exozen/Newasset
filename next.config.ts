import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '192.168.0.5',
        port: '5021',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
