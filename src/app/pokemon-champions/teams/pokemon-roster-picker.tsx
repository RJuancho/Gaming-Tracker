"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ChampionsRosterPokemon } from "@/integrations/pokemon/champions/provider";

import { addTeamMember } from "./actions";
import { getPokemonTypeColor } from "./pokemon-type-color";

const inputClassName =
  "mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/50";

export function PokemonRosterPicker({
  teamId,
  roster,
  usedPokemonIds,
}: {
  teamId: number;
  roster: ChampionsRosterPokemon[];
  usedPokemonIds: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
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
    );
  }, [query, roster, usedPokemonIds]);

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

              <div className="mt-3 max-h-[45vh] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/60">
                {availableRoster.length === 0 ? (
                  <p className="p-5 text-center text-sm text-slate-500">
                    No current roster match.
                  </p>
                ) : (
                  availableRoster.map((pokemon) => (
                    <label
                      key={pokemon.pokemonId}
                      className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.06] px-3 py-2.5 text-sm last:border-b-0 hover:bg-violet-300/[0.06]"
                    >
                      <input
                        type="radio"
                        name="pokemonId"
                        value={pokemon.pokemonId}
                        required
                        className="accent-violet-300"
                      />
                      <span className="truncate font-medium text-slate-200">
                        {pokemon.name}
                      </span>
                      <span className="flex flex-wrap justify-end gap-1">
                        {pokemon.types.map((type) => (
                          <span
                            key={type}
                            className={`rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase ${getPokemonTypeColor(
                              type,
                            )}`}
                          >
                            {type}
                          </span>
                        ))}
                      </span>
                    </label>
                  ))
                )}
              </div>

              <label className="mt-4 block text-xs text-slate-400">
                Intended role
                <input
                  name="role"
                  required
                  maxLength={60}
                  placeholder="e.g. Physical carry"
                  className={inputClassName}
                />
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
                  disabled={availableRoster.length === 0}
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

