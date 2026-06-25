/**
 * Dashboard routes — summary stats and recent activity for the current user.
 */
import { Router, type IRouter } from "express";
import { db, ideasTable } from "@workspace/db";
import { eq, count, avg, and, isNotNull } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

type ActivityType = "idea_submitted" | "idea_evaluated" | "investor_matched";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  createdAt: Date;
}

/** GET /dashboard/summary */
router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const [stats] = await db
    .select({
      totalIdeas: count(),
      averageScore: avg(ideasTable.evaluationScore),
      avgProblemClarity: avg(ideasTable.problemClarity),
      avgMarketSize: avg(ideasTable.marketSize),
      avgInnovation: avg(ideasTable.innovationScore),
      avgExecutionPotential: avg(ideasTable.executionPotential),
    })
    .from(ideasTable)
    .where(eq(ideasTable.userId, userId));

  const [evaluated] = await db
    .select({ count: count() })
    .from(ideasTable)
    .where(and(eq(ideasTable.userId, userId), isNotNull(ideasTable.evaluationScore)));

  // Find top category by count
  const categoryRows = await db
    .select({ category: ideasTable.category, count: count() })
    .from(ideasTable)
    .where(eq(ideasTable.userId, userId))
    .groupBy(ideasTable.category)
    .orderBy(count())
    .limit(1);

  const topCategory = categoryRows[0]?.category ?? null;

  const toNum = (v: unknown) => (v != null ? Number(v) : null);

  res.json({
    totalIdeas: Number(stats?.totalIdeas ?? 0),
    evaluatedIdeas: Number(evaluated?.count ?? 0),
    averageScore: toNum(stats?.averageScore),
    topCategory,
    investorMatches: 0,
    avgBreakdown: {
      problemClarity: toNum(stats?.avgProblemClarity),
      marketSize: toNum(stats?.avgMarketSize),
      innovation: toNum(stats?.avgInnovation),
      executionPotential: toNum(stats?.avgExecutionPotential),
    },
  });
});

/** GET /dashboard/recent-activity */
router.get("/dashboard/recent-activity", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const ideas = await db
    .select()
    .from(ideasTable)
    .where(eq(ideasTable.userId, userId))
    .orderBy(ideasTable.createdAt)
    .limit(10);

  const activity: ActivityItem[] = [];

  for (const idea of ideas) {
    activity.push({
      id: `submitted-${idea.id}`,
      type: "idea_submitted",
      title: "Idea Submitted",
      description: `You submitted "${idea.title}"`,
      createdAt: idea.createdAt,
    });

    if (idea.evaluationScore !== null) {
      activity.push({
        id: `evaluated-${idea.id}`,
        type: "idea_evaluated",
        title: "Idea Evaluated",
        description: `"${idea.title}" scored ${idea.evaluationScore}/100`,
        createdAt: idea.updatedAt,
      });
    }
  }

  // Sort by date descending
  activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(activity.slice(0, 10));
});

export default router;
