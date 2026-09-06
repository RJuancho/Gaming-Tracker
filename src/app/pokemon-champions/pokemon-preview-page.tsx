import Link from "next/link";

import {
  getChampionsMetaHistory,
  getChampionsPokemon,
  getCurrentChampionsMeta,
  type ChampionsBattleStats,
  type MetaCategory,
  type MetaRanking,
} from "@/integrations/pokemon/champions/provider";
import {
  getPokemonItemSpriteCandidates,
  getPokemonSpriteCandidates,
} from "@/integrations/pokemon/assets";
import {
  getMoveReference,
  getPokemonAvailability,
  getPokemonReference,
} from "@/integrations/pokemon/pokeapi/provider";

import { PokemonAssetImage, PokemonSpriteImage } from "./pokemon-asset-image";

export const dynamic = "force-dynamic";

const categories: Array<{ key: MetaCategory; label: string }> = [
  { key: "move", label: "Moves" },
  { key: "held_item", label: "Held items" },
  { key: "ability", label: "Abilities" },
  { key: "teammate", label: "Teammates" },
];

const categoryStyles: Record<
  MetaCategory,
  { accent: string; glow: string; label: string }
> = {
  move: {
    accent: "text-cyan-200",
    glow: "from-cyan-400/15",
    label: "Battle options",
  },
  held_item: {
    accent: "text-amber-200",
    glow: "from-amber-400/15",
    label: "Equipment",
  },
  ability: {
    accent: "text-fuchsia-200",
    glow: "from-fuchsia-400/15",
    label: "Passive effects",
  },
  teammate: {
    accent: "text-emerald-200",
    glow: "from-emerald-400/15",
    label: "Team partners",
  },
  stat_alignment: {
    accent: "text-violet-200",
    glow: "from-violet-400/15",
    label: "Build direction",
  },
  stat_points: {
    accent: "text-blue-200",
    glow: "from-blue-400/15",
    label: "Point investment",
  },
};

const statLabels: Array<{ key: keyof ChampionsBattleStats; label: string }> = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "sp_attack", label: "Sp. Atk" },
  { key: "sp_defense", label: "Sp. Def" },
  { key: "speed", label: "Speed" },
];

