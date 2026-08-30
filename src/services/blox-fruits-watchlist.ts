import "server-only";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { database } from "@/db/client";
import { bloxFruitsWatchlist } from "@/db/schema";

export const fruitNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[a-zA-Z][a-zA-Z -]*$/, "Use a valid fruit name.")
  .transform(toDisplayName);

export async function listWatchedFruits() {
  return database
    .select()
    .from(bloxFruitsWatchlist)
    .where(eq(bloxFruitsWatchlist.enabled, true))
    .orderBy(asc(bloxFruitsWatchlist.fruitName));
}

export async function addWatchedFruit(rawName: unknown) {
  const fruitName = fruitNameSchema.parse(rawName);
  await database
    .insert(bloxFruitsWatchlist)
    .values({ fruitName, enabled: true })
    .onConflictDoUpdate({
      target: bloxFruitsWatchlist.fruitName,
      set: { enabled: true },
    });
}

export async function removeWatchedFruit(rawId: unknown) {
  const id = z.coerce.number().int().positive().parse(rawId);
  await database
    .delete(bloxFruitsWatchlist)
    .where(eq(bloxFruitsWatchlist.id, id));
}

function toDisplayName(value: string) {
  return value
    .toLowerCase()
    .split(/([ -])/) 
    .map((part) => (part === " " || part === "-" ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

