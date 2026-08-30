import "server-only";

import { asc, count, desc, eq } from "drizzle-orm";

import { database } from "@/db/client";
import { tftMetaCompositions, tftMetaSnapshots } from "@/db/schema";

import {
  getRecentTftMatchIds,
  getTftDiamondPlayers,
  getTftMatch,
  getTftPuuidBySummonerId,
  type TftMetaMatch,
} from "@/integrations/riot/tft";

// Keep this bounded for a development-key-friendly sample. Match IDs are
// deduplicated before full match requests are made.
const PLAYER_LIMIT = 24;
const MATCHES_PER_PLAYER = 8;
const MATCH_LIMIT = 48;
const MATCH_BATCH_SIZE = 5;
const MATCH_BATCH_DELAY_MS = 350;
const CACHE_TTL_MS = 15 * 60 * 1_000;

type Composition = {
  signature: string;
  games: number;
  wins: number;
  topFours: number;
  averagePlacement: number;
  units: string[];
  traits: string[];
};

export type MetaResult = {
  sampledPlayers: number;
  sampledMatches: number;
  generatedAt: string;
  sampleDate: string;
  windowStart: string;
  windowEnd: string;
  setNumber: number | null;
  patch: string | null;
  compositions: Composition[];
  error?: string;
};

let cachedResult: { expiresAt: number; value: MetaResult } | null = null;

export async function listRecentTftMetaSnapshots(limit = 5) {
  return database
    .select({
      id: tftMetaSnapshots.id,
      source: tftMetaSnapshots.source,
      platform: tftMetaSnapshots.platform,
      patch: tftMetaSnapshots.patch,
      setNumber: tftMetaSnapshots.setNumber,
      sampledPlayers: tftMetaSnapshots.sampledPlayers,
      sampledMatches: tftMetaSnapshots.sampledMatches,
      sampleDate: tftMetaSnapshots.sampleDate,
      windowStart: tftMetaSnapshots.windowStart,
      windowEnd: tftMetaSnapshots.windowEnd,
      capturedAt: tftMetaSnapshots.capturedAt,
      compositionCount: count(tftMetaCompositions.id),
    })
    .from(tftMetaSnapshots)
    .leftJoin(
      tftMetaCompositions,
      eq(tftMetaCompositions.snapshotId, tftMetaSnapshots.id),
    )
    .groupBy(tftMetaSnapshots.id)
    .orderBy(desc(tftMetaSnapshots.capturedAt))
    .limit(limit);
}

export async function getSavedTftMetaSnapshot(snapshotId: number) {
  const [snapshot] = await database
    .select()
    .from(tftMetaSnapshots)
    .where(eq(tftMetaSnapshots.id, snapshotId))
    .limit(1);

  if (!snapshot) return null;

  const compositions = await database
    .select()
    .from(tftMetaCompositions)
    .where(eq(tftMetaCompositions.snapshotId, snapshot.id))
    .orderBy(asc(tftMetaCompositions.rank));

  return {
    ...snapshot,
    compositions: compositions.map((composition) => ({
      signature: composition.signature,
      games: composition.games,
      wins: composition.wins,
      topFours: composition.topFours,
      averagePlacement: composition.averagePlacement / 100,
      units: composition.units,
      traits: composition.traits,
    })),
  };
}

