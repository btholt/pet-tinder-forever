import { Router } from "express";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.ts";
import { pets, swipes } from "../db/schema.ts";
import { requireAuth } from "../middleware/requireAuth.ts";
import { toPet, type Pet } from "../../shared/types.ts";

export const petsRouter = Router();

const queueQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

petsRouter.get("/queue", requireAuth, async (req, res, next) => {
  try {
    const parsed = queueQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid query" });
      return;
    }
    const { limit } = parsed.data;
    const userId = req.user!.id;

    const swipedPetIds = db
      .select({ petId: swipes.petId })
      .from(swipes)
      .where(eq(swipes.userId, userId));

    // Stable pseudo-random order per user: hash(userId + petId) so the
    // ordering is deterministic across refetches without persisting it.
    const order = sql`md5(${userId} || ${pets.id}::text)`;

    const rows = await db
      .select()
      .from(pets)
      .where(notInArray(pets.id, swipedPetIds))
      .orderBy(order)
      .limit(limit);

    const body: Pet[] = rows.map(toPet);
    res.json(body);
  } catch (err) {
    next(err);
  }
});

export const matchesRouter = Router();

matchesRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const rows = await db
      .select({ pet: pets, swipedAt: swipes.createdAt })
      .from(swipes)
      .innerJoin(pets, eq(swipes.petId, pets.id))
      .where(and(eq(swipes.userId, userId), eq(swipes.direction, "like")))
      .orderBy(sql`${swipes.createdAt} desc`);

    const body: Pet[] = rows.map((r) => toPet(r.pet));
    res.json(body);
  } catch (err) {
    next(err);
  }
});
