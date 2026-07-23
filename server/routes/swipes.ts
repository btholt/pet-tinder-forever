import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.ts";
import { pets, swipes } from "../db/schema.ts";
import { requireAuth } from "../middleware/requireAuth.ts";
import type { SwipeResponse } from "../../shared/types.ts";

export const swipesRouter = Router();

const swipeBodySchema = z.object({
  petId: z.number().int().positive(),
  direction: z.enum(["like", "pass"]),
});

swipesRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = swipeBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid body" });
      return;
    }
    const { petId, direction } = parsed.data;
    const userId = req.user!.id;

    const [pet] = await db
      .select({ id: pets.id })
      .from(pets)
      .where(eq(pets.id, petId))
      .limit(1);
    if (!pet) {
      res.status(404).json({ error: "pet not found" });
      return;
    }

    await db
      .insert(swipes)
      .values({ userId, petId, direction })
      .onConflictDoUpdate({
        target: [swipes.userId, swipes.petId],
        set: { direction, createdAt: new Date() },
      });

    const body: SwipeResponse = { matched: direction === "like" };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

const petIdParamSchema = z.coerce.number().int().positive();

swipesRouter.delete("/:petId", requireAuth, async (req, res, next) => {
  try {
    const parsed = petIdParamSchema.safeParse(req.params.petId);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid pet id" });
      return;
    }
    const petId = parsed.data;
    const userId = req.user!.id;

    await db
      .delete(swipes)
      .where(and(eq(swipes.userId, userId), eq(swipes.petId, petId)));

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
