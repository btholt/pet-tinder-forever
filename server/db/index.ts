import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.ts";
import * as authSchema from "./auth-schema.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const host = new URL(connectionString).hostname;
const useSsl = host.endsWith(".render.com");

export const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

// pg emits 'error' on the pool when an *idle* client's connection drops
// (network blip, the DB restarting, an admin killing the connection). With
// no listener, Node treats that as an unhandled EventEmitter error and
// crashes the whole process. Log and let the pool recover instead.
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
});

export const db = drizzle(pool, { schema: { ...schema, ...authSchema } });
