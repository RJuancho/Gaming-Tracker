# Stack

- Next.js 16.3.3 with App Router and Turbopack default; React/React DOM 19.2.8.
- TypeScript 5.x, strict mode, moduleResolution bundler, JSX react-jsx, incremental checking.
- Tailwind CSS 4.3.3 via `@tailwindcss/postcss`; global styles at `src/app/globals.css`.
- Drizzle ORM 0.45.2 with PostgreSQL driver `postgres`; Drizzle Kit 0.31.10 for migrations.
- Zod 4.5.4 validates environment values and external data.
- ESLint 9 with `eslint-config-next` 16.3.3 flat config.
- npm is the package manager; `package-lock.json` is committed.
- Next image remote patterns are configured in `next.config.ts`; do not bypass them for external image sources.