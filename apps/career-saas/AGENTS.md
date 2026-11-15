# CareerOS frontend

This application is excluded from the parent pnpm workspace. Use Node 24 and the npm commands in [README.md](README.md). Install this application's own dependencies before changing framework code.

Read the installed Next.js package's bundled App Router documentation before writing route, server or client code. Framework APIs and conventions may differ from earlier versions. Do not assume the parent installation supplies this app's framework dependencies.

The active frontend must preserve the data-safety and optional cloud boundaries documented in [README.md](README.md). Archived upstream starter files are attribution/reference material, not active authentication or payment routes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
