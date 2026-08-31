"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import type { ChampionsRosterPokemon } from "@/integrations/pokemon/champions/provider";
import { getChampionsSpriteUrl, getPokemonFormSlug, getShowdownFormSlug, getShowdownSpriteUrl } from "@/integrations/pokemon/assets";

import { addTeamMember } from "./actions";
import { getPokemonTypeColor } from "./pokemon-type-color";

const inputClassName =
  "mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/50";

export function PokemonRosterPicker({
  teamId,
  roster,
  usedPokemonIds,
  synergyNames,
  roleSuggestions,
}: {
  teamId: number;
  roster: ChampionsRosterPokemon[];
  usedPokemonIds: string[];
  synergyNames: string[];
  roleSuggestions: Record<string, string[]>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const availableRoster = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return roster.filter(
      (pokemon) =>
        !usedPokemonIds.includes(pokemon.pokemonId) &&
        (normalizedQuery.length === 0 ||
          pokemon.name.toLowerCase().includes(normalizedQuery) ||
          pokemon.types.some((type) =>
            type.toLowerCase().includes(normalizedQuery),
          )),
    ).sort((left, right) => {
      const normalize = (value: string) => value.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
      const isSynergy = (pokemon: ChampionsRosterPokemon) => synergyNames.some((name) => {
        const candidate = normalize(name);
        const rosterName = normalize(pokemon.name);
        const rosterId = normalize(pokemon.pokemonId);
        return candidate === rosterName || candidate === rosterId || candidate.includes(rosterName) || rosterName.includes(candidate) || candidate.includes(rosterId) || rosterId.includes(candidate);
      });
      return Number(isSynergy(right)) - Number(isSynergy(left)) || left.name.localeCompare(right.name);
    });
  }, [query, roster, usedPokemonIds, synergyNames]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    searchInputRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <div className="mt-5 flex justify-end border-t border-white/10 pt-4">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-xl border border-violet-300/25 bg-violet-300/10 px-4 py-2.5 text-sm font-medium text-violet-100 transition hover:bg-violet-300/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
        >
          Add Pokémon
        </button>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`add-pokemon-title-${teamId}`}
            className="my-8 w-full max-w-xl rounded-2xl border border-violet-300/20 bg-slate-900 p-5 shadow-2xl shadow-black/40 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">
                  Team roster
                </p>
                <h2
                  id={`add-pokemon-title-${teamId}`}
                  className="mt-2 text-2xl font-semibold text-white"
                >
                  Add a Pokémon
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close Pokémon picker"
                onClick={() => setIsOpen(false)}
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-xl text-slate-400 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
              >
                ×
              </button>
            </div>

            <form action={addTeamMember} className="mt-5">
              <input type="hidden" name="teamId" value={teamId} />
              <div className="flex items-end justify-between gap-4">
                <label className="block min-w-0 flex-1 text-xs text-slate-400">
                  Search available Pokémon or type
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Try Garchomp, Water, Support…"
                    className={inputClassName}
                  />
                </label>
                <span className="pb-2.5 text-xs text-slate-600">
                  {availableRoster.length} available
                </span>
              </div>

              <fieldset
                aria-label="Choose a Pokémon to add"
                className="mt-3 max-h-[45vh] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/60"
              >
                {availableRoster.length === 0 ? (
                  <p className="p-5 text-center text-sm text-slate-500">
                    No current roster match.
                  </p>
                ) : (
                  availableRoster.map((pokemon) => {
                    const normalize = (value: string) => value.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
                    const isSynergy = synergyNames.some((name) => {
                      const candidate = normalize(name);
                      const rosterName = normalize(pokemon.name);
                      const rosterId = normalize(pokemon.pokemonId);
                      return candidate === rosterName || candidate === rosterId || candidate.includes(rosterName) || rosterName.includes(candidate) || candidate.includes(rosterId) || rosterId.includes(candidate);
                    });
                    const isSelected = selectedPokemon === pokemon.pokemonId;
                    return (
                      <label
                        key={pokemon.pokemonId}
                        className={`grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.06] px-3 py-2.5 text-sm transition last:border-b-0 hover:bg-violet-300/[0.06] focus-within:bg-violet-300/[0.08] ${isSelected ? "bg-violet-300/[0.1] ring-1 ring-inset ring-violet-300/50" : ""}`}
                      >
                        <RosterSprite pokemonId={pokemon.pokemonId} name={pokemon.name} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-medium text-slate-200">{pokemon.name}</span>
                            {isSynergy ? <span className="shrink-0 text-[9px] uppercase tracking-wide text-emerald-300">Synergy</span> : null}
                          </span>
                          <span className="mt-1 flex flex-wrap gap-1">
                            {pokemon.types.map((type) => (
                              <span key={type} className={`rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase ${getPokemonTypeColor(type)}`}>
                                {type}
                              </span>
                            ))}
                          </span>
                        </span>
                        <span className="grid size-6 place-items-center rounded-full border-2 border-slate-600 transition-colors has-[:checked]:border-violet-300 has-[:checked]:bg-violet-300/15">
                          <input
                            type="radio"
                            name="pokemonId"
                            value={pokemon.pokemonId}
                            required
                            checked={isSelected}
                            onChange={() => setSelectedPokemon(pokemon.pokemonId)}
                            className="peer sr-only"
                          />
                          <span aria-hidden="true" className="size-2.5 rounded-full bg-violet-300 opacity-0 transition-opacity peer-checked:opacity-100" />
                        </span>
                      </label>
                    );
                  })
                )}
              </fieldset>

              <label className="mt-4 block text-xs text-slate-400">
                Intended role
                <select name="role" required className={inputClassName} defaultValue="">
                  <option value="" disabled>Choose the most useful role</option>
                  {(roleSuggestions[selectedPokemon] ?? ["Physical attacker", "Special attacker", "Bulky support", "Speed control", "Setup sweeper"]).map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedPokemon || availableRoster.length === 0}
                  className="rounded-xl bg-violet-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add selected Pokémon
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function RosterSprite({ pokemonId, name }: { pokemonId: string; name: string }) {
  const candidates = spriteCandidates(pokemonId, name);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span aria-label="Sprite unavailable" className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-lg text-slate-600">◈</span>;
  }

  const sources = [getChampionsSpriteUrl(name), ...candidates.map(getShowdownSpriteUrl)];
  return <Image src={sources[index]} alt="" width={40} height={40} className="size-10 object-contain [image-rendering:pixelated]" unoptimized onError={() => {
    if (index >= sources.length - 1) {
      setFailed(true);
    } else {
      setIndex((current) => current + 1);
    }
  }} />;
}

function spriteCandidates(pokemonId: string, name: string) {
  const base = pokemonId.toLowerCase();
  const displaySlug = name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
  const formSlug = base
    .replace(/(alola|galar|hisui|paldea)$/, "-$1")
    .replace(/(forme)$/, "-$1");
  const hyphenatedFormSlug = getPokemonFormSlug(base);
  const showdownFormSlug = getShowdownFormSlug(base);
  const baseSpecies = base.replace(/(alola|galar|hisui|paldea|forme|f)$/, "");
  return [...new Set([base, formSlug, hyphenatedFormSlug, showdownFormSlug, displaySlug, baseSpecies])];
}
