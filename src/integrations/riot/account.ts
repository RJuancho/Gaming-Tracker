import "server-only";

import { z } from "zod";

import { getRiotApiKey } from "@/integrations/riot/config";

const riotAccountSchema = z.object({
  puuid: z.string().min(1),
  gameName: z.string().min(1),
  tagLine: z.string().min(1),
});

const riotIdSchema = z.object({
  gameName: z.string().min(3).max(16),
  tagLine: z.string().min(3).max(5),
});

const routingRegionSchema = z.enum(["americas", "asia", "europe"]);

export type RiotAccount = z.infer<typeof riotAccountSchema>;
export type RiotRoutingRegion = z.infer<typeof routingRegionSchema>;

export class RiotApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

type GetRiotAccountInput = {
  gameName: string;
  tagLine: string;
  region?: RiotRoutingRegion;
};

export async function getRiotAccountByRiotId({
  gameName,
  tagLine,
  region = "asia",
}: GetRiotAccountInput): Promise<RiotAccount> {
  const riotId = riotIdSchema.parse({ gameName, tagLine });
  const routingRegion = routingRegionSchema.parse(region);
  const url = new URL(
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(riotId.gameName)}/${encodeURIComponent(riotId.tagLine)}`,
    `https://${routingRegion}.api.riotgames.com`,
  );

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Riot-Token": getRiotApiKey(),
    },
  });

  if (!response.ok) {
    const retryAfter = response.headers.get("Retry-After");

    throw new RiotApiError(
      getRiotErrorMessage(response.status),
      response.status,
      retryAfter === null ? null : Number(retryAfter),
    );
  }

  const payload: unknown = await response.json();

  return riotAccountSchema.parse(payload);
}

function getRiotErrorMessage(status: number) {
  switch (status) {
    case 401:
      return "The Riot API key is missing.";
    case 403:
      return "The Riot API key is invalid or expired.";
    case 404:
      return "No Riot account was found for that Riot ID.";
    case 429:
      return "The Riot API rate limit was reached.";
    default:
      return `The Riot API request failed with status ${status}.`;
  }
}