export async function getCurrentTftMeta(
  options: { forceRefresh?: boolean } = {},
): Promise<MetaResult> {
  if (
    !options.forceRefresh &&
    cachedResult &&
    cachedResult.expiresAt > Date.now()
  ) {
    return cachedResult.value;
  }

  const sampleWindow = getLastCompletedPhilippineDay();

  let diamondPlayers: Awaited<ReturnType<typeof getTftDiamondPlayers>>;
  try {
    diamondPlayers = await getTftDiamondPlayers("sg2");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Riot API error";
    const result: MetaResult = {
      sampledPlayers: 0,
      sampledMatches: 0,
      generatedAt: new Date().toISOString(),
      sampleDate: sampleWindow.sampleDate,
      windowStart: sampleWindow.start.toISOString(),
      windowEnd: sampleWindow.end.toISOString(),
      setNumber: null,
      patch: null,
      compositions: [],
      error: message,
    };
    cachedResult = { expiresAt: Date.now() + CACHE_TTL_MS, value: result };
    return result;
  }

  diamondPlayers = diamondPlayers
    .sort((left, right) => right.leaguePoints - left.leaguePoints)
    .slice(0, PLAYER_LIMIT);

  if (diamondPlayers.length === 0) {
    const result: MetaResult = {
      sampledPlayers: 0,
      sampledMatches: 0,
      generatedAt: new Date().toISOString(),
      sampleDate: sampleWindow.sampleDate,
      windowStart: sampleWindow.start.toISOString(),
      windowEnd: sampleWindow.end.toISOString(),
      setNumber: null,
      patch: null,
      compositions: [],
      error: "Riot returned no Diamond entries for the SG2 ladder.",
    };
    cachedResult = { expiresAt: Date.now() + CACHE_TTL_MS, value: result };
    return result;
  }

  const playerMatchIds: string[][] = [];
  let sampledPlayers = 0;

  for (const player of diamondPlayers) {
    try {
      const puuid =
        player.puuid ??
        (player.summonerId
          ? await getTftPuuidBySummonerId(player.summonerId, "sg2")
          : null);
      if (!puuid) continue;
      const recentIds = await getRecentTftMatchIds(puuid, MATCHES_PER_PLAYER, "sea");
      playerMatchIds.push(recentIds);
      sampledPlayers += 1;
    } catch (error) {
      console.warn(
        "TFT meta player sample skipped:",
        error instanceof Error ? error.message : "Unknown error",
      );
      // One unavailable or stale leaderboard entry should not abort the sample.
    }
  }

  const matchIds = selectRoundRobinMatchIds(playerMatchIds, MATCH_LIMIT);
  const fetchedMatches: Array<TftMetaMatch | null> = [];

  for (let start = 0; start < matchIds.length; start += MATCH_BATCH_SIZE) {
    const batch = matchIds.slice(start, start + MATCH_BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (matchId) => {
      try {
        return await getTftMatch(matchId, "sea");
      } catch (error) {
        console.warn(
          "TFT meta match sample skipped:",
          error instanceof Error ? error.message : "Unknown error",
        );
        return null;
      }
      }),
    );
    fetchedMatches.push(...results);

    if (start + MATCH_BATCH_SIZE < matchIds.length) {
      await delay(MATCH_BATCH_DELAY_MS);
    }
  }

  const matches = fetchedMatches.filter(
    (match): match is TftMetaMatch =>
      match !== null &&
      match.info.game_datetime >= sampleWindow.start.getTime() &&
      match.info.game_datetime < sampleWindow.end.getTime(),
  );
  const compositions = aggregateCompositions(matches);
  const result: MetaResult = {
    sampledPlayers,
    sampledMatches: matches.length,
    generatedAt: new Date().toISOString(),
    sampleDate: sampleWindow.sampleDate,
    windowStart: sampleWindow.start.toISOString(),
    windowEnd: sampleWindow.end.toISOString(),
    setNumber: matches[0]?.info.tft_set_number ?? null,
    patch: matches[0]?.info.game_version ?? null,
    compositions,
    ...(matches.length === 0
      ? { error: "Riot returned no matches inside the completed daily window." }
      : {}),
  };

  cachedResult = { expiresAt: Date.now() + CACHE_TTL_MS, value: result };
  return result;
}

