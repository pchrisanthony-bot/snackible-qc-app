/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    serverComponentsExternalPackages: ["xlsx"],
  },
  experimental: {
    serverComponentsExternalPackages: ["xlsx", "canvas"],
  },
};

module.exports = nextConfig;
