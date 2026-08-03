import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer allows `url = env("DATABASE_URL")` inside schema.prisma
// (the datasource url must come from here for CLI tooling — generate/migrate/db push).
// The actual app connection (src/lib/db/prisma.ts) uses the @prisma/adapter-pg
// driver adapter directly and does not depend on this file.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
});
