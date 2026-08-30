import "server-only";

import { z } from "zod";

import { getRiotApiKey } from "@/integrations/riot/config";

const platformSchema = z.enum(["sg2"]);
const matchRegionSchema = z.enum(["sea"]);

const leagueEntrySchema = z.object({
  queueType: z.string(),
  tier: z.string(),
  rank: z.string(),
  leaguePoints: z.number().int(),
  wins: z.number().int(),
  losses: z.number().int(),
  hotStreak: z.boolean(),
  veteran: z.boolean(),
  inactive: z.boolean(),
  freshBlood: z.boolean(),
});

const challengerResponseSchema = z.object({
  entries: z.array(
    z.object({
      summonerId: z.string().optional(),
      puuid: z.string().min(1).optional(),
      leaguePoints: z.number().int(),
      rank: z.string(),
      wins: z.number().int(),
      losses: z.number().int(),
    }),
  ),
});

const rankedPlayersSchema = z.array(
  z.object({
    summonerId: z.string().optional(),
    puuid: z.string().min(1).optional(),
    leaguePoints: z.number().int(),
    rank: z.string(),
    wins: z.number().int(),
    losses: z.number().int(),
  }),
);

const summonerSchema = z.object({ puuid: z.string().min(1) });

const traitSchema = z.object({
  name: z.string(),
  num_units: z.number().int(),
  style: z.number().int(),
  tier_current: z.number().int(),
  tier_total: z.number().int(),
});

const unitSchema = z.object({
  character_id: z.string(),
  itemNames: z.array(z.string()),
  rarity: z.number().int(),
  tier: z.number().int(),
});

const participantSchema = z.object({
  puuid: z.string(),
  placement: z.number().int(),
  level: z.number().int(),
  last_round: z.number().int(),
  gold_left: z.number().int(),
  players_eliminated: z.number().int(),
  total_damage_to_players: z.number().int(),
  traits: z.array(traitSchema),
  units: z.array(unitSchema),
  win: z.boolean(),
});

const matchSchema = z.object({
  metadata: z.object({
    data_version: z.string(),
    match_id: z.string(),
  }),
  info: z.object({
    game_datetime: z.number(),
    game_length: z.number(),
    game_version: z.string(),
    queue_id: z.number().int(),
    tft_set_core_name: z.string(),
    tft_set_number: z.number().int(),
    participants: z.array(participantSchema),
  }),
});

export type TftLeagueEntry = z.infer<typeof leagueEntrySchema>;
export type TftTrait = z.infer<typeof traitSchema>;
export type TftUnit = z.infer<typeof unitSchema>;
export type TftMetaMatch = z.infer<typeof matchSchema>;

export type PersonalTftMatch = {
  matchId: string;
  dataVersion: string;
  playedAt: Date;
  durationSeconds: number;
  gameVersion: string | null;
  queueId: number;
  setCoreName: string;
  setNumber: number;
  placement: number;
  level: number;
  lastRound: number;
  goldLeft: number;
  playersEliminated: number | null;
  damageToPlayers: number | null;
  activeTraits: TftTrait[];
  units: TftUnit[];
};

export async function getTftLeagueEntries(
  puuid: string,
  platform: z.infer<typeof platformSchema> = "sg2",
): Promise<TftLeagueEntry[]> {
  const parsedPuuid = z.string().min(1).parse(puuid);
  const parsedPlatform = platformSchema.parse(platform);
  const url = new URL(
    `/tft/league/v1/by-puuid/${encodeURIComponent(parsedPuuid)}`,
    `https://${parsedPlatform}.api.riotgames.com`,
  );
  const payload = await fetchRiotJson(url);

  return z.array(leagueEntrySchema).parse(payload);
}

export async function getTftChallengerPlayers(
  platform: z.infer<typeof platformSchema> = "sg2",
) {
  const parsedPlatform = platformSchema.parse(platform);
  const url = new URL(
    "/tft/league/v1/challenger",
    `https://${parsedPlatform}.api.riotgames.com`,
  );
  const payload = challengerResponseSchema.parse(await fetchRiotJson(url));

  return payload.entries;
}

export async function getTftMasterPlayers(
  platform: z.infer<typeof platformSchema> = "sg2",
) {
  const parsedPlatform = platformSchema.parse(platform);
  const url = new URL(
    "/tft/league/v1/master",
    `https://${parsedPlatform}.api.riotgames.com`,
  );
  const payload = challengerResponseSchema.parse(await fetchRiotJson(url));

  return payload.entries;
}

