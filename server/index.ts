import path from "node:path";
import { fileURLToPath } from "node:url";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.ts";
import { pool } from "./db/index.ts";
import { requireAuth } from "./middleware/requireAuth.ts";
import { petsRouter, matchesRouter } from "./routes/pets.ts";
import { swipesRouter } from "./routes/swipes.ts";
import type { MeResponse } from "../shared/types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Better Auth needs the raw request body, so its handler must be mounted
// BEFORE express.json() — see CLAUDE.md §11.
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.get("/api/me", requireAuth, (req, res) => {
  const body: MeResponse = { user: req.user! };
  res.json(body);
});

app.use("/api/pets", petsRouter);
app.use("/api/swipes", swipesRouter);
app.use("/api/matches", matchesRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "not found" });
});

if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(__dirname, "public");
  app.use(express.static(clientDist));

  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Catch-all error handler: log server-side, never leak stack traces to the client.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});
