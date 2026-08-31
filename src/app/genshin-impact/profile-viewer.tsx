"use client";

import Image from "next/image";
import { useState } from "react";

import type {
  GenshinArtifact,
  GenshinCharacterBuild,
  GenshinDisplayStat,
  GenshinProfile,
  GenshinWeapon,
} from "@/integrations/genshin/enka";

export function GenshinProfileViewer() {
  const [uid, setUid] = useState("");
  const [profile, setProfile] = useState<GenshinProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/genshin/profile?uid=${uid}`);
      const payload = await response.json();
      if (!response.ok) setError(payload.error ?? "Profile lookup failed.");
      else setProfile(payload);
    } catch {
      setError("Profile lookup failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-violet-300">In-site builds</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">Showcase characters</h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input inputMode="numeric" value={uid} onChange={(event) => setUid(event.target.value.replace(/\D/g, ""))} placeholder="Enter your 9-digit UID" className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-violet-300/50" />
        <button type="button" onClick={load} disabled={loading || uid.length !== 9} className="rounded-xl bg-violet-300 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-violet-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
          {loading ? "Loading…" : "Load builds"}
        </button>
      </div>
      {error ? <p className="mt-4 rounded-lg border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">{error}</p> : null}
      {profile ? (
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-white">{profile.nickname ?? "Genshin showcase"}</h3>
          <p className="mt-1 text-xs text-slate-500">Adventure Rank {profile.level ?? "—"} · World Level {profile.worldLevel ?? "—"}</p>
          <div className="mt-4 space-y-4">
            {profile.characters.map((character, index) => <CharacterCard key={character.avatarId} character={character} index={index} />)}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CharacterCard({ character, index }: { character: GenshinCharacterBuild; index: number }) {
  const setCounts = countArtifactSets(character.artifacts);
  return (
    <details className="group rounded-2xl border border-white/[0.08] bg-slate-950/60 p-4 sm:p-5">
      <summary className="flex cursor-pointer list-none items-center gap-4 [&::-webkit-details-marker]:hidden">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-violet-300/10">
          {character.iconUrl ? <CharacterImage src={character.iconUrl} name={character.name ?? "Character"} /> : <span className="font-bold text-violet-200">{index + 1}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold text-white">{character.name ?? `Showcase character ${index + 1}`}</span>
          <span className="mt-1 block text-xs text-slate-400">Level {character.level ?? "Unavailable"} · Constellation {character.constellation}{character.friendship !== null ? ` · Friendship ${character.friendship}` : ""}</span>
        </span>
        <span className="text-sm text-violet-200 transition group-open:rotate-180">⌄</span>
      </summary>

      <div className="mt-5 border-t border-white/[0.07] pt-5">
        <SectionLabel>Key stats</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {character.keyStats.map((stat) => <StatTile key={stat.key} stat={stat} />)}
        </div>
        {character.detailedStats.length ? (
          <details className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <summary className="cursor-pointer text-xs text-slate-400">Detailed stats</summary>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{character.detailedStats.map((stat) => <StatTile key={stat.key} stat={stat} compact />)}</div>
          </details>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>Artifacts</SectionLabel>
          <div className="flex flex-wrap gap-1.5">{[...setCounts].filter(([, count]) => count >= 2).map(([name, count]) => <span key={name} className="rounded-full border border-amber-300/15 bg-amber-300/[0.05] px-2 py-1 text-[10px] text-amber-100">{name} · {count}-piece</span>)}</div>
        </div>
        {character.artifacts.length ? <div className="mt-3 grid gap-3 lg:grid-cols-2">{character.artifacts.map((artifact) => <ArtifactCard key={artifact.itemId} artifact={artifact} />)}</div> : <p className="mt-3 text-sm text-slate-500">No artifact data is available.</p>}

        <div className="mt-6"><SectionLabel>Weapon</SectionLabel></div>
        <div className="mt-3">{character.weapon ? <WeaponCard weapon={character.weapon} /> : <p className="text-sm text-slate-500">No weapon data is available.</p>}</div>
      </div>
    </details>
  );
}

function ArtifactCard({ artifact }: { artifact: GenshinArtifact }) {
  return (
    <article className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <EquipmentImage src={artifact.iconUrl} alt={artifact.name ?? artifact.setName ?? "Artifact"} />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-white">{artifact.name ?? artifact.setName ?? "Unknown Artifact"}</h4>
          {artifact.setName && artifact.setName !== artifact.name ? <p className="mt-0.5 truncate text-[11px] text-amber-200/80">{artifact.setName}</p> : null}
          <p className="mt-1 text-xs text-slate-500">{artifact.slot} · +{artifact.level ?? "—"}</p>
        </div>
      </div>
      {artifact.mainStat ? <div className="mt-3 rounded-lg border border-violet-300/10 bg-violet-300/[0.04] px-3 py-2"><p className="text-[9px] uppercase tracking-wider text-slate-500">Main stat</p><p className="mt-1 flex justify-between gap-3 text-xs"><span className="text-slate-300">{artifact.mainStat.label}</span><strong className="text-violet-100">{artifact.mainStat.value}</strong></p></div> : null}
      {artifact.substats.length ? <div className="mt-3"><p className="text-[9px] uppercase tracking-wider text-slate-500">Substats</p><dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">{artifact.substats.map((stat) => <div key={`${stat.key}-${stat.value}`} className="flex justify-between gap-2 text-[11px]"><dt className="truncate text-slate-400">{stat.label}</dt><dd className="shrink-0 text-slate-200">{stat.value}</dd></div>)}</dl></div> : null}
    </article>
  );
}

function WeaponCard({ weapon }: { weapon: GenshinWeapon }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-amber-300/10 bg-amber-300/[0.035] p-4 sm:flex-row sm:items-center">
      <EquipmentImage src={weapon.iconUrl} alt={weapon.name ?? "Weapon"} large />
      <div className="min-w-0 flex-1">
        <h4 className="font-semibold text-white">{weapon.name ?? "Unknown Weapon"}</h4>
        <p className="mt-1 text-xs text-slate-400">Level {weapon.level ?? "—"}{weapon.refinement !== null ? ` · Refinement ${weapon.refinement}` : ""}</p>
        {weapon.stats.length ? <div className="mt-2 flex flex-wrap gap-2">{weapon.stats.map((stat) => <span key={stat.key} className="rounded-md border border-white/[0.06] px-2 py-1 text-[10px] text-slate-300">{stat.label} {stat.value}</span>)}</div> : null}
      </div>
    </article>
  );
}

function StatTile({ stat, compact = false }: { stat: GenshinDisplayStat; compact?: boolean }) {
  return <div className={`rounded-lg border border-white/[0.06] bg-white/[0.025] ${compact ? "p-2" : "p-3"}`}><p className="truncate text-[10px] uppercase tracking-wide text-slate-500">{stat.label}</p><p className="mt-1 font-mono text-sm font-semibold text-white">{stat.value}</p></div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">{children}</p>;
}

function EquipmentImage({ src, alt, large = false }: { src: string | null; alt: string; large?: boolean }) {
  const size = large ? 64 : 48;
  return <span className={`${large ? "size-16" : "size-12"} grid shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-slate-900`}>{src ? <Image src={src} alt={alt} width={size} height={size} className="size-full object-contain" unoptimized /> : <span className="text-lg text-slate-600">◇</span>}</span>;
}

function CharacterImage({ src, name }: { src: string; name: string }) {
  return <Image src={src} alt={`${name} portrait`} width={56} height={56} className="size-14 object-cover" unoptimized onError={(event) => { const image = event.currentTarget; const attempt = Number(image.dataset.fallback ?? "0"); const next = attempt === 0 ? image.src.replace("_Card.png", ".png") : attempt === 1 ? image.src.replace(".png", "_Circle.png") : ""; if (next) { image.dataset.fallback = String(attempt + 1); image.src = next; } }} />;
}

function countArtifactSets(artifacts: GenshinArtifact[]) {
  const counts = new Map<string, number>();
  for (const artifact of artifacts) if (artifact.setName) counts.set(artifact.setName, (counts.get(artifact.setName) ?? 0) + 1);
  return counts;
}
