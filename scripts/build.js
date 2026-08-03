// Cross-platform build wrapper (Windows/macOS/Linux, local + Zeabur).
//
// `prisma generate` only needs DATABASE_URL to be a syntactically valid
// connection string — it never connects to the database during generate.
// Some PaaS build steps (Zeabur's included) don't expose dashboard-configured
// env vars to the build layer, only to the running container, so we fall
// back to a placeholder here purely to satisfy schema validation. The real
// DATABASE_URL is still required at runtime (see the "start" script).
if (!process.env.DATABASE_URL) {
  console.log('[build] DATABASE_URL not set at build time, using placeholder for prisma generate');
  process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy';
}

const { execSync } = require('child_process');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

run('npx prisma generate --schema=prisma/schema.prisma');
run('next build');