export async function getTftDiamondPlayers(
  platform: z.infer<typeof platformSchema> = "sg2",
) {
  const parsedPlatform = platformSchema.parse(platform);
  const url = new URL(
    "/tft/league/v1/entries/DIAMOND/I",
    `https://${parsedPlatform}.api.riotgames.com`,
  );
  return rankedPlayersSchema.parse(await fetchRiotJson(url));
}

export async function getTftPuuidBySummonerId(
  summonerId: string,
  platform: z.infer<typeof platformSchema> = "sg2",
) {
  const parsedSummonerId = z.string().min(1).parse(summonerId);
  const parsedPlatform = platformSchema.parse(platform);
  const url = new URL(
    `/tft/summoner/v1/summoners/${encodeURIComponent(parsedSummonerId)}`,
    `https://${parsedPlatform}.api.riotgames.com`,
  );
  return summonerSchema.parse(await fetchRiotJson(url)).puuid;
}

export async function getTftMatch(
  matchId: string,
  region: z.infer<typeof matchRegionSchema> = "sea",
): Promise<TftMetaMatch> {
  const parsedMatchId = z.string().min(1).parse(matchId);
  const parsedRegion = matchRegionSchema.parse(region);
  const url = new URL(
    `/tft/match/v1/matches/${encodeURIComponent(parsedMatchId)}`,
    `https://${parsedRegion}.api.riotgames.com`,
  );

  return matchSchema.parse(await fetchRiotJson(url));
}

export async function getRecentTftMatchIds(
  puuid: string,
  count = 10,
  region: z.infer<typeof matchRegionSchema> = "sea",
): Promise<string[]> {
  const parsedPuuid = z.string().min(1).parse(puuid);
  const parsedCount = z.number().int().min(1).max(100).parse(count);
  const parsedRegion = matchRegionSchema.parse(region);
  const url = new URL(
    `/tft/match/v1/matches/by-puuid/${encodeURIComponent(parsedPuuid)}/ids`,
    `https://${parsedRegion}.api.riotgames.com`,
  );
  url.searchParams.set("start", "0");
  url.searchParams.set("count", String(parsedCount));
  const payload = await fetchRiotJson(url);

  return z.array(z.string()).parse(payload);
}

export async function getPersonalTftMatch(
  matchId: string,
  puuid: string,
  region: z.infer<typeof matchRegionSchema> = "sea",
): Promise<PersonalTftMatch> {
  const parsedMatchId = z.string().min(1).parse(matchId);
  const parsedPuuid = z.string().min(1).parse(puuid);
  const parsedRegion = matchRegionSchema.parse(region);
  const url = new URL(
    `/tft/match/v1/matches/${encodeURIComponent(parsedMatchId)}`,
    `https://${parsedRegion}.api.riotgames.com`,
  );
  const payload = await fetchRiotJson(url);
  const match = matchSchema.parse(payload);
  const participant = match.info.participants.find(
    (entry) => entry.puuid === parsedPuuid,
  );

  if (!participant) {
    throw new Error("The requested player is not present in this TFT match.");
  }

  const hasIncompleteUnrealStats = match.info.game_version.startsWith(
    "TFT Unreal Version",
  );

  return {
    matchId: match.metadata.match_id,
    dataVersion: match.metadata.data_version,
    playedAt: new Date(match.info.game_datetime),
    durationSeconds: match.info.game_length,
    gameVersion: match.info.game_version.includes("?.?.?.?")
      ? null
      : match.info.game_version,
    queueId: match.info.queue_id,
    setCoreName: match.info.tft_set_core_name,
    setNumber: match.info.tft_set_number,
    placement: participant.placement,
    level: participant.level,
    lastRound: participant.last_round,
    goldLeft: participant.gold_left,
    playersEliminated: hasIncompleteUnrealStats
      ? null
      : participant.players_eliminated,
    damageToPlayers: hasIncompleteUnrealStats
      ? null
      : participant.total_damage_to_players,
    activeTraits: participant.traits.filter((trait) => trait.style > 0),
    units: participant.units,
  };
}

async function fetchRiotJson(url: URL): Promise<unknown> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Riot-Token": getRiotApiKey(),
    },
  });

  if (!response.ok) {
    throw new Error(`Riot API request failed with status ${response.status}.`);
  }

  return response.json();
}

