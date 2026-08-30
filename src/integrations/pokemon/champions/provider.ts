import "server-only";

import { z } from "zod";

const CHAMPIONS_API_URL = "https://championsbattledata.com";

const pokemonIdSchema = z.string().regex(/^[a-z0-9]+$/);
const battleFormatSchema = z.enum(["Doubles", "Singles"]);
const metaCategorySchema = z.enum([
  "move",
  "held_item",
  "teammate",
  "stat_alignment",
  "stat_points",
  "ability",
]);

const battleStatsSchema = z.object({
  hp: z.number(),
  attack: z.number(),
  defense: z.number(),
  sp_attack: z.number(),
  sp_defense: z.number(),
  speed: z.number(),
});

const pokemonResponseSchema = z.object({
  name: z.string(),
  showdownId: z.string(),
  requestedFormat: battleFormatSchema,
  requestedSeason: z.string(),
  summary: z.object({
    types: z.array(z.string()),
    baseStats: battleStatsSchema,
  }),
});

const metaRowSchema = z.object({
  category: metaCategorySchema,
  rank: z.number().int().positive(),
  name: z.string(),
  percentage_value: z.number().nullable(),
  stat_up: z.string().optional(),
  stat_down: z.string().optional(),
  hp_points: z.union([z.number(), z.literal("")]).optional(),
  attack_points: z.union([z.number(), z.literal("")]).optional(),
  defense_points: z.union([z.number(), z.literal("")]).optional(),
  sp_atk_points: z.union([z.number(), z.literal("")]).optional(),
  sp_def_points: z.union([z.number(), z.literal("")]).optional(),
  speed_points: z.union([z.number(), z.literal("")]).optional(),
});

const currentMetaResponseSchema = z.object({
  pokemon: z.string(),
  showdownId: z.string(),
  format: battleFormatSchema,
  season: z.string(),
  source: z.string(),
  rows: z.array(metaRowSchema),
});

const historicalMetaResponseSchema = z.object({
  requestedDays: z.number().int().positive(),
  season: z.string().nullable(),
  daily: z.array(
    z.object({
      season: z.string(),
      date: z.string().regex(/^\d{2}_\d{2}_\d{4}$/),
      source: z.string(),
      rows: z.array(metaRowSchema),
    }),
  ),
});

const rosterManifestSchema = z.object({
  generatedAt: z.iso.datetime(),
  pokemon: z.array(
    z.object({
      name: z.string(),
      showdownId: z.string(),
      battleDataCsvs: z.array(
        z.object({
          season: z.string(),
          format: battleFormatSchema,
        }),
      ),
      summary: z.object({
        types: z.array(z.string()),
      }),
    }),
  ),
});

export type BattleFormat = z.infer<typeof battleFormatSchema>;
export type MetaCategory = z.infer<typeof metaCategorySchema>;
export type ChampionsBattleStats = z.infer<typeof battleStatsSchema>;

export type MetaRanking = {
  category: MetaCategory;
  rank: number;
  name: string | null;
  percentage: number | null;
  statChange: {
    increased: string;
    decreased: string;
  } | null;
  statAllocation: ChampionsBattleStats | null;
};

export type ChampionsPokemon = {
  name: string;
  showdownId: string;
  format: BattleFormat;
  season: string;
  types: string[];
  baselineBattleStats: ChampionsBattleStats;
};

export type MetaSnapshot = {
  season: string;
  snapshotDate: string;
  source: string;
  rankings: MetaRanking[];
};

export type ChampionsRosterPokemon = {
  name: string;
  pokemonId: string;
  types: string[];
};

