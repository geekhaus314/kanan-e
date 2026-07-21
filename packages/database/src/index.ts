import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  client: postgres.Sql | undefined;
  db: ReturnType<typeof drizzle> | undefined;
};

function getDb() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (globalForDb.client && globalForDb.db) {
    return globalForDb.db;
  }

  try {
    globalForDb.client = postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    globalForDb.db = drizzle(globalForDb.client, { schema });
    return globalForDb.db;
  } catch {
    return null;
  }
}

export const db = getDb();
export { schema };
export * from "./schema";
