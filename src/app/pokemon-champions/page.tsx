import Link from "next/link";

import { getChampionsRoster } from "@/integrations/pokemon/champions/provider";
import { listPokemonTeams } from "@/services/pokemon-teams";

import { PokemonDashboardSearch } from "./pokemon-dashboard-search";
import { MetaCoresSection } from "./meta-cores";

export const dynamic = "force-dynamic";

export default async function PokemonChampionsDashboard() {
  const [teams, doublesRoster, singlesRoster] = await Promise.all([
    listPokemonTeams(),
    getChampionsRoster("Doubles"),
    getChampionsRoster("Singles"),
  ]);

  return (
    <main className="min-h-screen min-h-dvh bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl pb-[max(2rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-10 sm:py-10 lg:px-12">
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Link href="/" className="text-sm text-slate-400 transition-colors hover:text-white">← Gaming Tracker</Link>
          <div className="grid gap-2 min-[390px]:grid-cols-2 sm:flex sm:flex-wrap">
            <Link href="/pokemon-champions/damage-calculator" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2.5 text-center text-xs font-medium text-cyan-100 transition active:scale-[0.99] hover:bg-cyan-300/15 sm:px-4 sm:text-sm">Damage calculator →</Link>
            <Link href="/pokemon-champions/teams" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-violet-300/25 bg-violet-300/10 px-3 py-2.5 text-center text-xs font-medium text-violet-100 transition active:scale-[0.99] hover:bg-violet-300/15 sm:px-4 sm:text-sm">Open team builder →</Link>
          </div>
        </div>

        <header className="mt-10 max-w-3xl sm:mt-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">Pokémon Champions</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] text-white min-[390px]:text-4xl sm:text-5xl">Your Pokémon dashboard.</h1>
          <p className="mt-4 text-base leading-7 text-slate-400 sm:mt-5 sm:text-lg sm:leading-8">Search the current competitive roster, jump into a Pokémon profile, and keep your saved teams close at hand.</p>
        </header>

        <section className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5"><p className="text-[10px] uppercase tracking-wider text-slate-500 sm:text-xs">Doubles roster</p><p className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{doublesRoster.length}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5"><p className="text-[10px] uppercase tracking-wider text-slate-500 sm:text-xs">Singles roster</p><p className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{singlesRoster.length}</p></div>
          <Link href="/pokemon-champions/teams" className="col-span-2 flex min-h-24 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition active:scale-[0.995] hover:border-violet-300/30 sm:col-span-1 sm:block sm:p-5"><div><p className="text-[10px] uppercase tracking-wider text-slate-500 sm:text-xs">Saved teams</p><p className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{teams.length}</p></div><p className="text-xs text-violet-200 sm:mt-1">Manage teams →</p></Link>
        </section>

        <div className="mt-6"><PokemonDashboardSearch doublesRoster={doublesRoster} singlesRoster={singlesRoster} /></div>

        <MetaCoresSection doublesRoster={doublesRoster} singlesRoster={singlesRoster} />

        <section className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-200">Community team sources</p>
          <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Explore full team rankings</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">These sources publish complete teams, unlike the teammate-core data above. Rankings and availability are maintained by their respective communities.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <a href="https://champteams.gg/top-teams" target="_blank" rel="noreferrer" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/60 p-4 transition active:scale-[0.995] hover:border-amber-200/40"><p className="font-semibold text-amber-100">ChampTeams.gg</p><p className="mt-1 text-xs leading-5 text-slate-400">Tournament teams ranked using win rate, play rate, event size, and recency.</p><span className="mt-3 inline-block text-xs text-amber-200">Open top teams →</span></a>
            <a href="https://pokefeed.app/teams" target="_blank" rel="noreferrer" className="min-h-11 rounded-xl border border-white/10 bg-slate-950/60 p-4 transition active:scale-[0.995] hover:border-amber-200/40"><p className="font-semibold text-amber-100">PokeFeed</p><p className="mt-1 text-xs leading-5 text-slate-400">Community-shared Singles and Doubles teams ranked by player votes.</p><span className="mt-3 inline-block text-xs text-amber-200">Browse community teams →</span></a>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <Link href="/pokemon-champions/teams" className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-5 transition active:scale-[0.995] hover:border-violet-300/40 sm:p-6"><p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">Team lab</p><h2 className="mt-2 text-xl font-semibold text-white">Build and tune teams</h2><p className="mt-2 text-sm leading-6 text-slate-400">Save six-slot rosters, assign roles, and refine moves, items, abilities, and stat allocations.</p></Link>
          <Link href="/pokemon-champions/snorlax" className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition active:scale-[0.995] hover:border-white/20 sm:p-6"><p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Meta reference</p><h2 className="mt-2 text-xl font-semibold text-white">View the Snorlax preview</h2><p className="mt-2 text-sm leading-6 text-slate-400">Keep the original competitive snapshot available as one of the dashboard’s reference tools.</p></Link>
        </section>
      </div>
    </main>
  );
}
