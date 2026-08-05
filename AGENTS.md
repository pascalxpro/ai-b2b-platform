<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Already known: the `middleware` file convention is renamed to **`proxy.ts`** (see `src/proxy.ts`).
<!-- END:nextjs-agent-rules -->

# Read this before starting work

**`docs/STATUS.md`** carries the context that `git log` cannot: outstanding
manual steps, design decisions and the reasoning behind them, and traps that
have already cost time (e.g. why Gemini must be called from the browser, and
why country verification uses phone numbers rather than addresses).

Read it first — several of those decisions look wrong until you know why they
were made, and re-deriving them is expensive.

Working agreement for this repo:
- Commit and push straight to `main`; Zeabur auto-deploys from it. No feature branches.
- This repo is edited from both Claude Code and Antigravity. `git fetch` before
  starting, commit and push before stopping — the risk is silently overwriting
  uncommitted work, not merge conflicts.
