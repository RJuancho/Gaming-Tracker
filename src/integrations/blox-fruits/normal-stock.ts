import "server-only";

import { z } from "zod";

const STOCK_ENDPOINT =
  "https://blox-fruitvalues.com/wp-json/bfvs/v1/stock";

export const STOCK_SOURCE_PAGE =
  "https://blox-fruitvalues.com/blox-fruit-stock/";

const stockItemSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  price: z.number().int().nonnegative(),
  robux: z.number().int().nonnegative(),
  type: z.string().trim().min(1),
  rarity: z.string().trim().min(1),
  image: z.url(),
});

const stockResponseSchema = z.object({
  current: z.object({
    normal: z.object({
      items: z.array(stockItemSchema).min(2),
      fetched_at: z.number().int().positive(),
      source: z.string().trim().min(1),
      status: z.string().trim().min(1),
    }),
  }),
  generated: z.number().int().positive(),
});

export type NormalStockItem = z.infer<typeof stockItemSchema>;

export type NormalStock = {
  items: NormalStockItem[];
  observedAt: Date;
  generatedAt: Date;
  sourceLabel: string;
  providerStatus: string;
  freshness: "current" | "outdated";
};

export async function getNormalStock(): Promise<NormalStock> {
  const response = await fetch(STOCK_ENDPOINT, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Normal stock provider returned ${response.status}.`);
  }

  const payload = stockResponseSchema.parse(await response.json());
  const normal = payload.current.normal;
  const observedAt = fromUnixSeconds(normal.fetched_at);
  const generatedAt = fromUnixSeconds(payload.generated);

  return {
    items: normal.items,
    observedAt,
    generatedAt,
    sourceLabel: normal.source,
    providerStatus: normal.status,
    freshness: isCurrent(normal.status, observedAt)
      ? "current"
      : "outdated",
  };
}

export function getNextNormalStockRotation(now = new Date()) {
  const rotationHours = 4;
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(
    Math.floor(now.getUTCHours() / rotationHours) * rotationHours +
      rotationHours,
  );
  return next;
}

function fromUnixSeconds(value: number) {
  const date = new Date(value * 1_000);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Normal stock provider returned an invalid timestamp.");
  }
  return date;
}

function isCurrent(providerStatus: string, observedAt: Date) {
  const maximumAgeMs = 4.5 * 60 * 60 * 1_000;
  const ageMs = Date.now() - observedAt.getTime();
  return (
    providerStatus.toLowerCase() === "current" &&
    ageMs >= 0 &&
    ageMs <= maximumAgeMs
  );
}

