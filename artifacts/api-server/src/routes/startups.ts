/**
 * GET /get-startups
 * Browse public startup ideas across all users.
 * Supports search, category, and stage filtering.
 */
import { Router, type IRouter } from "express";
import { db, ideasTable, usersTable } from "@workspace/db";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import { GetStartupsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/get-startups", async (req, res): Promise<void> => {
  const parsed = GetStartupsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, category, stage } = parsed.data;

  // Build filter conditions
  const conditions: SQL[] = [eq(ideasTable.isPublic, true)];

  if (search) {
    conditions.push(ilike(ideasTable.title, `%${search}%`));
  }
  if (category) {
    conditions.push(ilike(ideasTable.category, `%${category}%`));
  }
  if (stage) {
    // Stage must match exactly from the enum
    const validStages = ["idea", "mvp", "growth", "scale"] as const;
    type IdeaStage = typeof validStages[number];
    if (validStages.includes(stage as IdeaStage)) {
      conditions.push(eq(ideasTable.stage, stage as IdeaStage));
    }
  }

  const rows = await db
    .select({
      id: ideasTable.id,
      title: ideasTable.title,
      description: ideasTable.description,
      category: ideasTable.category,
      stage: ideasTable.stage,
      evaluationScore: ideasTable.evaluationScore,
      founderName: usersTable.name,
      founderId: ideasTable.userId,
      createdAt: ideasTable.createdAt,
    })
    .from(ideasTable)
    .innerJoin(usersTable, eq(ideasTable.userId, usersTable.id))
    .where(and(...conditions))
    .orderBy(ideasTable.createdAt)
    .limit(50);

  res.json(rows);
});

export default router;