export default async function PokemonPreviewPage({ pokemonId }: { pokemonId: string }) {
  const [pokemon, currentMeta, history, reference, availability] = await Promise.all([
    getChampionsPokemon(pokemonId, "Doubles"),
    getCurrentChampionsMeta(pokemonId, "Doubles"),
    getChampionsMetaHistory(pokemonId, "Doubles", 7),
    getPokemonReference(pokemonId),
    getPokemonAvailability(pokemonId),
  ]);
  const rankingVisuals = await getRankingVisuals(currentMeta.rankings);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:px-12">
        <Link
          href="/pokemon-champions"
          className="text-sm text-slate-400 transition-colors hover:text-white"
        >
          ← Pokémon Champions dashboard
        </Link>

        <header className="mt-12 flex flex-col gap-8 border-b border-white/10 pb-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-violet-200">
                Community data
              </span>
              <span className="text-slate-500">
                {pokemon.format} · {currentMeta.season} · Pokédex #
                {reference.nationalDexNumber}
              </span>
            </div>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
              {pokemon.name}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
              An initial Pokémon Champions meta preview using current and recent
              historical battle data.
            </p>
          </div>

          <div className="grid size-40 shrink-0 place-items-center rounded-3xl border border-violet-300/15 bg-violet-300/[0.06]">
            <PokemonSpriteImage
              pokemonId={pokemonId}
              name={pokemon.name}
              width={128}
              height={128}
              sizes="128px"
              priority
              className="size-32 rounded-2xl object-contain [image-rendering:pixelated]"
            />
          </div>
        </header>

        <div className="mt-6 flex justify-end">
          <Link
            href="/pokemon-champions/teams"
            className="rounded-xl border border-violet-300/25 bg-violet-300/10 px-4 py-2.5 text-sm font-medium text-violet-100 transition-colors hover:bg-violet-300/15"
          >
            Build a team with {pokemon.name} →
          </Link>
        </div>

        <section className="py-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">
                Champions baseline
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Battle stats</h2>
            </div>
            <span className="text-sm text-slate-500">
              Type: {pokemon.types.join(" / ")}
            </span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {statLabels.map((stat) => (
              <div
                key={stat.key}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-5 transition-colors hover:border-violet-300/25"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {pokemon.baselineBattleStats[stat.key]}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            These are Champions baseline battle values, not canonical species
            base stats.
          </p>
        </section>

        <section className="border-t border-white/10 py-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">
            Source games
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Where to obtain {pokemon.name}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Confirmed encounter records, regional Pokédex coverage, and documented form-specific acquisition paths. Pokémon HOME transfers may make this Pokémon usable in additional compatible games.
          </p>
          {availability.games.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availability.games.map((game) => (
                <article key={game.gameId} className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4">
                  <h3 className="font-semibold text-white">{game.gameName}</h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {game.methods.map((method) => (
                      <span key={method} className="rounded-md border border-white/[0.07] bg-slate-950/50 px-2 py-1 text-[11px] text-emerald-100/80">
                        {method}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-slate-400">
              No acquisition or modern-game Pokédex record is currently available for this form. It may require evolution, transfer, an event, or another game-specific method.
            </p>
          )}
          <p className="mt-4 max-w-3xl text-xs leading-5 text-slate-500">{availability.sourceNote}</p>
        </section>

        <section className="border-t border-white/10 py-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">
            Current meta
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Leading choices</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {categories.map((category) => (
              <RankingCard
                key={category.key}
                title={category.label}
                rankings={currentMeta.rankings
                  .filter((ranking) => ranking.category === category.key)
                  .slice(0, 3)}
                visuals={rankingVisuals}
              />
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <NatureCard
              rankings={currentMeta.rankings
                .filter((ranking) => ranking.category === "stat_alignment")
                .slice(0, 4)}
            />
            <AllocationCard
              rankings={currentMeta.rankings
                .filter((ranking) => ranking.category === "stat_points")
                .slice(0, 4)}
            />
          </div>

          <p className="mt-4 max-w-3xl text-xs leading-5 text-slate-500">
            Natures and stat allocations are separate aggregate rankings. The
            source does not identify which nature, moves, item, and allocation
            were used together, so these are build signals rather than complete
            recommended sets.
          </p>
        </section>

        <section className="border-t border-white/10 py-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">
            Historical availability
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Recent snapshots</h2>
          <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
            {history.map((snapshot) => (
              <div
                key={`${snapshot.season}-${snapshot.snapshotDate}`}
                className="flex items-center justify-between border-b border-white/10 px-5 py-4 last:border-b-0"
              >
                <span className="text-sm text-slate-300">
                  {snapshot.snapshotDate}
                </span>
                <span className="text-xs text-slate-500">
                  Season {snapshot.season} · {snapshot.rankings.length} entries
                </span>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 py-6 text-xs leading-5 text-slate-500">
          Meta data supplied by the fan-made Champions Battle Data project.
          Reference sprite supplied through{" "}
          <a
            href="https://pokeapi.co/"
            className="text-slate-400 underline decoration-white/20 underline-offset-2 hover:text-white"
          >
            PokéAPI
          </a>
          . This personal, non-commercial project is not affiliated with or
          endorsed by Pokémon, Nintendo, Game Freak, or Creatures. Meta source:{" "}
          {currentMeta.source}
        </footer>
      </div>
    </main>
  );
}

function RankingCard({
  title,
  rankings,
  visuals,
}: {
  title: string;
  rankings: MetaRanking[];
  visuals: Record<string, RankingVisual>;
}) {
  const category = rankings[0]?.category ?? "move";
  const style = categoryStyles[category];

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${style.glow} to-white/[0.025] p-5 shadow-xl shadow-black/10 transition-colors hover:border-white/20 sm:p-6`}
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${style.accent}`}
          >
            {style.label}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
        </div>
        <span className="font-mono text-[10px] text-slate-600">TOP 3</span>
      </div>
      <ol className="mt-5 space-y-2">
        {rankings.map((ranking) => (
          <li
            key={`${ranking.category}-${ranking.rank}`}
            className="group/row relative overflow-hidden rounded-xl border border-white/[0.06] bg-slate-950/35 px-3 py-3 text-sm transition-colors hover:bg-slate-900/70"
          >
            {ranking.percentage !== null ? (
              <span
                className="absolute inset-y-0 left-0 bg-white/[0.035]"
                style={{ width: `${Math.min(ranking.percentage, 100)}%` }}
              />
            ) : null}
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] font-mono text-[10px] text-slate-500">
                  {ranking.rank}
                </span>
                <RankingImage
                  visual={visuals[getVisualKey(ranking)]}
                  name={ranking.name}
                />
                <span className="truncate font-medium text-slate-200">
                  {ranking.name ?? "Not provided"}
                </span>
              </div>
              <span className="shrink-0 rounded-md border border-white/[0.06] bg-slate-950/50 px-2 py-1 font-mono text-[11px] text-slate-400">
                {formatPercentage(ranking.percentage)}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}

type RankingVisual = {
  imageSources?: string[];
  moveType?: string;
};

function RankingImage({
  visual,
  name,
}: {
  visual: RankingVisual | undefined;
  name: string | null;
}) {
  if (visual?.moveType) {
    return (
      <span
        className={`min-w-14 rounded-lg border border-white/10 px-2 py-1.5 text-center text-[9px] font-bold uppercase tracking-wider shadow-sm ${getTypeColor(visual.moveType)}`}
      >
        {visual.moveType}
      </span>
    );
  }

  if (visual?.imageSources?.length) {
    return (
      <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.05] shadow-inner shadow-white/[0.03]">
        <PokemonAssetImage
          sources={visual.imageSources}
          alt={name ? `${name} sprite` : "Reference sprite"}
          width={40}
          height={40}
          sizes="40px"
          className="size-10 object-contain drop-shadow-md [image-rendering:pixelated]"
        />
      </span>
    );
  }

  return null;
}

async function getRankingVisuals(rankings: MetaRanking[]) {
  const visibleRankings = rankings.filter(
    (ranking) =>
      ranking.rank <= 3 &&
      ranking.name &&
      ["move", "held_item", "teammate"].includes(ranking.category),
  );
  const entries = await Promise.all(
    visibleRankings.map(async (ranking) => {
      const slug = toPokeApiSlug(ranking.name ?? "");

      try {
        if (ranking.category === "move") {
          const move = await getMoveReference(slug);
          return [getVisualKey(ranking), { moveType: move.type }] as const;
        }

        if (ranking.category === "held_item") {
          return [
            getVisualKey(ranking),
            { imageSources: getPokemonItemSpriteCandidates(slug) },
          ] as const;
        }

        return [
          getVisualKey(ranking),
          {
            imageSources: getPokemonSpriteCandidates(
              slug,
              ranking.name ?? slug,
            ),
          },
        ] as const;
      } catch {
        return [getVisualKey(ranking), {}] as const;
      }
    }),
  );

  return Object.fromEntries(entries) as Record<string, RankingVisual>;
}

function getVisualKey(ranking: MetaRanking) {
  return `${ranking.category}:${ranking.name ?? ""}`;
}

function toPokeApiSlug(value: string) {
  return value.toLowerCase().replaceAll(" ", "-").replaceAll("'", "");
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    normal: "bg-slate-500/25 text-slate-200",
    fire: "bg-orange-500/25 text-orange-200",
    water: "bg-blue-500/25 text-blue-200",
    electric: "bg-yellow-400/25 text-yellow-100",
    grass: "bg-emerald-500/25 text-emerald-200",
    ice: "bg-cyan-400/25 text-cyan-100",
    fighting: "bg-red-500/25 text-red-200",
    poison: "bg-purple-500/25 text-purple-200",
    ground: "bg-amber-500/25 text-amber-200",
    flying: "bg-indigo-400/25 text-indigo-200",
    psychic: "bg-pink-500/25 text-pink-200",
    bug: "bg-lime-500/25 text-lime-200",
    rock: "bg-stone-500/25 text-stone-200",
    ghost: "bg-violet-500/25 text-violet-200",
    dragon: "bg-indigo-600/30 text-indigo-200",
    dark: "bg-zinc-700/60 text-zinc-200",
    steel: "bg-slate-400/25 text-slate-200",
    fairy: "bg-fuchsia-400/25 text-fuchsia-200",
  };

  return colors[type] ?? colors.normal;
}

function NatureCard({ rankings }: { rankings: MetaRanking[] }) {
  const style = categoryStyles.stat_alignment;

  return (
    <article
      className={`rounded-2xl border border-white/10 bg-gradient-to-br ${style.glow} to-white/[0.025] p-5 shadow-xl shadow-black/10 sm:p-6`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`text-[10px] uppercase tracking-[0.18em] ${style.accent}`}>
            {style.label}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Preferred natures
          </h3>
        </div>
        <span className="font-mono text-[10px] text-slate-600">TOP 4</span>
      </div>
      <ol className="mt-5 grid grid-cols-2 gap-2">
        {rankings.map((ranking) => (
          <li
            key={`${ranking.category}-${ranking.rank}`}
            className="rounded-xl border border-white/[0.06] bg-slate-950/35 p-3 text-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-medium text-slate-200">
                  {ranking.name}
                </span>
                {ranking.statChange ? (
                  <p className="mt-1 text-[11px] text-slate-500">
                    <span className="text-emerald-300/80">
                      +{ranking.statChange.increased}
                    </span>{" "}
                    ·{" "}
                    <span className="text-rose-300/70">
                      −{ranking.statChange.decreased}
                    </span>
                  </p>
                ) : null}
              </div>
              <span className="font-mono text-[10px] text-slate-500">
                #{ranking.rank}
              </span>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-violet-300/60"
                style={{ width: `${ranking.percentage ?? 0}%` }}
              />
            </div>
            <p className="mt-1.5 font-mono text-[10px] text-slate-500">
              {formatPercentage(ranking.percentage)}
            </p>
          </li>
        ))}
      </ol>
    </article>
  );
}

function AllocationCard({ rankings }: { rankings: MetaRanking[] }) {
  const style = categoryStyles.stat_points;

  return (
    <article
      className={`rounded-2xl border border-white/10 bg-gradient-to-br ${style.glow} to-white/[0.025] p-5 shadow-xl shadow-black/10 sm:p-6`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`text-[10px] uppercase tracking-[0.18em] ${style.accent}`}>
            {style.label}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Stat allocations
          </h3>
        </div>
        <span className="font-mono text-[10px] text-slate-600">TOP 4</span>
      </div>
      <ol className="mt-5 space-y-2">
        {rankings.map((ranking) => (
          <li
            key={`${ranking.category}-${ranking.rank}`}
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-slate-950/35 p-3 text-sm"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-blue-300/10 font-mono text-[10px] text-blue-200">
              {ranking.rank}
            </span>
            <p className="min-w-0 flex-1 text-xs font-medium text-slate-300">
              {formatStatAllocation(ranking)}
            </p>
            <span className="rounded-md bg-white/[0.04] px-2 py-1 font-mono text-[10px] text-slate-500">
              {formatPercentage(ranking.percentage)}
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function formatStatAllocation(ranking: MetaRanking) {
  if (!ranking.statAllocation) {
    return "Not provided";
  }

  const labels: Record<keyof ChampionsBattleStats, string> = {
    hp: "HP",
    attack: "Atk",
    defense: "Def",
    sp_attack: "SpA",
    sp_defense: "SpD",
    speed: "Spe",
  };

  return Object.entries(ranking.statAllocation)
    .filter(([, points]) => points > 0)
    .map(
      ([stat, points]) =>
        `${labels[stat as keyof ChampionsBattleStats]} ${points}`,
    )
    .join(" / ");
}

function formatPercentage(value: number | null) {
  return value === null ? "Rank only" : `${value.toFixed(1)}%`;
}
