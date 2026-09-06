import Link from "next/link";

const games = [
  {
    name: "Pokémon Champions",
    eyebrow: "Competitive team lab",
    description:
      "Search the current roster, study battle trends, build teams, and refine complete competitive sets.",
    href: "/pokemon-champions",
    action: "Open Pokémon dashboard",
    status: "Teams & meta",
    source: "Community battle data",
    marker: "PC",
    accent: "from-violet-400/20 via-fuchsia-500/5 to-transparent",
    markerStyle: "border-violet-300/30 bg-violet-300/10 text-violet-100",
    statusStyle: "border-violet-300/20 bg-violet-300/10 text-violet-200",
    linkStyle: "text-violet-200",
    tools: ["Team builder", "Meta cores", "Damage calculator"],
  },
  {
    name: "Teamfight Tactics",
    eyebrow: "Ranked performance",
    description:
      "Review recent matches, recurring units and traits, ranked progress, and sampled meta itemizations.",
    href: "/tft",
    action: "View TFT profile",
    status: "Riot connected",
    source: "Official Riot API",
    marker: "TFT",
    accent: "from-cyan-400/20 via-blue-500/5 to-transparent",
    markerStyle: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
    statusStyle: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
    linkStyle: "text-cyan-200",
    tools: ["Match history", "Rank tracking", "Meta snapshots"],
  },
  {
    name: "Genshin Impact",
    eyebrow: "Wishes & builds",
    description:
      "Keep a local wish ledger and inspect player-facing character, weapon, artifact, and stat summaries.",
    href: "/genshin-impact",
    action: "Open Genshin dashboard",
    status: "Profile ready",
    source: "Local data + Enka",
    marker: "GI",
    accent: "from-amber-400/20 via-orange-500/5 to-transparent",
    markerStyle: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    statusStyle: "border-amber-300/20 bg-amber-300/10 text-amber-200",
    linkStyle: "text-amber-200",
    tools: ["Wish tracker", "Build viewer", "Akasha links"],
  },
  {
    name: "Blox Fruits",
    eyebrow: "Dealer stock watch",
    description:
      "Monitor current fruit rotations, maintain a focused watchlist, and prepare Discord stock alerts.",
    href: "/blox-fruits",
    action: "Manage stock watchlist",
    status: "Stock monitor",
    source: "Community stock feed",
    marker: "BF",
    accent: "from-orange-400/20 via-rose-500/5 to-transparent",
    markerStyle: "border-orange-300/30 bg-orange-300/10 text-orange-100",
    statusStyle: "border-orange-300/20 bg-orange-300/10 text-orange-200",
    linkStyle: "text-orange-200",
    tools: ["Live rotation", "Watchlist", "Alert preview"],
  },
] as const;

export default function Home() {
  return (
    <main className="relative min-h-screen min-h-dvh overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[46rem] bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.13),transparent_32%),radial-gradient(circle_at_85%_5%,rgba(168,85,247,0.14),transparent_34%),linear-gradient(to_bottom,rgba(15,23,42,0.15),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_55%)]" />

      <div className="relative mx-auto flex min-h-screen min-h-dvh w-full max-w-6xl flex-col pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10 sm:py-6 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
            aria-label="Gaming Tracker home"
          >
            <span className="grid size-10 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 font-mono text-sm font-bold text-cyan-100 shadow-lg shadow-cyan-950/30">
              GT
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide text-white">
                Gaming Tracker
              </span>
              <span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Personal workspace
              </span>
            </span>
          </Link>
          <a
            href="#dashboards"
            className="hidden rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white sm:inline-flex"
          >
            Browse dashboards
          </a>
        </header>

        <section className="grid gap-9 py-12 sm:gap-12 sm:py-20 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)] lg:items-end lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-xs text-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]" />
              Four game spaces ready
            </div>
            <h1 className="mt-5 text-balance text-[clamp(2.5rem,11.5vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:mt-6 sm:text-6xl sm:leading-[1.05] lg:text-7xl">
              Your games, organized around how you play.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-400 sm:mt-7 sm:text-xl sm:leading-8">
              Track personal progress, inspect useful builds, and turn current
              community data into decisions without jumping between scattered
              tools.
            </p>
            <div className="mt-7 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap">
              <a
                href="#dashboards"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-cyan-200 bg-cyan-300 px-5 py-3 text-center text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition active:scale-[0.99] hover:border-white hover:bg-cyan-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 sm:w-auto"
              >
                Choose a dashboard ↓
              </a>
              <Link
                href="/pokemon-champions/teams"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-center text-sm font-medium text-slate-200 transition active:scale-[0.99] hover:border-violet-300/30 hover:bg-violet-300/[0.08] hover:text-white sm:w-auto"
              >
                Continue team building →
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-400">
                Workspace overview
              </p>
              <span className="text-xs text-slate-600">4 dashboards</span>
            </div>
            <div className="mt-5 space-y-4">
              {games.map((game) => (
                <div key={game.name} className="flex items-center gap-3">
                  <span className={`grid size-8 shrink-0 place-items-center rounded-lg border font-mono text-[10px] font-bold ${game.markerStyle}`}>
                    {game.marker}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-300">
                    {game.name}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="size-1.5 rounded-full bg-emerald-300/80" />
                    Ready
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section id="dashboards" className="scroll-mt-6 pb-16 sm:pb-20">
          <div className="flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                Game spaces
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">
                Choose what you want to work on.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-500 sm:text-right">
              Each dashboard keeps its own tools and data boundaries while
              sharing one consistent workspace.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {games.map((game) => (
              <Link
                key={game.name}
                href={game.href}
                aria-label={game.action}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/65 p-5 transition duration-300 active:scale-[0.995] hover:border-white/20 hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60 sm:p-7 md:min-h-72 md:hover:-translate-y-1"
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${game.accent} opacity-80 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="pointer-events-none absolute -right-12 -top-16 font-mono text-[11rem] font-black leading-none text-white/[0.025] transition-transform duration-500 group-hover:-translate-x-2 group-hover:translate-y-2">
                  {game.marker.charAt(0)}
                </div>

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <span className={`grid h-11 min-w-11 place-items-center rounded-xl border px-2 font-mono text-xs font-bold ${game.markerStyle}`}>
                      {game.marker}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${game.statusStyle}`}>
                      {game.status}
                    </span>
                  </div>

                  <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {game.eyebrow}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {game.name}
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
                    {game.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {game.tools.map((tool) => (
                      <span
                        key={tool}
                        className="rounded-md border border-white/[0.07] bg-slate-950/35 px-2 py-1 text-[10px] text-slate-400"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex flex-col items-start gap-2 pt-7 min-[390px]:flex-row min-[390px]:items-end min-[390px]:justify-between min-[390px]:gap-4">
                    <span className="text-[11px] text-slate-600">
                      {game.source}
                    </span>
                    <span className={`text-sm font-medium leading-5 transition group-hover:text-white min-[390px]:text-right ${game.linkStyle}`}>
                      {game.action} <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-auto flex flex-col gap-2 border-t border-white/10 py-6 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Built with Next.js and PostgreSQL.</span>
          <span>Unofficial, non-commercial personal gaming tracker.</span>
        </footer>
      </div>
    </main>
  );
}