export async function getChampionsRoster(
  format: BattleFormat,
): Promise<ChampionsRosterPokemon[]> {
  const parsedFormat = battleFormatSchema.parse(format);
  const url = new URL("/data/pokemon-index.json", CHAMPIONS_API_URL);
  const payload = await fetchJson(url, 3_600);
  const manifest = rosterManifestSchema.parse(payload);

  return manifest.pokemon
    .filter((pokemon) =>
      pokemon.battleDataCsvs.some(
        (source) =>
          source.season === "Current" && source.format === parsedFormat,
      ),
    )
    .map((pokemon) => ({
      name: pokemon.name,
      pokemonId: pokemon.showdownId,
      types: pokemon.summary.types,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getChampionsPokemon(
  pokemonId: string,
  format: BattleFormat,
): Promise<ChampionsPokemon> {
  const id = pokemonIdSchema.parse(pokemonId);
  const parsedFormat = battleFormatSchema.parse(format);
  const url = new URL(`/api/pokemon/${id}`, CHAMPIONS_API_URL);
  url.searchParams.set("format", parsedFormat);

  const payload = await fetchJson(url, 86_400);
  const result = pokemonResponseSchema.parse(payload);

  return {
    name: result.name,
    showdownId: result.showdownId,
    format: result.requestedFormat,
    season: result.requestedSeason,
    types: result.summary.types,
    baselineBattleStats: result.summary.baseStats,
  };
}

export async function getCurrentChampionsMeta(
  pokemonId: string,
  format: BattleFormat,
) {
  const id = pokemonIdSchema.parse(pokemonId);
  const parsedFormat = battleFormatSchema.parse(format);
  const url = new URL(`/api/battle/${parsedFormat}/${id}`, CHAMPIONS_API_URL);
  const payload = await fetchJson(url, 3_600);
  const result = currentMetaResponseSchema.parse(payload);

  return {
    pokemon: result.pokemon,
    showdownId: result.showdownId,
    format: result.format,
    season: result.season,
    source: result.source,
    rankings: result.rows.map(normalizeMetaRow),
  };
}

export async function getChampionsMetaHistory(
  pokemonId: string,
  format: BattleFormat,
  days: number,
): Promise<MetaSnapshot[]> {
  const id = pokemonIdSchema.parse(pokemonId);
  const parsedFormat = battleFormatSchema.parse(format);
  const parsedDays = z.number().int().min(1).max(31).parse(days);
  const url = new URL(`/api/battle/${parsedFormat}/${id}`, CHAMPIONS_API_URL);
  url.searchParams.set("days", String(parsedDays));

  const payload = await fetchJson(url, 3_600);
  const result = historicalMetaResponseSchema.parse(payload);

  return result.daily.map((snapshot) => ({
    season: snapshot.season,
    snapshotDate: parseProviderDate(snapshot.date),
    source: snapshot.source,
    rankings: snapshot.rows.map(normalizeMetaRow),
  }));
}

function normalizeMetaRow(row: z.infer<typeof metaRowSchema>): MetaRanking {
  const hasStatChange = Boolean(row.stat_up || row.stat_down);
  const hasStatAllocation = row.category === "stat_points";

  return {
    category: row.category,
    rank: row.rank,
    name: row.name || null,
    percentage: row.percentage_value,
    statChange: hasStatChange
      ? {
          increased: row.stat_up ?? "",
          decreased: row.stat_down ?? "",
        }
      : null,
    statAllocation: hasStatAllocation
      ? {
          hp: toNumber(row.hp_points),
          attack: toNumber(row.attack_points),
          defense: toNumber(row.defense_points),
          sp_attack: toNumber(row.sp_atk_points),
          sp_defense: toNumber(row.sp_def_points),
          speed: toNumber(row.speed_points),
        }
      : null,
  };
}

function toNumber(value: number | "" | undefined) {
  return typeof value === "number" ? value : 0;
}

function parseProviderDate(value: string) {
  const [day, month, year] = value.split("_");

  return `${year}-${month}-${day}`;
}

async function fetchJson(url: URL, revalidate: number): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(
      `Champions Battle Data request failed with status ${response.status}.`,
    );
  }

  return response.json();
}

