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

type Database = ReturnType<typeof createClient>;

const globalForDatabase = globalThis as typeof globalThis & {
  gamingTrackerDatabase?: Database;
};

function getDatabase(): Database {
  if (!globalForDatabase.gamingTrackerDatabase) {
    globalForDatabase.gamingTrackerDatabase = createClient();
  }

  return globalForDatabase.gamingTrackerDatabase;
}

// Delay DATABASE_URL validation until a database operation is actually used.
// This lets routes that do not need persistence (for example a production
// endpoint intentionally disabled by policy) build without database secrets.
export const database = new Proxy({} as Database, {
  get(_target, property) {
    return Reflect.get(getDatabase(), property);
  },
});
