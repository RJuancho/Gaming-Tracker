import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const riotAccounts = pgTable(
  "riot_accounts",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    puuid: text("puuid").notNull(),
    gameName: text("game_name").notNull(),
    tagLine: text("tag_line").notNull(),
    platform: text("platform").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("riot_accounts_puuid_unique").on(table.puuid)],
);

export const tftRankSnapshots = pgTable(
  "tft_rank_snapshots",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    riotAccountId: bigint("riot_account_id", { mode: "number" })
      .notNull()
      .references(() => riotAccounts.id, { onDelete: "cascade" }),
    queueType: text("queue_type").notNull(),
    status: text("status").notNull(),
    tier: text("tier"),
    division: text("division"),
    leaguePoints: integer("league_points"),
    wins: integer("wins"),
    losses: integer("losses"),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tft_rank_snapshots_account_queue_captured_idx").on(
      table.riotAccountId,
      table.queueType,
      table.capturedAt,
    ),
    check(
      "tft_rank_snapshots_status_check",
      sql`${table.status} in ('placements', 'ranked')`,
    ),
    check(
      "tft_rank_snapshots_rank_fields_check",
      sql`(
        ${table.status} = 'placements'
        and ${table.tier} is null
        and ${table.division} is null
        and ${table.leaguePoints} is null
        and ${table.wins} is null
        and ${table.losses} is null
      ) or (
        ${table.status} = 'ranked'
        and ${table.tier} is not null
        and ${table.division} is not null
        and ${table.leaguePoints} is not null
        and ${table.wins} is not null
        and ${table.losses} is not null
      )`,
    ),
    check(
      "tft_rank_snapshots_nonnegative_values_check",
      sql`coalesce(${table.leaguePoints}, 0) >= 0
        and coalesce(${table.wins}, 0) >= 0
        and coalesce(${table.losses}, 0) >= 0`,
    ),
  ],
);

export const tftMetaSnapshots = pgTable(
  "tft_meta_snapshots",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    source: text("source").notNull(),
    platform: text("platform").notNull(),
    patch: text("patch").notNull(),
    setNumber: integer("set_number").notNull(),
    sampledPlayers: integer("sampled_players").notNull(),
    sampledMatches: integer("sampled_matches").notNull(),
    sampleDate: date("sample_date", { mode: "string" }),
    windowStart: timestamp("window_start", { withTimezone: true }),
    windowEnd: timestamp("window_end", { withTimezone: true }),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tft_meta_snapshots_patch_captured_idx").on(
      table.patch,
      table.setNumber,
      table.capturedAt,
    ),
    uniqueIndex("tft_meta_snapshots_source_platform_date_unique").on(
      table.source,
      table.platform,
      table.sampleDate,
    ),
    check(
      "tft_meta_snapshots_window_check",
      sql`(
        ${table.sampleDate} is null
        and ${table.windowStart} is null
        and ${table.windowEnd} is null
      ) or (
        ${table.sampleDate} is not null
        and ${table.windowStart} is not null
        and ${table.windowEnd} is not null
        and ${table.windowStart} < ${table.windowEnd}
      )`,
    ),
    check("tft_meta_snapshots_counts_check", sql`${table.sampledPlayers} >= 0 and ${table.sampledMatches} >= 0`),
  ],
);

export const tftMetaCompositions = pgTable(
  "tft_meta_compositions",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    snapshotId: bigint("snapshot_id", { mode: "number" })
      .notNull()
      .references(() => tftMetaSnapshots.id, { onDelete: "cascade" }),
    signature: text("signature").notNull(),
    rank: integer("rank").notNull(),
    games: integer("games").notNull(),
    wins: integer("wins").notNull(),
    topFours: integer("top_fours").notNull(),
    averagePlacement: integer("average_placement_basis_points").notNull(),
    units: text("units").array().notNull().default(sql`array[]::text[]`),
    traits: text("traits").array().notNull().default(sql`array[]::text[]`),
  },
  (table) => [
    index("tft_meta_compositions_snapshot_rank_idx").on(
      table.snapshotId,
      table.rank,
    ),
    check("tft_meta_compositions_rank_check", sql`${table.rank} > 0`),
    check(
      "tft_meta_compositions_counts_check",
      sql`${table.games} > 0 and ${table.wins} >= 0 and ${table.topFours} >= 0 and ${table.wins} <= ${table.games} and ${table.topFours} <= ${table.games}`,
    ),
  ],
);

