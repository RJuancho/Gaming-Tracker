# Project map

- Next.js App Router source lives under `src/app`; route folders are `tft`, `pokemon-champions`, `blox-fruits`, and `api/tft/meta/sync`.
- Shared server-side domains live in `src/db`, `src/integrations`, and `src/services`; Drizzle SQL/migration artifacts live in `drizzle/`.
- Root-only project configuration: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `drizzle.config.ts`.
- TypeScript path alias `@/*` resolves to `src/*`.
- Local secrets stay in root `.env*` files; `.env.example` is the only environment template intended for version control.
- Read `mem:tech_stack` for pinned tools, `mem:conventions` for source patterns, `mem:suggested_commands` for workflows, and `mem:task_completion` for validation.