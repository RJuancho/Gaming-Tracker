import { z } from "zod";

const accountRegion = z.enum(["asia", "americas", "europe"]).catch("asia").parse(process.env.RIOT_ACCOUNT_REGION);
const platform = z.literal("sg2").catch("sg2").parse(process.env.RIOT_PLATFORM);
const matchRegion = z.literal("sea").catch("sea").parse(process.env.RIOT_MATCH_REGION);

export const personalRiotProfile = {
  gameName: process.env.RIOT_GAME_NAME ?? "",
  tagLine: (process.env.RIOT_TAG_LINE ?? "").replace(/^#/, ""),
  accountRegion,
  platform,
  matchRegion,
} as const;
