import Link from "next/link";

import { getChampionsRoster } from "@/integrations/pokemon/champions/provider";
import { listPokemonTeams } from "@/services/pokemon-teams";

import { PokemonDashboardSearch } from "./pokemon-dashboard-search";

export const dynamic = "force-dynamic";

export default async function PokemonChampionsDashboard() {
  const [teams, doublesRoster, singlesRoster] = await Promise.all([
    listPokemonTeams(),
    getChampionsRoster("Doubles"),
    getChampionsRoster("Singles"),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-sm text-slate-400 transition-colors hover:text-white">← Gaming Tracker</Link>
          <div className="flex flex-wrap gap-2"><Link href="/pokemon-champions/damage-calculator" className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15">Damage calculator →</Link><Link href="/pokemon-champions/teams" className="rounded-xl border border-violet-300/25 bg-violet-300/10 px-4 py-2.5 text-sm font-medium text-violet-100 transition hover:bg-violet-300/15">Open team builder →</Link></div>
        </div>

        <header className="mt-12 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">Pokémon Champions</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">Your Pokémon dashboard.</h1>
          <p className="mt-5 text-lg leading-8 text-slate-400">Search the current competitive roster, jump into a Pokémon profile, and keep your saved teams close at hand.</p>
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><p className="text-xs uppercase tracking-wider text-slate-500">Doubles roster</p><p className="mt-2 text-3xl font-semibold text-white">{doublesRoster.length}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><p className="text-xs uppercase tracking-wider text-slate-500">Singles roster</p><p className="mt-2 text-3xl font-semibold text-white">{singlesRoster.length}</p></div>
          <Link href="/pokemon-champions/teams" className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-violet-300/30"><p className="text-xs uppercase tracking-wider text-slate-500">Saved teams</p><p className="mt-2 text-3xl font-semibold text-white">{teams.length}</p><p className="mt-1 text-xs text-violet-200">Manage teams →</p></Link>
        </section>

        <div className="mt-6"><PokemonDashboardSearch doublesRoster={doublesRoster} singlesRoster={singlesRoster} /></div>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <Link href="/pokemon-champions/teams" className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-6 transition hover:border-violet-300/40"><p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">Team lab</p><h2 className="mt-2 text-xl font-semibold text-white">Build and tune teams</h2><p className="mt-2 text-sm leading-6 text-slate-400">Save six-slot rosters, assign roles, and refine moves, items, abilities, and stat allocations.</p></Link>
          <Link href="/pokemon-champions/snorlax" className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-white/20"><p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Meta reference</p><h2 className="mt-2 text-xl font-semibold text-white">View the Snorlax preview</h2><p className="mt-2 text-sm leading-6 text-slate-400">Keep the original competitive snapshot available as one of the dashboard’s reference tools.</p></Link>
        </section>
      </div>
    </main>
  );
}
