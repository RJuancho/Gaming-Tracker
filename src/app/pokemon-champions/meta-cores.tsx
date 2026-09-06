"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { BattleFormat, ChampionsMetaCore, ChampionsRosterPokemon } from "@/integrations/pokemon/champions/provider";

import { PokemonSpriteImage } from "./pokemon-asset-image";

export function MetaCoresSection({ doublesRoster = [], singlesRoster = [] }: { doublesRoster?: ChampionsRosterPokemon[]; singlesRoster?: ChampionsRosterPokemon[] }) {
  const [format, setFormat] = useState<BattleFormat>("Doubles");
  const roster = format === "Doubles" ? doublesRoster : singlesRoster;
  const [anchorPokemon, setAnchorPokemon] = useState("");
  const [cores, setCores] = useState<ChampionsMetaCore[] | null>(null);
  const [loadedFormat, setLoadedFormat] = useState<BattleFormat | null>(null);
  const [errorFormat, setErrorFormat] = useState<BattleFormat | null>(null);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ format });
    if (anchorPokemon) query.set("pokemon", anchorPokemon);
    fetch(`/api/pokemon-champions/meta-cores?${query}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("request failed");
        return (await response.json()) as { cores: ChampionsMetaCore[] };
      })
      .then((data) => {
        if (!active) return;
        setCores(data.cores);
        setLoadedFormat(format);
        setErrorFormat(null);
      })
      .catch(() => active && setErrorFormat(format));
    return () => { active = false; };
  }, [format, anchorPokemon]);

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-6">
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div><p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">Current meta discovery</p><h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Popular Team Cores</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Frequently ranked Pokémon partnerships from current ranked battle data. These are cores, not complete six-Pokémon teams.</p></div>
        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center"><label htmlFor="meta-anchor" className="sr-only">Choose a Pokémon</label><select id="meta-anchor" value={anchorPokemon} onChange={(event) => setAnchorPokemon(event.target.value)} className="min-h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-base text-slate-200 outline-none focus:border-violet-300/50 sm:w-auto sm:text-xs"><option value="">Choose a Pokémon</option>{roster.map((pokemon) => <option key={pokemon.pokemonId} value={pokemon.pokemonId}>{pokemon.name}</option>)}</select><div className="grid grid-cols-2 rounded-lg border border-white/10 bg-slate-950 p-1 text-xs sm:flex">{(["Doubles", "Singles"] as const).map((option) => <button key={option} type="button" onClick={() => { setFormat(option); setAnchorPokemon(""); }} className={`min-h-10 rounded-md px-3 py-2 ${format === option ? "bg-violet-300/15 text-violet-100" : "text-slate-500 hover:text-white"}`}>{option}</button>)}</div></div>
      </div>
      {loadedFormat !== format && errorFormat !== format ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" />)}</div> : null}
      {errorFormat === format ? <p className="mt-5 rounded-xl border border-rose-300/15 bg-rose-300/[0.05] p-4 text-sm text-rose-200">Current meta core data is temporarily unavailable.</p> : null}
      {loadedFormat === format && cores?.length === 0 ? <p className="mt-5 rounded-xl border border-white/10 p-4 text-sm text-slate-400">No recent team data is available for this format.</p> : null}
      {loadedFormat === format && cores && cores.length > 0 ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cores.map((core) => <article key={core.members.map((member) => member.pokemonId).join("-")} className="rounded-xl border border-white/10 bg-slate-950/60 p-3 sm:p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-xs text-cyan-300">#{core.partnerRank} {anchorPokemon ? "Best partner" : "Popular core"}</span><span className="text-xs text-slate-500">{core.format} · {core.season}</span></div><div className="mt-4 grid grid-cols-2 gap-2">{core.members.map((member) => <Link key={member.pokemonId} href={`/pokemon-champions/pokemon/${member.pokemonId}`} className="flex min-h-24 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-white/[0.06] p-2 transition active:scale-[0.99] hover:border-violet-300/30"><PokemonSpriteImage pokemonId={member.pokemonId} name={member.name} width={48} height={48} sizes="48px" className="size-12 object-contain [image-rendering:pixelated]" /><span className="w-full truncate text-center text-xs text-slate-200">{member.name}</span></Link>)}</div><p className="mt-3 text-xs text-slate-500">Observed teammate rank: #{core.partnerRank}</p></article>)}</div> : null}
    </section>
  );
}
