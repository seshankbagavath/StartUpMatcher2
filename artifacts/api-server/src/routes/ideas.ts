/**
 * Idea routes — CRUD for startup ideas belonging to the current user.
 */
import { Router, type IRouter } from "express";
import { db, ideasTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateIdeaBody, GetIdeaParams, DeleteIdeaParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

/** GET /ideas — list authenticated user's ideas */
router.get("/ideas", requireAuth, async (req, res): Promise<void> => {
  const ideas = await db
    .select()
    .from(ideasTable)
    .where(eq(ideasTable.userId, req.userId!))
    .orderBy(ideasTable.createdAt);

  res.json(ideas);
});

/** POST /ideas — create a new idea */
router.post("/ideas", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateIdeaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [idea] = await db
    .insert(ideasTable)
    .values({ ...parsed.data, userId: req.userId! })
    .returning();

  res.status(201).json(idea);
});

/** GET /ideas/:id */
router.get("/ideas/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetIdeaParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [idea] = await db
    .select()
    .from(ideasTable)
    .where(and(eq(ideasTable.id, params.data.id), eq(ideasTable.userId, req.userId!)))
    .limit(1);

  if (!idea) {
    res.status(404).json({ error: "Idea not found" });
    return;
  }

  res.json(idea);
});

/** DELETE /ideas/:id */
router.delete("/ideas/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteIdeaParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(ideasTable)
    .where(and(eq(ideasTable.id, params.data.id), eq(ideasTable.userId, req.userId!)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Idea not found" });
    return;
  }

  res.json({ message: "Idea deleted successfully" });
});

export default router;
