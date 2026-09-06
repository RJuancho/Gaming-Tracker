"use client";

import { useState } from "react";

import { canToggleMegaSprite } from "@/integrations/pokemon/assets";

import { PokemonItemImage, PokemonSpriteImage } from "../pokemon-asset-image";
import { getPokemonTypeColor } from "./pokemon-type-color";

type Member = {
  pokemonId: string;
  name: string;
  role: string;
  heldItem: string | null;
  ability: string | null;
  nature: string | null;
  moves: string[];
  statAllocation: Record<string, number>;
  moveTypes: Record<string, string>;
};

export function TeamViewModal({ teamName, format, members }: { teamName: string; format: string; members: Member[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-400 transition hover:border-violet-300/25 hover:text-violet-200">View team</button>
      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="team-view-title" className="mx-auto my-8 w-full max-w-5xl rounded-2xl border border-violet-300/20 bg-slate-900 p-5 shadow-2xl shadow-black/40 sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div><p className="font-mono text-xs uppercase tracking-[0.18em] text-violet-300">{format} team overview</p><h2 id="team-view-title" className="mt-2 text-2xl font-semibold text-white">{teamName}</h2></div>
              <button type="button" aria-label="Close team overview" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg border border-white/10 text-xl text-slate-400 hover:bg-white/[0.05] hover:text-white">×</button>
            </div>
            {members.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">This team has no Pokémon yet.</p>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => (
                  <TeamMemberCard key={`${member.pokemonId}-${member.role}`} member={member} />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}

function TeamMemberCard({ member }: { member: Member }) {
  const canToggleMega = canToggleMegaSprite(
    member.pokemonId,
    member.name,
    member.heldItem,
  );
  const [showMega, setShowMega] = useState(true);

  return (
    <article className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-4">
      <div className="flex items-start gap-3">
        <PokemonSpriteImage
          pokemonId={member.pokemonId}
          name={member.name}
          heldItem={member.heldItem}
          formMode={canToggleMega && !showMega ? "normal" : "auto"}
          width={64}
          height={64}
          sizes="64px"
          className="size-16 shrink-0 rounded-xl object-contain [image-rendering:pixelated]"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-white">{member.name}</h3>
          <p className="mt-1 text-xs text-violet-200">{member.role}</p>
          {canToggleMega ? (
            <button
              type="button"
              aria-pressed={showMega}
              onClick={() => setShowMega((current) => !current)}
              className="mt-2 rounded-md border border-violet-300/20 bg-violet-300/[0.07] px-2 py-1 text-[10px] font-medium text-violet-200 transition hover:border-violet-300/40 hover:bg-violet-300/[0.12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            >
              {showMega ? "Show normal form" : "Show Mega form"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200/10 bg-amber-200/[0.04] px-2 py-1.5 text-xs">
        {member.heldItem ? (
          <PokemonItemImage
            itemId={toItemSlug(member.heldItem)}
            name={member.heldItem}
            width={28}
            height={28}
            sizes="28px"
            className="size-7 rounded-md object-contain [image-rendering:pixelated]"
          />
        ) : null}
        <span className="text-amber-200">{member.heldItem ?? "Held item not set"}</span>
      </div>

      <dl className="mt-4 space-y-2 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Ability</dt>
          <dd className="text-right text-slate-300">{member.ability ?? "Not set"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Nature</dt>
          <dd className="text-right text-slate-300">
            {member.nature ? `${member.nature} · ${natureEffect(member.nature)}` : "Not set"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-white/[0.07] pt-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">Moves</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {member.moves.length ? (
            member.moves.map((move) => (
              <span
                key={move}
                className={`rounded-md border border-white/10 px-1.5 py-1 text-[10px] font-medium ${getPokemonTypeColor(member.moveTypes[move] ?? "normal")}`}
              >
                {move}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">Not set</span>
          )}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">Stats</p>
        <p className="mt-1 leading-5 text-slate-400">{formatStats(member.statAllocation)}</p>
      </div>
    </article>
  );
}

function toItemSlug(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
}

function formatStats(stats: Record<string, number>) {
  const labels: Record<string, string> = { hp: "HP", attack: "Atk", defense: "Def", spAttack: "SpA", spDefense: "SpD", speed: "Spe" };
  const entries = Object.entries(stats).filter(([, value]) => value > 0).map(([key, value]) => `${labels[key] ?? key} ${value}`);
  return entries.length ? entries.join(" · ") : "No allocation set";
}

function natureEffect(nature: string) {
  const effects: Record<string, string> = { adamant: "↑ Atk / ↓ SpA", bashful: "Neutral", brave: "↑ Atk / ↓ Spe", bold: "↑ Def / ↓ Atk", calm: "↑ SpD / ↓ Atk", careful: "↑ SpD / ↓ SpA", docile: "Neutral", hasty: "↑ Spe / ↓ Def", impish: "↑ Def / ↓ SpA", jolly: "↑ Spe / ↓ SpA", lax: "↑ Def / ↓ SpD", lonely: "↑ Atk / ↓ Def", mild: "↑ SpA / ↓ Def", modest: "↑ SpA / ↓ Atk", naive: "↑ Spe / ↓ SpD", naughty: "↑ Atk / ↓ SpD", quiet: "↑ SpA / ↓ Spe", quirky: "Neutral", relaxed: "↑ Def / ↓ Spe", sassy: "↑ SpD / ↓ Spe", serious: "Neutral", timid: "↑ Spe / ↓ Atk" };
  return effects[nature.toLowerCase()] ?? "Boost unknown";
}
