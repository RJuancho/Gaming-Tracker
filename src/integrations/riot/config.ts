import "server-only";

import { z } from "zod";

const riotApiKeySchema = z.string().min(1, "RIOT_API_KEY is required");

export function getRiotApiKey() {
  const result = riotApiKeySchema.safeParse(process.env.RIOT_API_KEY);

  if (!result.success) {
    throw new Error(
      "RIOT_API_KEY is missing. Add it to .env.local before using the Riot integration.",
    );
  }

  return result.data;
}

