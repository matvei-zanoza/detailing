import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      { source: "/logo.png", destination: "/images/logo.png" },
      { source: "/logo-v2.png", destination: "/images/logo-v2.png" },
    ];
  },
};

export default nextConfig;
