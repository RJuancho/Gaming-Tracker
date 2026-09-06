"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { ChampionsRosterPokemon } from "@/integrations/pokemon/champions/provider";

import { getPokemonTypeColor } from "./teams/pokemon-type-color";

export function PokemonDashboardSearch({
  doublesRoster,
  singlesRoster,
}: {
  doublesRoster: ChampionsRosterPokemon[];
  singlesRoster: ChampionsRosterPokemon[];
}) {
  const [format, setFormat] = useState<"Doubles" | "Singles">("Doubles");
  const [query, setQuery] = useState("");
  const roster = format === "Doubles" ? doublesRoster : singlesRoster;
  const matches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return roster
      .filter(
        (pokemon) =>
          normalizedQuery.length === 0 ||
          pokemon.name.toLowerCase().includes(normalizedQuery) ||
          pokemon.pokemonId.toLowerCase().includes(normalizedQuery) ||
          pokemon.types.some((type) => type.toLowerCase().includes(normalizedQuery)),
      )
      .slice(0, 30);
  }, [query, roster]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-6">
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">
            Pokédex search
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Find a Pokémon</h2>
        </div>
        <div className="grid grid-cols-2 rounded-lg border border-white/10 bg-slate-950 p-1 text-xs sm:flex">
          {(["Doubles", "Singles"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFormat(option)}
              className={`min-h-10 rounded-md px-3 py-2 transition ${
                format === option ? "bg-violet-300/15 text-violet-100" : "text-slate-500 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-5 block text-sm text-slate-400">
        Search by name, type, or roster ID
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try Garchomp, Water, or Pikachu"
          className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-base text-white outline-none transition focus:border-violet-300/50 sm:text-sm"
        />
      </label>

      <p className="mt-4 text-xs text-slate-500">Showing {matches.length} current {format.toLowerCase()} roster matches.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((pokemon) => (
          <Link
            key={pokemon.pokemonId}
            href={`/pokemon-champions/pokemon/${pokemon.pokemonId}`}
            className="min-h-16 rounded-xl border border-white/[0.08] bg-slate-950/60 p-3 transition active:scale-[0.995] hover:border-violet-300/30 hover:bg-violet-300/[0.06]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium text-slate-200">{pokemon.name}</span>
              <span className="font-mono text-[10px] text-slate-600">→</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {pokemon.types.map((type) => (
                <span key={type} className={`rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase ${getPokemonTypeColor(type)}`}>
                  {type}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
      {matches.length === 0 ? <p className="mt-5 text-center text-sm text-slate-500">No current roster match.</p> : null}
    </section>
  );
}
