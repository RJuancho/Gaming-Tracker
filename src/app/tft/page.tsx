import Link from "next/link";

import Image from "next/image";
import { getRiotAccountByRiotId } from "@/integrations/riot/account";
import {
  getTftAssetImages,
  type TftAssetImages,
} from "@/integrations/riot/assets";
import { personalRiotProfile } from "@/integrations/riot/profile";
import { getCurrentTftMeta } from "@/services/tft-meta";
import {
  getPersonalTftMatch,
  getRecentTftMatchIds,
  getTftLeagueEntries,
  type PersonalTftMatch,
  type TftLeagueEntry,
  type TftTrait,
  type TftUnit,
} from "@/integrations/riot/tft";

export const dynamic = "force-dynamic";

export default async function TftProfilePage() {
  if (!personalRiotProfile.gameName || !personalRiotProfile.tagLine) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100 sm:px-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-7">
          <Link href="/" className="text-sm text-slate-400 hover:text-white">← Gaming Tracker</Link>
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-amber-300">TFT profile setup</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Add your Riot profile locally</h1>
          <p className="mt-4 leading-7 text-slate-400">Set <code className="text-slate-200">RIOT_GAME_NAME</code> and <code className="text-slate-200">RIOT_TAG_LINE</code> in <code className="text-slate-200">.env.local</code>, then restart the development server. Your account values are intentionally not committed.</p>
        </div>
      </main>
    );
  }

  let account;
  try {
    account = await getRiotAccountByRiotId({
      gameName: personalRiotProfile.gameName,
      tagLine: personalRiotProfile.tagLine,
      region: personalRiotProfile.accountRegion,
    });
  } catch (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100 sm:px-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-7">
          <Link href="/" className="text-sm text-slate-400 hover:text-white">← Gaming Tracker</Link>
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-amber-300">TFT temporarily unavailable</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Riot API rate limit reached</h1>
          <p className="mt-4 leading-7 text-slate-400">{error instanceof Error ? error.message : "Riot temporarily refused the request."} Wait for the development-key limit to reset, then refresh. Meta sampling is bounded and cached to reduce requests.</p>
        </div>
      </main>
    );
  }
  const [leagueEntries, matchIds] = await Promise.all([
    getTftLeagueEntries(account.puuid, personalRiotProfile.platform).catch(() => []),
    getRecentTftMatchIds(account.puuid, 10, personalRiotProfile.matchRegion).catch(() => []),
  ]);
  const diamondMeta = await getCurrentTftMeta().catch(() => ({ itemizations: [] }));
  const recentMatches = (
    await Promise.all(
      matchIds.map(async (matchId) => {
        try {
          return await getPersonalTftMatch(
            matchId,
            account.puuid,
            personalRiotProfile.matchRegion,
          );
        } catch {
          return null;
        }
      }),
    )
  ).filter((match): match is NonNullable<typeof match> => match !== null);
  const latestMatch = recentMatches[0] ?? null;
  const assetImages = latestMatch
    ? await getTftAssetImages(
        recentMatches.flatMap((match) => match.units),
        recentMatches.flatMap((match) => match.activeTraits),
        latestMatch.setNumber,
      )
    : null;
  const rankedEntry = leagueEntries.find(
    (entry) => entry.queueType === "RANKED_TFT",
  );
  const mostPlayedUnit = findMostPlayed(
    recentMatches.map((match) =>
      match.units
        .filter(
          (unit) =>
            assetImages?.unitCosts[unit.character_id] !== null &&
            assetImages?.unitCosts[unit.character_id] !== undefined,
        )
        .map((unit) => unit.character_id),
    ),
  );
  const mostPlayedTrait = findMostPlayed(
    recentMatches.map((match) =>
      match.activeTraits.map((trait) => trait.name),
    ),
  );
  const mostPlayedUnitName = mostPlayedUnit
    ? assetImages?.unitNames[mostPlayedUnit.id] ??
      formatIdentifier(mostPlayedUnit.id)
    : null;
  const mostPlayedUnitMatches = mostPlayedUnit
    ? recentMatches.filter((match) =>
        match.units.some(
          (unit) => unit.character_id === mostPlayedUnit.id,
        ),
      )
    : [];
  const bestMostPlayedUnitMatch = mostPlayedUnitMatches.reduce<
    PersonalTftMatch | null
  >(
    (best, match) =>
      best === null || match.placement < best.placement ? match : best,
    null,
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:px-12">
        <Link
          href="/"
          className="text-sm text-slate-400 transition-colors hover:text-white"
        >
          ← Gaming Tracker
        </Link>

        <header className="mt-12 flex flex-col gap-8 border-b border-white/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-cyan-200">
                Official Riot data
              </span>
              <span className="text-slate-500">SG2 · Ranked TFT</span>
            </div>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
              {account.gameName}
              <span className="text-slate-600">#{account.tagLine}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
              Personal ranked progress and recent match performance from the
              official Teamfight Tactics API.
            </p>
          </div>
          <RankCard entry={rankedEntry} />
        </header>

        <div className="mt-6 flex justify-end">
          <Link
            href="/tft/meta"
            className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-300/15"
          >
            Explore current meta →
          </Link>
        </div>

        {latestMatch ? (
          <>
            <section className="py-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                    Latest ranked match
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">
                    {formatPlacement(latestMatch.placement)} place
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {formatPlayedAt(latestMatch.playedAt)} · Set{" "}
                    {latestMatch.setNumber}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-slate-400">
                  {latestMatch.matchId}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard
                  label="Duration"
                  value={formatDuration(latestMatch.durationSeconds)}
                />
                <MetricCard label="Final level" value={latestMatch.level} />
                <MetricCard label="Last round" value={latestMatch.lastRound} />
                <MetricCard label="Gold left" value={latestMatch.goldLeft} />
              </div>
            </section>

            <section className="border-t border-white/10 py-10">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                Recent tendencies
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-2xl font-semibold text-white">
                  Most played
                </h2>
                <p className="text-sm text-slate-500">
                  Presence across your last {recentMatches.length} ranked games
                </p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <TendencyCard
                  label="Unit"
                  entry={mostPlayedUnit}
                  totalGames={recentMatches.length}
                  imageUrl={
                    mostPlayedUnit
                      ? assetImages?.units[mostPlayedUnit.id] ?? null
                      : null
                  }
                  imageStyle="portrait"
                  displayName={
                    mostPlayedUnitName
                  }
                  cost={
                    mostPlayedUnit
                      ? assetImages?.unitCosts[mostPlayedUnit.id] ?? null
                      : null
                  }
                />
                <TendencyCard
                  label="Active trait"
                  entry={mostPlayedTrait}
                  totalGames={recentMatches.length}
                  imageUrl={
                    mostPlayedTrait
                      ? assetImages?.traits[mostPlayedTrait.id] ?? null
                      : null
                  }
                  imageStyle="icon"
                />
              </div>
              {bestMostPlayedUnitMatch && mostPlayedUnit && assetImages ? (
                <BestUnitComposition
                  match={bestMostPlayedUnitMatch}
                  unitName={mostPlayedUnitName ?? formatIdentifier(mostPlayedUnit.id)}
                  matchingGames={mostPlayedUnitMatches}
                  assetImages={assetImages}
                />
              ) : null}
              {mostPlayedUnit ? <FavoriteUnitItemization unitId={mostPlayedUnit.id} unitName={mostPlayedUnitName ?? formatIdentifier(mostPlayedUnit.id)} itemizations={diamondMeta.itemizations} itemImages={assetImages?.items ?? {}} /> : null}
            </section>

            <section className="border-t border-white/10 py-10">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                Final composition
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Board</h2>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {latestMatch.units.map((unit, index) => (
                  <UnitCard
                    key={`${unit.character_id}-${index}`}
                    unit={unit}
                    imageUrl={assetImages?.units[unit.character_id] ?? null}
                    itemImages={assetImages?.items ?? {}}
                  />
                ))}
              </div>
            </section>

            <section className="border-t border-white/10 py-10">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                Final synergies
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Active traits
              </h2>
              <div className="mt-6 flex flex-wrap gap-3">
                {latestMatch.activeTraits.map((trait) => (
                  <TraitCard
                    key={trait.name}
                    trait={trait}
                    imageUrl={assetImages?.traits[trait.name] ?? null}
                  />
                ))}
              </div>
            </section>

            <section className="border-t border-white/10 py-8">
              <h2 className="text-sm font-semibold text-slate-300">
                Data-quality note
              </h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">
                Riot’s Set 18 Unreal response does not currently provide a
                usable patch version, augment list, player damage, or
                elimination count for this match. Those fields are treated as
                unavailable instead of displaying misleading zero values.
              </p>
            </section>
          </>
        ) : (
          <section className="py-20 text-center text-slate-400">
            Riot returned no TFT matches for this account.
          </section>
        )}

        {recentMatches.length > 0 ? (
          <section className="border-t border-white/10 py-10">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
              Recent history
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Last {recentMatches.length} ranked games
            </h2>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <div className="divide-y divide-white/10">
                {recentMatches.map((match) => (
                  <article
                    key={match.matchId}
                    className="bg-slate-900/70 px-4 py-4 transition-colors hover:bg-slate-800/70 sm:px-5"
                  >
                    <div className="flex gap-4">
                      <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border ${getPlacementStyle(match.placement)}`}>
                        <p className="text-lg font-bold leading-none">
                          {match.placement}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-wide opacity-75">
                          place
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium text-white">Ranked TFT</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatPlayedAt(match.playedAt)} · Set {match.setNumber}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                            <span>Level {match.level}</span>
                            <span>{formatDuration(match.durationSeconds)}</span>
                            <span className="font-mono text-slate-600">{match.matchId}</span>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                          {match.units.map((unit, index) => (
                            <div
                              key={`${match.matchId}-${unit.character_id}-${index}`}
                              className="group min-w-0 rounded-xl border border-white/[0.07] bg-slate-950/70 p-2.5 text-center transition-colors hover:border-cyan-300/25 hover:bg-slate-900"
                              title={unit.itemNames.length > 0 ? unit.itemNames.join(", ") : "No items"}
                            >
                              <div className="flex min-w-0 flex-col items-center">
                                <div className="relative mb-3">
                                  {assetImages?.units[unit.character_id] ? (
                                    <Image
                                      src={assetImages.units[unit.character_id]!}
                                      alt=""
                                      width={56}
                                      height={56}
                                      className="size-14 rounded-lg object-cover ring-1 ring-white/15"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="size-14 rounded-lg bg-slate-800" />
                                  )}
                                  {unit.itemNames.length > 0 ? (
                                    <div className="absolute -bottom-2 left-1/2 flex w-max -translate-x-1/2 items-center justify-center gap-0.5 rounded-md bg-slate-950/95 p-0.5 shadow-lg ring-1 ring-white/10">
                                      {unit.itemNames.map((itemName, itemIndex) =>
                                        assetImages?.items[itemName] ? (
                                          <Image
                                            key={`${itemName}-${itemIndex}`}
                                            src={assetImages.items[itemName]!}
                                            alt={formatIdentifier(itemName)}
                                            title={formatIdentifier(itemName)}
                                            width={20}
                                            height={20}
                                            className="size-5 rounded-sm object-cover"
                                            unoptimized
                                          />
                                        ) : null,
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                                <span className="min-w-0 max-w-full truncate text-[11px] text-slate-200">
                                  {formatIdentifier(unit.character_id)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <footer className="border-t border-white/10 py-6 text-xs leading-5 text-slate-500">
          This personal project uses official Riot API data and is not endorsed
          by Riot Games. Internal Set 18 names are formatted for readability.
          Standard assets use Riot Data Dragon, with neutral Set 18 units
          covered by verified CommunityDragon artwork paths.
        </footer>
      </div>
    </main>
  );
}

function FavoriteUnitItemization({ unitId, unitName, itemizations, itemImages }: { unitId: string; unitName: string; itemizations: Array<{ unitId: string; itemName: string; games: number; rate: number }>; itemImages: Record<string, string | null> }) {
  const items = itemizations.filter((item) => item.unitId === unitId).slice(0, 5);
  return <article className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-cyan-300">Diamond itemization</p><h3 className="mt-2 text-xl font-semibold text-white">Popular items for {unitName}</h3></div><span className="text-xs text-slate-500">Top sampled Diamond players</span></div>{items.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{items.map((item) => <div key={item.itemName} className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-3">{itemImages[item.itemName] ? <Image src={itemImages[item.itemName]!} alt="" width={44} height={44} className="size-11 object-contain" unoptimized /> : null}<p className="mt-2 text-xs font-medium text-slate-200">{item.itemName}</p><p className="mt-1 text-[10px] text-cyan-200">{item.rate}% · {item.games} games</p></div>)}</div> : <p className="mt-4 text-sm text-slate-500">No current itemization sample is available for this unit.</p>}</article>;
}

function RankCard({ entry }: { entry: TftLeagueEntry | undefined }) {
  if (!entry) {
    return (
      <div className="min-w-64 rounded-2xl border border-dashed border-cyan-300/20 bg-cyan-300/[0.04] p-5">
        <p className="text-xs uppercase tracking-wide text-cyan-300">
          Current rank
        </p>
        <p className="mt-2 text-xl font-semibold text-white">
          Placements in progress
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Riot has not published a ranked entry yet.
        </p>
      </div>
    );
  }

  const totalGames = entry.wins + entry.losses;
  const topFourRate = totalGames === 0 ? 0 : (entry.wins / totalGames) * 100;

  return (
    <div className="min-w-64 rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/10 to-blue-500/[0.03] p-5">
      <p className="text-xs uppercase tracking-wide text-cyan-300">
        Current rank
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">
        {formatIdentifier(entry.tier)} {entry.rank}
      </p>
      <p className="mt-1 font-mono text-sm text-cyan-100">
        {entry.leaguePoints} LP
      </p>
      <p className="mt-3 text-xs text-slate-500">
        {entry.wins} top fours · {entry.losses} bottom fours ·{" "}
        {topFourRate.toFixed(1)}%
      </p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function TendencyCard({
  label,
  entry,
  totalGames,
  imageUrl,
  imageStyle,
  displayName,
  cost,
}: {
  label: string;
  entry: { id: string; count: number } | null;
  totalGames: number;
  imageUrl: string | null;
  imageStyle: "portrait" | "icon";
  displayName?: string | null;
  cost?: number | null;
}) {
  if (!entry) {
    return (
      <article className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-5 text-sm text-slate-500">
        No {label.toLowerCase()} data available.
      </article>
    );
  }

  const percentage = totalGames === 0 ? 0 : (entry.count / totalGames) * 100;
  const name = displayName ?? formatIdentifier(entry.id);
  const costStyle = cost ? getUnitCostStyle(cost) : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-300/[0.08] to-slate-900/70 p-5">
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center rounded-2xl border border-white/10 bg-slate-950/60 p-2">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${name} ${label.toLowerCase()}`}
              width={72}
              height={72}
              className={
                imageStyle === "portrait"
                  ? "size-16 rounded-xl object-cover"
                  : "size-14 object-contain"
              }
              unoptimized
            />
          ) : (
            <span className="font-mono text-xl text-slate-600">?</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-wide text-cyan-300">
              Most played {label.toLowerCase()}
            </p>
            {cost && costStyle ? (
              <span className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] ${costStyle.badge}`}>
                {cost}-cost
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 truncate text-2xl font-semibold text-white">
            {name}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {entry.count} of {totalGames} games · {percentage.toFixed(0)}%
          </p>
        </div>
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-950/80">
        <div
          className="h-full rounded-full bg-cyan-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </article>
  );
}

function BestUnitComposition({
  match,
  unitName,
  matchingGames,
  assetImages,
}: {
  match: PersonalTftMatch;
  unitName: string;
  matchingGames: PersonalTftMatch[];
  assetImages: TftAssetImages;
}) {
  const averagePlacement =
    matchingGames.reduce((total, entry) => total + entry.placement, 0) /
    matchingGames.length;
  const topFourRate =
    (matchingGames.filter((entry) => entry.placement <= 4).length /
      matchingGames.length) *
    100;
  const shopUnits = match.units.filter(
    (unit) =>
      assetImages.unitCosts[unit.character_id] !== null &&
      assetImages.unitCosts[unit.character_id] !== undefined,
  );

  return (
    <article className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
      <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-cyan-300">
            Best recent composition with {unitName}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            {formatPlacement(match.placement)} place board
          </h3>
          <p className="mt-2 text-xs text-slate-500">
            {formatPlayedAt(match.playedAt)} · Best means lowest placement in
            the visible match sample.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg border border-white/10 bg-slate-950/50 px-2.5 py-1.5 text-slate-300">
            {matchingGames.length} games
          </span>
          <span className="rounded-lg border border-white/10 bg-slate-950/50 px-2.5 py-1.5 text-slate-300">
            {averagePlacement.toFixed(2)} avg.
          </span>
          <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1.5 text-cyan-200">
            {topFourRate.toFixed(0)}% top 4
          </span>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Final shop-unit board
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {shopUnits.map((unit, index) => (
            <UnitCard
              key={`${match.matchId}-${unit.character_id}-${index}`}
              unit={unit}
              imageUrl={assetImages.units[unit.character_id] ?? null}
              itemImages={assetImages.items}
              shopCost={assetImages.unitCosts[unit.character_id]}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-5">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Active traits
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {match.activeTraits.map((trait) => (
            <TraitCard
              key={trait.name}
              trait={trait}
              imageUrl={assetImages.traits[trait.name] ?? null}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

function UnitCard({
  unit,
  imageUrl,
  itemImages,
  shopCost,
}: {
  unit: TftUnit;
  imageUrl: string | null;
  itemImages: Record<string, string | null>;
  shopCost?: number | null;
}) {
  const cost = shopCost ?? formatUnitCost(unit.rarity);
  const costStyle = getUnitCostStyle(cost);

  return (
    <article
      className={`relative rounded-2xl border bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-4 text-center ${costStyle.card}`}
    >
      <span
        className={`absolute right-2.5 top-2.5 rounded-md border px-1.5 py-0.5 font-mono text-[9px] ${costStyle.badge}`}
        title={`Cost ${cost}`}
      >
        {cost}
      </span>
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${formatIdentifier(unit.character_id)} icon`}
              width={80}
              height={80}
              className="size-20 rounded-xl border border-white/10 bg-slate-950/60 object-cover"
              unoptimized
            />
          ) : (
            <div className="size-20 rounded-xl bg-slate-800" />
          )}
          {unit.itemNames.length > 0 ? (
            <div className="absolute -bottom-2 left-1/2 flex w-max -translate-x-1/2 items-center justify-center gap-0.5 rounded-md bg-slate-950/95 p-0.5 shadow-lg ring-1 ring-white/10">
              {unit.itemNames.map((item, index) =>
                itemImages[item] ? (
                  <Image
                    key={`${item}-${index}`}
                    src={itemImages[item]!}
                    alt={formatIdentifier(item)}
                    title={formatIdentifier(item)}
                    width={24}
                    height={24}
                    className="size-6 rounded-sm object-cover"
                    unoptimized
                  />
                ) : null,
              )}
            </div>
          ) : null}
        </div>
        <h3 className="max-w-full truncate text-sm font-semibold text-white">
          {formatIdentifier(unit.character_id)}
        </h3>
        <p className="mt-1 text-xs text-amber-300" aria-label={`${unit.tier} stars`}>
          {"★".repeat(unit.tier)}
        </p>
      </div>
    </article>
  );
}

function TraitCard({
  trait,
  imageUrl,
}: {
  trait: TftTrait;
  imageUrl: string | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${formatIdentifier(trait.name)} icon`}
          width={32}
          height={32}
          className="size-8 object-contain"
          unoptimized
        />
      ) : null}
      <div>
        <p className="text-sm font-medium text-slate-200">
          {formatIdentifier(trait.name)}
        </p>
        <p className="mt-1 font-mono text-[10px] text-slate-500">
          {trait.num_units} units · Tier {trait.tier_current}
        </p>
      </div>
    </div>
  );
}

function findMostPlayed(valuesByMatch: string[][]) {
  const counts = new Map<string, number>();

  for (const values of valuesByMatch) {
    for (const value of new Set(values)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  const [leader] = [...counts.entries()].sort(
    ([leftId, leftCount], [rightId, rightCount]) =>
      rightCount - leftCount || leftId.localeCompare(rightId),
  );

  return leader ? { id: leader[0], count: leader[1] } : null;
}

function formatIdentifier(value: string) {
  return value
    .replace(/^DA_(18_)?/, "")
    .replace(/18$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ");
}

function formatUnitCost(rarity: number) {
  if (rarity >= 0 && rarity <= 4) {
    return rarity + 1;
  }

  return "Special";
}

function getUnitCostStyle(cost: number | string) {
  const styles: Record<string, { card: string; badge: string }> = {
    "1": {
      card: "border-slate-400/20 shadow-[inset_0_1px_0_rgba(148,163,184,0.16)]",
      badge: "border-slate-300/20 bg-slate-300/10 text-slate-200",
    },
    "2": {
      card: "border-green-400/25 shadow-[inset_0_1px_0_rgba(74,222,128,0.2)]",
      badge: "border-green-300/25 bg-green-300/10 text-green-200",
    },
    "3": {
      card: "border-blue-400/25 shadow-[inset_0_1px_0_rgba(96,165,250,0.2)]",
      badge: "border-blue-300/25 bg-blue-300/10 text-blue-200",
    },
    "4": {
      card: "border-purple-400/30 shadow-[inset_0_1px_0_rgba(192,132,252,0.24)]",
      badge: "border-purple-300/25 bg-purple-300/10 text-purple-200",
    },
    "5": {
      card: "border-yellow-400/35 shadow-[inset_0_1px_0_rgba(250,204,21,0.28)]",
      badge: "border-yellow-300/30 bg-yellow-300/10 text-yellow-200",
    },
    Special: {
      card: "border-amber-400/25 shadow-[inset_0_1px_0_rgba(251,191,36,0.18)]",
      badge: "border-amber-300/25 bg-amber-300/10 text-amber-200",
    },
  };

  return styles[String(cost)] ?? styles.Special;
}

function formatPlacement(placement: number) {
  const suffix = placement === 1 ? "st" : placement === 2 ? "nd" : placement === 3 ? "rd" : "th";
  return `${placement}${suffix}`;
}

function getPlacementStyle(placement: number) {
  if (placement === 1) return "border-amber-300/40 bg-amber-300/15 text-amber-200";
  if (placement <= 4) return "border-cyan-300/30 bg-cyan-300/10 text-cyan-200";
  if (placement >= 7) return "border-rose-300/25 bg-rose-300/10 text-rose-200";
  return "border-slate-500/30 bg-slate-500/10 text-slate-300";
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatPlayedAt(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}