export async function syncCurrentTftMeta() {
  const meta = await getCurrentTftMeta({ forceRefresh: true });

  if (meta.error || !meta.patch || meta.setNumber === null) {
    throw new Error(meta.error ?? "TFT meta data is incomplete and cannot be saved.");
  }

  const snapshotValues = {
    source: "riot-diamond-daily",
    platform: "sg2",
    patch: meta.patch,
    setNumber: meta.setNumber,
    sampledPlayers: meta.sampledPlayers,
    sampledMatches: meta.sampledMatches,
    sampleDate: meta.sampleDate,
    windowStart: new Date(meta.windowStart),
    windowEnd: new Date(meta.windowEnd),
    capturedAt: new Date(),
  };

  return database.transaction(async (transaction) => {
    const [snapshot] = await transaction
      .insert(tftMetaSnapshots)
      .values(snapshotValues)
      .onConflictDoUpdate({
        target: [
          tftMetaSnapshots.source,
          tftMetaSnapshots.platform,
          tftMetaSnapshots.sampleDate,
        ],
        set: snapshotValues,
      })
      .returning({ id: tftMetaSnapshots.id });

    if (!snapshot) {
      throw new Error("TFT meta snapshot was not created.");
    }

    await transaction
      .delete(tftMetaCompositions)
      .where(eq(tftMetaCompositions.snapshotId, snapshot.id));

    if (meta.compositions.length > 0) {
      await transaction.insert(tftMetaCompositions).values(
        meta.compositions.map((composition, index) => ({
          snapshotId: snapshot.id,
          signature: composition.signature,
          rank: index + 1,
          games: composition.games,
          wins: composition.wins,
          topFours: composition.topFours,
          averagePlacement: Math.round(composition.averagePlacement * 100),
          units: composition.units,
          traits: composition.traits,
        })),
      );
    }

    return {
      snapshotId: snapshot.id,
      sampleDate: meta.sampleDate,
      sampledMatches: meta.sampledMatches,
      compositionCount: meta.compositions.length,
    };
  });
}

function getLastCompletedPhilippineDay(now = new Date()) {
  const philippineOffsetMs = 8 * 60 * 60 * 1_000;
  const philippineNow = new Date(now.getTime() + philippineOffsetMs);
  const end = new Date(
    Date.UTC(
      philippineNow.getUTCFullYear(),
      philippineNow.getUTCMonth(),
      philippineNow.getUTCDate(),
    ) - philippineOffsetMs,
  );
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1_000);
  const sampleDate = new Date(start.getTime() + philippineOffsetMs)
    .toISOString()
    .slice(0, 10);

  return { sampleDate, start, end };
}

function selectRoundRobinMatchIds(
  matchesByPlayer: string[][],
  limit: number,
) {
  const selected = new Set<string>();
  const maximumListLength = Math.max(
    0,
    ...matchesByPlayer.map((matches) => matches.length),
  );

  for (let matchIndex = 0; matchIndex < maximumListLength; matchIndex += 1) {
    for (const matches of matchesByPlayer) {
      const matchId = matches[matchIndex];
      if (matchId) selected.add(matchId);
      if (selected.size >= limit) return [...selected];
    }
  }

  return [...selected];
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function aggregateCompositions(matches: TftMetaMatch[]): Composition[] {
  const groups = new Map<string, Composition>();

  for (const match of matches) {
    for (const participant of match.info.participants) {
      const units = participant.units
        .map((unit) => unit.character_id)
        .sort();
      const traits = participant.traits
        .filter((trait) => trait.style > 0)
        .map((trait) => trait.name)
        .sort();
      // Traits provide a more stable composition key than an exact board,
      // because two players can run the same shell with different flex units.
      const signature = traits.join(",") || units.slice(0, 3).join(",");
      const current = groups.get(signature) ?? {
        signature,
        games: 0,
        wins: 0,
        topFours: 0,
        averagePlacement: 0,
        units,
        traits,
      };

      current.games += 1;
      current.wins += participant.placement === 1 ? 1 : 0;
      current.topFours += participant.placement <= 4 ? 1 : 0;
      current.averagePlacement += participant.placement;
      current.units = [...new Set([...current.units, ...units])].sort();
      groups.set(signature, current);
    }
  }

  return [...groups.values()]
    .filter((composition) => composition.games >= 2)
    .map((composition) => ({
      ...composition,
      averagePlacement: Number(
        (composition.averagePlacement / composition.games).toFixed(2),
      ),
    }))
    .sort(
      (left, right) =>
        right.topFours / right.games - left.topFours / left.games ||
        left.averagePlacement - right.averagePlacement,
    )
    .slice(0, 12);
}