export const pokemonTeams = pgTable(
  "pokemon_teams",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    format: text("format").notNull(),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "pokemon_teams_format_check",
      sql`${table.format} in ('Singles', 'Doubles')`,
    ),
  ],
);

export const bloxFruitsWatchlist = pgTable(
  "blox_fruits_watchlist",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    fruitName: text("fruit_name").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("blox_fruits_watchlist_fruit_name_unique").on(table.fruitName),
  ],
);

export const pokemonTeamMembers = pgTable(
  "pokemon_team_members",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    teamId: bigint("team_id", { mode: "number" })
      .notNull()
      .references(() => pokemonTeams.id, { onDelete: "cascade" }),
    slot: integer("slot").notNull(),
    pokemonId: text("pokemon_id").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role").notNull(),
    ability: text("ability"),
    heldItem: text("held_item"),
    nature: text("nature"),
    moves: text("moves").array().notNull().default(sql`array[]::text[]`),
    hpPoints: integer("hp_points").notNull().default(0),
    attackPoints: integer("attack_points").notNull().default(0),
    defensePoints: integer("defense_points").notNull().default(0),
    specialAttackPoints: integer("special_attack_points").notNull().default(0),
    specialDefensePoints: integer("special_defense_points").notNull().default(0),
    speedPoints: integer("speed_points").notNull().default(0),
    notes: text("notes").notNull().default(""),
  },
  (table) => [
    uniqueIndex("pokemon_team_members_team_slot_unique").on(
      table.teamId,
      table.slot,
    ),
    check(
      "pokemon_team_members_slot_check",
      sql`${table.slot} between 1 and 6`,
    ),
    check(
      "pokemon_team_members_moves_check",
      sql`cardinality(${table.moves}) <= 4`,
    ),
    check(
      "pokemon_team_members_nonnegative_points_check",
      sql`${table.hpPoints} >= 0
        and ${table.attackPoints} >= 0
        and ${table.defensePoints} >= 0
        and ${table.specialAttackPoints} >= 0
        and ${table.specialDefensePoints} >= 0
        and ${table.speedPoints} >= 0`,
    ),
  ],
);

export type RiotAccount = typeof riotAccounts.$inferSelect;
export type NewRiotAccount = typeof riotAccounts.$inferInsert;
export type TftRankSnapshot = typeof tftRankSnapshots.$inferSelect;
export type NewTftRankSnapshot = typeof tftRankSnapshots.$inferInsert;
export type TftMetaSnapshot = typeof tftMetaSnapshots.$inferSelect;
export type NewTftMetaSnapshot = typeof tftMetaSnapshots.$inferInsert;
export type TftMetaComposition = typeof tftMetaCompositions.$inferSelect;
export type NewTftMetaComposition = typeof tftMetaCompositions.$inferInsert;
export type BloxFruitsWatchlistEntry = typeof bloxFruitsWatchlist.$inferSelect;
export type NewBloxFruitsWatchlistEntry = typeof bloxFruitsWatchlist.$inferInsert;
export type PokemonTeam = typeof pokemonTeams.$inferSelect;
export type NewPokemonTeam = typeof pokemonTeams.$inferInsert;
export type PokemonTeamMember = typeof pokemonTeamMembers.$inferSelect;
export type NewPokemonTeamMember = typeof pokemonTeamMembers.$inferInsert;

