import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index.ts";

async function main() {
  console.log("Applying pending migrations from ./drizzle ...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully.");
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err: unknown) => {
    console.error("Migration failed:", err);
    await pool.end();
    process.exit(1);
  });
