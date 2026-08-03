import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Standalone output for efficient cloud deployment (Zeabur/Docker) */
  output: 'standalone',
  /* Prevent API routes from being evaluated at build time */
  serverExternalPackages: ['pg', '@prisma/adapter-pg'],
};

export default nextConfig;
