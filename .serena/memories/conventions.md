# Source conventions

- Route files follow App Router names: `page.tsx`, `layout.tsx`, and API `route.ts`; JSX-bearing files use `.tsx`.
- Server Actions are marked `"use server"`; interactive components are marked `"use client"` at file top.
- Keep secrets server-side; validate `DATABASE_URL`, `RIOT_API_KEY`, and optional `DISCORD_WEBHOOK_URL` with Zod before use.
- Use `@/…` imports for project modules; keep database/integration/service logic outside route UI where practical.
- Shared styling is Tailwind utility-first CSS with custom base rules in `src/app/globals.css`.
- Preserve existing route behavior and external API integration boundaries; avoid changing generated `.next/` files.
- Keep Serena configuration under `.serena/`; local override/cache files are intentionally ignored.