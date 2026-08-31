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

export type ChampionsMetaCore = {
  rank: number;
  format: BattleFormat;
  season: string;
  source: string;
  partnerRank: number;
  members: Array<{ pokemonId: string; name: string; types: string[] }>;
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
  const id = normalizeChampionsPokemonId(pokemonId);
  const parsedFormat = battleFormatSchema.parse(format);
  const url = new URL(`/api/pokemon/${id}`, CHAMPIONS_API_URL);
  url.searchParams.set("format", parsedFormat);

  let payload: unknown;
  try {
    payload = await fetchJson(url, 86_400);
  } catch (error) {
    if (isBasculegionId(id)) {
      return getBasculegionFallback(id, parsedFormat);
    }
    throw error;
  }
  const result = pokemonResponseSchema.parse(payload);

  // Guard against the upstream service resolving an ambiguous legacy slug to
  // an unrelated record. Never persist that record as a Basculegion member.
  if (isBasculegionId(id) && !result.showdownId.toLowerCase().startsWith("basculegion")) {
    return getBasculegionFallback(id, parsedFormat);
  }

  return {
    name: result.name,
    showdownId: result.showdownId,
    format: result.requestedFormat,
    season: result.requestedSeason,
    types: result.summary.types,
    baselineBattleStats: result.summary.baseStats,
  };
}

function isBasculegionId(id: string) {
  return id.startsWith("basculegion") || id.startsWith("baculegion");
}

function getBasculegionFallback(
  id: string,
  format: BattleFormat,
): ChampionsPokemon {
  const female = id.endsWith("f") || id.endsWith("female");
  return {
    name: female ? "Basculegion Female" : "Basculegion Male",
    showdownId: female ? "basculegionf" : "basculegionm",
    format,
    season: "Current",
    types: ["Water", "Ghost"],
    baselineBattleStats: female
      ? { hp: 120, attack: 92, defense: 65, sp_attack: 100, sp_defense: 75, speed: 78 }
      : { hp: 120, attack: 112, defense: 65, sp_attack: 80, sp_defense: 75, speed: 78 },
  };
}

export async function getCurrentChampionsMeta(
  pokemonId: string,
  format: BattleFormat,
) {
  const id = normalizeChampionsPokemonId(pokemonId);
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

export async function getPopularChampionsCores(
  format: BattleFormat,
  anchorPokemonId?: string,
): Promise<ChampionsMetaCore[]> {
  const parsedFormat = battleFormatSchema.parse(format);
  const roster = await getChampionsRoster(parsedFormat);
  const responses = await Promise.allSettled(
    roster.map((pokemon) => getCurrentChampionsMeta(pokemon.pokemonId, parsedFormat)),
  );
  const byId = new Map(roster.map((pokemon) => [normalizeRosterName(pokemon.pokemonId), pokemon]));
  const cores = new Map<string, ChampionsMetaCore>();

  responses.forEach((response) => {
    if (response.status !== "fulfilled") return;
    const anchor = byId.get(normalizeRosterName(response.value.showdownId));
    if (!anchor) return;
    response.value.rankings
      .filter((ranking) => ranking.category === "teammate" && ranking.name)
      .slice(0, 5)
      .forEach((ranking) => {
        const partner = findRosterPokemon(byId, ranking.name ?? "");
        if (!partner || partner.pokemonId === anchor.pokemonId) return;
        const ids = [anchor.pokemonId, partner.pokemonId].sort();
        const key = ids.join("|");
        if (!cores.has(key)) {
          cores.set(key, {
            rank: 0,
            format: parsedFormat,
            season: response.value.season,
            source: response.value.source,
            partnerRank: ranking.rank,
            members: [anchor, partner].map((pokemon) => ({
              pokemonId: pokemon.pokemonId,
              name: pokemon.name,
              types: pokemon.types,
            })),
          });
        }
      });
  });

  const normalizedAnchor = anchorPokemonId
    ? normalizeRosterName(anchorPokemonId)
    : undefined;

  return [...cores.values()]
    .filter((core) =>
      !normalizedAnchor || core.members.some((member) =>
        normalizeRosterName(member.pokemonId) === normalizedAnchor,
      ),
    )
    .sort((left, right) => left.partnerRank - right.partnerRank)
    .slice(0, 12)
    .map((core, index) => ({ ...core, rank: index + 1 }));
}

function normalizeRosterName(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

function findRosterPokemon(
  roster: Map<string, ChampionsRosterPokemon>,
  name: string,
) {
  const normalized = normalizeRosterName(name);
  for (const [key, pokemon] of roster) {
    if (
      key === normalized ||
      normalizeRosterName(pokemon.name) === normalized ||
      key.includes(normalized) ||
      normalized.includes(key)
    ) {
      return pokemon;
    }
  }
  return undefined;
}

export async function getChampionsMetaHistory(
  pokemonId: string,
  format: BattleFormat,
  days: number,
): Promise<MetaSnapshot[]> {
  const id = normalizeChampionsPokemonId(pokemonId);
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

function normalizeChampionsPokemonId(pokemonId: string) {
  const id = pokemonIdSchema.parse(pokemonId);

  // The Champions API follows Pokémon Showdown IDs for gendered forms.
  // Resolve the ambiguous legacy slug to Male instead of allowing the
  // upstream service to return an unrelated record.
  if (id === "basculegion" || id === "basculegionmale" || id === "baculegion" || id === "baculegionmale") {
    return "basculegionm";
  }
  if (id === "basculegionfemale" || id === "baculegionfemale") {
    return "basculegionf";
  }

  return id;
}

function normalizeMetaRow(row: z.infer<typeof metaRowSchema>): MetaRanking {
  const hasStatChange = Boolean(row.stat_up || row.stat_down);
  const hasStatAllocation = row.category === "stat_points";

  return {
    category: row.category,
    rank: row.rank,
    name: row.name ? normalizeMetaName(row.category, row.name) : null,
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

function normalizeMetaName(category: MetaCategory, name: string) {
  // The upstream feed has occasionally split this item name across a space
  // ("Tyra nitarite"), which breaks both its display label and PokéAPI slug.
  if (category === "held_item" && /^tyra\s+nitarite$/i.test(name.trim())) {
    return "Tyranitarite";
  }
  return name;
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
