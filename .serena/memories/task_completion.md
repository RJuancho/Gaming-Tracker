# Completion checks

- Run `npm run lint`.
- Run `npm run typecheck`; if `.next/` was removed, run `npm run build` or `npm run dev` first so Next 16 generates route types.
- Run `npm run build` for production validation.
- Confirm `.next/`, `node_modules/`, `.env`, `.env.local`, `.env*.local`, and `*.tsbuildinfo` remain ignored.
- Confirm no secret environment values are printed or staged.
- For Serena metadata changes, run `serena memories check`.