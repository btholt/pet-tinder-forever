import { sql } from "drizzle-orm";
import { db, pool } from "./index.ts";
import { pets } from "./schema.ts";
import { petsSeedData } from "./seed-data.ts";

/**
 * Idempotent seeder.
 *
 * Default: inserts the 60 hand-authored pets only when the `pets` table is
 * empty. `--force` truncates `pets` (cascading to `swipes`) and reseeds. The
 * destructive path refuses to run in production unless the operator
 * explicitly opts in with ALLOW_DESTRUCTIVE_SEED=1.
 */

async function main() {
  const force = process.argv.includes("--force");

  if (force) {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_DESTRUCTIVE_SEED !== "1"
    ) {
      console.error(
        "Refusing to run --force seed in production without ALLOW_DESTRUCTIVE_SEED=1."
      );
      process.exitCode = 1;
      return;
    }
    console.log("Truncating pets (cascades to swipes) ...");
    await db.execute(sql`truncate table "pets" restart identity cascade`);
  }

  const existing = await db.select({ id: pets.id }).from(pets).limit(1);
  if (existing.length > 0 && !force) {
    console.log("pets table already has rows; skipping seed (no-op).");
    return;
  }

  const rows = petsSeedData.map((pet) => ({
    ...pet,
    shelterName: pet.shelterName ?? `${pet.city} Humane Society`,
  }));

  console.log(`Inserting ${petsSeedData.length} pets ...`);
  await db.insert(pets).values(rows);
  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
