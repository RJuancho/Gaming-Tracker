const games = [
  {
    name: "Genshin Impact",
    shortName: "Genshin",
    description:
      "Track total wishes and pity locally, then compare character builds and rankings through Akasha.",
    accent: "from-amber-400/25 to-orange-500/5",
    marker: "G",
  },
  {
    name: "Teamfight Tactics",
    shortName: "TFT",
    description:
      "Track ranked progress, match history, compositions, and performance across sets and patches.",
    accent: "from-cyan-400/25 to-blue-500/5",
    marker: "T",
  },
  {
    name: "Pokémon Champions",
    shortName: "Champions",
    description:
      "Explore teams, battles, usage, and changing competitive trends across seasons.",
    accent: "from-violet-400/25 to-fuchsia-500/5",
    marker: "P",
  },
  {
    name: "Blox Fruits",
    shortName: "Blox Fruits",
    description:
      "Watch selected fruits in the normal dealer rotation and prepare focused Discord stock alerts.",
    accent: "from-orange-400/25 to-rose-500/5",
    marker: "B",
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_45%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_40%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <a
            href="#top"
            className="flex items-center gap-3"
            aria-label="Gaming Tracker home"
          >
            <span className="grid size-9 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 font-mono text-sm font-bold text-cyan-200">
              GT
            </span>
            <span className="text-sm font-semibold tracking-wide text-white">
              Gaming Tracker
            </span>
          </a>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
            Foundation milestone
          </span>
        </header>

        <section
          id="top"
          className="flex flex-1 flex-col justify-center py-20 lg:py-28"
        >
          <div className="max-w-3xl">
            <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Personal gaming intelligence
            </p>
            <h1 className="text-balance text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              See your game more clearly.
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-slate-400 sm:text-xl">
              One place to connect personal progress with the wider competitive
              meta—built carefully, one verified data source at a time.
            </p>
          </div>

          <div id="games" className="mt-14 grid gap-4 md:grid-cols-2">
            {games.map((game) => (
              <article
                key={game.shortName}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${game.accent} p-6 transition-colors hover:border-white/20 sm:p-7`}
              >
                <div className="flex items-start justify-between gap-6">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/15 bg-slate-950/60 font-mono text-sm font-bold text-white">
                    {game.marker}
                  </span>
                  <span className="rounded-full border border-white/10 bg-slate-950/40 px-2.5 py-1 text-xs text-slate-400">
                    Planned
                  </span>
                </div>
                <h2 className="mt-8 text-xl font-semibold text-white">
                  {game.name}
                </h2>
                <p className="mt-3 max-w-md leading-7 text-slate-400">
                  {game.description}
                </p>
                {game.shortName === "Champions" ? (
                  <a
                    href="/pokemon-champions"
                    className="mt-6 inline-flex text-sm font-medium text-violet-200 transition-colors hover:text-white"
                  >
                    Open Pokémon dashboard →
                  </a>
                ) : game.shortName === "Genshin" ? (
                  <a href="/genshin-impact" className="mt-6 inline-flex text-sm font-medium text-amber-200 transition-colors hover:text-white">Open Genshin dashboard →</a>
                ) : game.shortName === "TFT" ? (
                  <a
                    href="/tft"
                    className="mt-6 inline-flex text-sm font-medium text-cyan-200 transition-colors hover:text-white"
                  >
                    View TFT profile →
                  </a>
                ) : (
                  <a
                    href="/blox-fruits"
                    className="mt-6 inline-flex text-sm font-medium text-orange-200 transition-colors hover:text-white"
                  >
                    Manage stock watchlist →
                  </a>
                )}
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-5 py-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>Current status</span>
            <span className="text-slate-300">
              Application foundation ready · Data integrations not started
            </span>
          </div>
        </section>

        <footer className="border-t border-white/10 py-5 text-xs text-slate-500">
          Built as a learning project with Next.js and PostgreSQL.
        </footer>
      </div>
    </main>
  );
}
