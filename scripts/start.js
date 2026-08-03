// Cross-platform start wrapper. Zeabur (and most PaaS platforms) assign a
// PORT env var at runtime and route traffic to whatever port the container
// actually listens on - `next start` defaults to 3000 if not told otherwise,
// which caused a 502 ("service is not listening on the correct port") even
// though the process itself was healthy.
const { execSync } = require('child_process');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

run('npx prisma db push --schema=prisma/schema.prisma');

const port = process.env.PORT || '3000';
console.log(`[start] Binding to port ${port}`);
run(`npx next start -H 0.0.0.0 -p ${port}`);
