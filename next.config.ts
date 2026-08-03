import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Prevent API routes from being evaluated at build time */
  serverExternalPackages: ['pg', '@prisma/adapter-pg'],
};

export default nextConfig;
