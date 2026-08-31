# Gaming Tracker

A personal gaming tracker and meta analytics web application. The long-term goal is to compare personal performance and progression with current and historical competitive meta data.

The first planned game integrations are:

- Teamfight Tactics (TFT)
- Pokémon Champions

Both game areas now have early integrations and local workflows, but remain
incremental prototypes rather than complete products.

## Disclaimer

Gaming Tracker is an unofficial, non-commercial fan project created for
personal use, learning, and open-source development. It is not affiliated with,
endorsed by, sponsored by, or officially connected to Nintendo, The Pokémon
Company, Game Freak, Riot Games, or any other publisher represented in the app.
Pokémon, Teamfight Tactics, Blox Fruits, and related names, artwork, sprites,
trademarks, and data remain the property of their respective rights holders.
Third-party services and assets are subject to their own terms and ownership.
See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) and [LICENSE](LICENSE).

## Current stack

- Next.js 16 with the App Router
- React 19
- TypeScript in strict mode
- Tailwind CSS 4
- PostgreSQL 14 or newer
- Drizzle ORM and Drizzle Kit
- Zod (installed for future input and environment validation)

## Requirements

- Node.js 20.9 or newer
- npm
- PostgreSQL 14 or newer for applying migrations and storing snapshots

## Installation

Install JavaScript dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

The example `DATABASE_URL` contains placeholders. Do not add real secrets to `.env.example` or commit `.env.local`.

### Riot API setup

1. Sign in to the [Riot Developer Portal](https://developer.riotgames.com/).
2. Copy your development API key and your own Riot ID into the corresponding
   variables in `.env.local`.
3. Restart the development server after changing the environment file.

Development keys expire every 24 hours. The key is read only by server-only integration modules and is sent to Riot in the `X-Riot-Token` request header. Never prefix it with `NEXT_PUBLIC_` or expose it to browser code.

Set `RIOT_GAME_NAME`, `RIOT_TAG_LINE`, `RIOT_ACCOUNT_REGION`, `RIOT_PLATFORM`,
and `RIOT_MATCH_REGION` to your own profile values. No personal account
identifier is committed to the repository.

## Open-source setup

Clone the repository, install dependencies, copy `.env.example` to
`.env.local`, and provide your own credentials and database connection. Local
environment files, generated builds, dependencies, and local database values
are ignored by Git. Do not commit secrets, personal match history, database
dumps, or imported account data.

See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for current third-party data and asset
sources, and [LICENSE](LICENSE) for the source-code license and its exclusions.

## Development

Start the local development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Available checks:

```bash
npm run lint
npm run typecheck
npm run build
```

### Database

The database currently stores Riot accounts, timestamped TFT rank snapshots,
TFT meta snapshots with linked compositions, Pokémon Champions saved teams,
and the Blox Fruits watchlist. New TFT meta records use a completed Philippine
calendar-day window. Legacy manual meta snapshots are preserved without a
daily window.

Set `DATABASE_URL` in `.env.local`, then apply the committed migration. For this
local checkout, the database-only value is kept in the ignored
`.env.database.local` file so the existing Riot configuration remains untouched:

```bash
npm run db:migrate
```

When the Drizzle schema changes, generate a new SQL migration and review the SQL
before applying it:

```bash
npm run db:generate
```

Drizzle describes the schema in TypeScript, but PostgreSQL still enforces its
foreign keys, check constraints, unique index, and lookup index. Migrations are
committed so those SQL decisions remain visible and reviewable.

## Current milestone

The server-rendered TFT profile at `/tft` uses Riot's Account, Match, and League
APIs. The `/tft/meta` page reads persisted meta snapshots from PostgreSQL and
offers a local-only manual daily sync. That sync samples up to 24 Diamond I
seed players, deduplicates their recent match IDs, caps the collection at 48
unique matches, and paces match requests. Repeating a sync for the same source,
platform, and Philippine sample date replaces that day's aggregate instead of
creating a duplicate.

Pokémon Champions lookup and team-building remain early community-data-backed
features. Blox Fruits stock notification work is paused while a reliable fresh
provider is evaluated. Authentication, automatic daily scheduling, and
day-over-day TFT composition comparison are not implemented yet.
