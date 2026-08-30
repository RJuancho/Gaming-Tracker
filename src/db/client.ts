import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";

import * as schema from "./schema";

const databaseUrlSchema = z.url().startsWith("postgres");

function createClient() {
  const databaseUrl = databaseUrlSchema.parse(process.env.DATABASE_URL);
  const queryClient = postgres(databaseUrl, { max: 5 });

  return drizzle(queryClient, { schema });
}

const globalForDatabase = globalThis as typeof globalThis & {
  gamingTrackerDatabase?: ReturnType<typeof createClient>;
};

export const database =
  globalForDatabase.gamingTrackerDatabase ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.gamingTrackerDatabase = database;
}

