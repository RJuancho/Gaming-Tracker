import Image from "next/image";
import Link from "next/link";

import { SyncTftMetaButton } from "@/app/tft/meta/sync-button";
import { getTftAssetImages } from "@/integrations/riot/assets";
import {
  getSavedTftMetaSnapshot,
  listRecentTftMetaSnapshots,
} from "@/services/tft-meta";

export const dynamic = "force-dynamic";

export default async function TftMetaPage() {
  const snapshotHistory = await listRecentTftMetaSnapshots();
  const latestSnapshot = snapshotHistory[0] ?? null;
  const meta = latestSnapshot
    ? await getSavedTftMetaSnapshot(latestSnapshot.id)
    : null;
  const unitImages = meta
    ? await getTftAssetImages(
        meta.compositions.flatMap((composition) =>
          composition.units.map((character_id) => ({
            character_id,
            itemNames: [],
            rarity: 0,
            tier: 1,
          })),
        ),
        [],
        meta.setNumber,
      )
    : { units: {} as Record<string, string | null> };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:px-12">
        <Link href="/tft" className="text-sm text-slate-400 hover:text-white">
          ← TFT profile
        </Link>
        <header className="mt-12 border-b border-white/10 pb-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                Daily ranked meta sample
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Saved compositions
              </h1>
              <p className="mt-4 max-w-2xl text-slate-400">
                The latest persisted SG2 Diamond ladder sample. New daily
                collections use a completed Philippine calendar day, deduplicate
                match IDs, and group complete final boards by active traits.
              </p>
              {meta ? (
                <p className="mt-4 text-xs text-slate-500">
                  {meta.sampleDate
                    ? formatSampleDate(meta.sampleDate)
                    : "Legacy manual sample"} · Set {meta.setNumber} · {meta.sampledPlayers} seed players
                  · {meta.sampledMatches} unique matches · saved {formatCapturedAt(meta.capturedAt)}
                </p>
              ) : null}
            </div>
            <SyncTftMetaButton enabled={process.env.NODE_ENV !== "production"} />
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 border-b border-white/10 py-6 sm:grid-cols-4">
          <SummaryMetric label="Sampled players" value={meta?.sampledPlayers ?? 0} />
          <SummaryMetric label="Matches" value={meta?.sampledMatches ?? 0} />
          <SummaryMetric label="Compositions" value={meta?.compositions.length ?? 0} />
          <SummaryMetric label="Set" value={meta?.setNumber ?? "—"} />
        </section>

        <section className="border-b border-white/10 py-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                Saved observations
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Snapshot history
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500 sm:text-right">
              The composition cards below come from the latest saved snapshot.
              Riot is contacted only when you press Sync daily meta.
            </p>
          </div>

          {latestSnapshot ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <article className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-cyan-300">
                      Latest saved
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      Snapshot #{latestSnapshot.id}
                    </p>
                  </div>
                  <span className="rounded-lg border border-white/10 bg-slate-950/40 px-2.5 py-1 font-mono text-xs text-slate-300">
                    Set {latestSnapshot.setNumber}
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-300">
                  {latestSnapshot.sampleDate
                    ? `${formatSampleDate(latestSnapshot.sampleDate)} · ${formatPatch(latestSnapshot.patch)}`
                    : `Legacy manual sample · ${formatPatch(latestSnapshot.patch)}`}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatCapturedAt(latestSnapshot.capturedAt)}
                </p>
                <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                  <SnapshotMetric
                    label="Players"
                    value={latestSnapshot.sampledPlayers}
                  />
                  <SnapshotMetric
                    label="Matches"
                    value={latestSnapshot.sampledMatches}
                  />
                  <SnapshotMetric
                    label="Comps"
                    value={latestSnapshot.compositionCount}
                  />
                </dl>
              </article>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
                <div className="border-b border-white/10 px-4 py-3 text-xs uppercase tracking-wide text-slate-500 sm:px-5">
                  Recent syncs
                </div>
                <div className="divide-y divide-white/[0.07]">
                  {snapshotHistory.map((snapshot) => (
                    <article
                      key={snapshot.id}
                      className="grid gap-3 px-4 py-3.5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-200">
                            #{snapshot.id}
                          </span>
                          <span className="text-xs text-slate-500">
                            {snapshot.sampleDate
                              ? formatSampleDate(snapshot.sampleDate)
                              : "Legacy manual"} · Set {snapshot.setNumber} · {formatPatch(snapshot.patch)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {formatCapturedAt(snapshot.capturedAt)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 sm:text-right">
                        {snapshot.sampledPlayers} players · {snapshot.sampledMatches} matches · {snapshot.compositionCount} comps
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-5 py-8 text-center text-sm text-slate-500">
              No saved meta snapshots yet. Press Sync daily meta to record the
              first observation.
            </div>
          )}
        </section>

        <section className="grid gap-4 py-10 lg:grid-cols-2">
          {meta?.compositions.map((composition, index) => (
            <article
              key={composition.signature}
              className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 transition-colors hover:border-white/20"
            >
              <div className="flex items-start gap-4 border-b border-white/[0.07] px-5 py-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 font-mono text-sm font-semibold text-cyan-200">
                  #{index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold text-white">
                    {composition.traits.length > 0
                      ? composition.traits.slice(0, 3).map(formatIdentifier).join(" · ")
                      : composition.units.slice(0, 3).map(formatIdentifier).join(" · ")}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {composition.games} games in sampled final boards
                  </p>
                </div>
                <span className={`shrink-0 rounded-lg border px-2.5 py-1.5 font-mono text-xs ${getTopFourStyle(composition.topFours / composition.games)}`}>
                  {(composition.topFours / composition.games * 100).toFixed(0)}% top 4
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 px-5 py-5 sm:grid-cols-6">
                {composition.units.map((unit) => (
                  <div
                    key={unit}
                    className="min-w-0 rounded-xl border border-white/[0.07] bg-slate-950/70 p-2 text-center"
                    title={formatIdentifier(unit)}
                  >
                    {unitImages.units[unit] ? (
                      <Image
                        src={unitImages.units[unit]!}
                        alt={`${formatIdentifier(unit)} icon`}
                        width={48}
                        height={48}
                        className="mx-auto size-12 rounded-lg object-cover ring-1 ring-white/10"
                        unoptimized
                      />
                    ) : (
                      <div className="mx-auto size-12 rounded-lg bg-slate-800" />
                    )}
                    <p className="mt-1.5 truncate text-[10px] text-slate-300">
                      {formatIdentifier(unit)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 border-t border-white/[0.07] bg-slate-950/30">
                <CompositionMetric label="Games" value={composition.games} />
                <CompositionMetric label="Wins" value={composition.wins} />
                <CompositionMetric label="Avg. place" value={composition.averagePlacement} />
              </div>
              <div className="flex flex-wrap gap-1.5 border-t border-white/[0.07] px-5 py-3">
                {composition.traits.slice(0, 6).map((trait) => (
                  <span
                    key={trait}
                    className="rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-1 text-[10px] text-slate-400"
                  >
                    {formatIdentifier(trait)}
                  </span>
                ))}
              </div>
            </article>
          ))}
          {!meta ? (
            <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-5 py-12 text-center text-sm text-slate-500">
              No saved TFT meta data is available yet.
            </div>
          ) : null}
        </section>

        <p className="border-t border-white/10 py-6 text-xs leading-5 text-slate-500">
          This remains a bounded sample, not a complete server-wide ranking. It
          uses Riot match data and Riot Data Dragon artwork, deduplicates match
          IDs, and keeps requests within a personal-project-sized budget.
        </p>
      </div>
    </main>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function CompositionMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r border-white/[0.07] px-4 py-3 text-center last:border-r-0">
      <p className="text-[10px] uppercase tracking-wide text-slate-600">{label}</p>
      <p className="mt-1 font-mono text-sm text-slate-200">{value}</p>
    </div>
  );
}

function SnapshotMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-sm text-white">{value}</dd>
    </div>
  );
}

function getTopFourStyle(rate: number) {
  if (rate >= 0.6) return "border-emerald-300/25 bg-emerald-300/10 text-emerald-200";
  if (rate >= 0.5) return "border-cyan-300/25 bg-cyan-300/10 text-cyan-200";
  return "border-slate-500/25 bg-slate-500/10 text-slate-300";
}

function formatIdentifier(value: string) {
  return value
    .replace(/^DA_(18_)?/, "")
    .replace(/18$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ");
}

function formatPatch(value: string) {
  return value.includes("?.?.?.?")
    ? "Patch unavailable from Riot"
    : value.replace(/^TFT\s+/, "").replace(/^Version\s+/, "");
}

function formatCapturedAt(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(value);
}

function formatSampleDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00+08:00`));
}

