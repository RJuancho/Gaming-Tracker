import Link from "next/link";

import { DamageCalculator } from "../damage-calculator";
import { getChampionsRoster } from "@/integrations/pokemon/champions/provider";

export const dynamic = "force-dynamic";

export default async function DamageCalculatorPage() {
  const roster = await getChampionsRoster("Doubles");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:px-12">
        <Link href="/pokemon-champions" className="text-sm text-slate-400 transition hover:text-white">← Pokémon dashboard</Link>
        <header className="mt-12 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">Pokémon Champions tool</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">Damage calculator</h1>
          <p className="mt-5 text-lg leading-8 text-slate-400">Estimate a move’s damage range while testing attacker, defender, power, stats, type effectiveness, STAB, and critical hits.</p>
        </header>
        <div className="mt-10"><DamageCalculator roster={roster} /></div>
      </div>
    </main>
  );
}
