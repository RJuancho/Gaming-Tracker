"use client";

import { useMemo, useState } from "react";

import type { ChampionsRosterPokemon } from "@/integrations/pokemon/champions/provider";

type MoveCategory = "physical" | "special";

export function DamageCalculator({ roster }: { roster: ChampionsRosterPokemon[] }) {
  const [attacker, setAttacker] = useState(roster[0]?.pokemonId ?? "");
  const [defender, setDefender] = useState(roster[1]?.pokemonId ?? roster[0]?.pokemonId ?? "");
  const [level, setLevel] = useState(50);
  const [power, setPower] = useState(80);
  const [attack, setAttack] = useState(150);
  const [defense, setDefense] = useState(120);
  const [category, setCategory] = useState<MoveCategory>("physical");
  const [stab, setStab] = useState(1.5);
  const [effectiveness, setEffectiveness] = useState(1);
  const [critical, setCritical] = useState(false);

  const result = useMemo(() => {
    const base = Math.floor(Math.floor(Math.floor((2 * level) / 5 + 2) * power * attack / defense) / 50) + 2;
    const criticalMultiplier = critical ? 1.5 : 1;
    const modified = Math.floor(base * criticalMultiplier * stab * effectiveness);
    const min = Math.floor(modified * 0.85);
    return { min, max: modified, average: Math.floor((min + modified) / 2), base, category };
  }, [attack, category, critical, defense, effectiveness, level, power, stab]);

  const fieldClass = "mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-violet-300/50";
  const selectedName = (id: string) => roster.find((pokemon) => pokemon.pokemonId === id)?.name ?? id;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs uppercase tracking-wide text-slate-500">Attacker<select value={attacker} onChange={(event) => setAttacker(event.target.value)} className={fieldClass}>{roster.map((pokemon) => <option key={pokemon.pokemonId} value={pokemon.pokemonId}>{pokemon.name}</option>)}</select></label>
          <label className="text-xs uppercase tracking-wide text-slate-500">Defender<select value={defender} onChange={(event) => setDefender(event.target.value)} className={fieldClass}>{roster.map((pokemon) => <option key={pokemon.pokemonId} value={pokemon.pokemonId}>{pokemon.name}</option>)}</select></label>
          <NumberField label="Level" value={level} onChange={setLevel} min={1} max={100} />
          <NumberField label="Move power" value={power} onChange={setPower} min={1} max={250} />
          <NumberField label={`${selectedName(attacker)} ${category === "physical" ? "Attack" : "Sp. Atk"}`} value={attack} onChange={setAttack} min={1} max={999} />
          <NumberField label={`${selectedName(defender)} ${category === "physical" ? "Defense" : "Sp. Def"}`} value={defense} onChange={setDefense} min={1} max={999} />
          <label className="text-xs uppercase tracking-wide text-slate-500">Move category<select value={category} onChange={(event) => setCategory(event.target.value as MoveCategory)} className={fieldClass}><option value="physical">Physical</option><option value="special">Special</option></select></label>
          <label className="text-xs uppercase tracking-wide text-slate-500">Effectiveness<select value={effectiveness} onChange={(event) => setEffectiveness(Number(event.target.value))} className={fieldClass}><option value={0}>Immune (0×)</option><option value={0.25}>Not very effective (¼×)</option><option value={0.5}>Not very effective (½×)</option><option value={1}>Neutral (1×)</option><option value={2}>Super effective (2×)</option><option value={4}>Super effective (4×)</option></select></label>
          <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={stab === 1.5} onChange={(event) => setStab(event.target.checked ? 1.5 : 1)} className="size-4 accent-violet-300" /> Same-type attack bonus (1.5×)</label>
          <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={critical} onChange={(event) => setCritical(event.target.checked)} className="size-4 accent-violet-300" /> Critical hit (1.5×)</label>
        </div>
      </section>

      <section className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-5 sm:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">Estimated damage</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{selectedName(attacker)} → {selectedName(defender)}</h2>
        <div className="mt-8 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-slate-950/60 p-3"><p className="text-xs uppercase text-slate-500">Range</p><p className="mt-1 text-xl font-semibold text-white">{result.min}–{result.max}</p></div><div className="rounded-xl bg-slate-950/60 p-3"><p className="text-xs uppercase text-slate-500">Average</p><p className="mt-1 text-xl font-semibold text-violet-200">{result.average}</p></div><div className="rounded-xl bg-slate-950/60 p-3"><p className="text-xs uppercase text-slate-500">Base</p><p className="mt-1 text-xl font-semibold text-white">{result.base}</p></div></div>
        <p className="mt-6 text-xs leading-5 text-slate-400">Uses the familiar level/power/attack/defense damage formula with STAB, type effectiveness, critical hit, and the 85–100% random roll. Add weather, abilities, items, screens, and doubles modifiers when those inputs are known.</p>
      </section>
    </div>
  );
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min: number; max: number }) {
  return <label className="text-xs uppercase tracking-wide text-slate-500">{label}<input type="number" value={value} min={min} max={max} onChange={(event) => onChange(Number(event.target.value) || min)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-violet-300/50" /></label>;
}
