/**
 * POST /evaluate-idea
 * Scores a startup idea across 4 dimensions (Groq when configured, local
 * heuristic otherwise) and persists the sub-scores when an ideaId is provided.
 */
import { Router, type IRouter } from "express";
import { EvaluateIdeaBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { db, ideasTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { evaluateIdea } from "../lib/ai";

const router: IRouter = Router();

router.post("/evaluate-idea", requireAuth, async (req, res): Promise<void> => {
  const parsed = EvaluateIdeaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, description, target_users, problem, demoLink, ideaId } =
    parsed.data;

  const result = await evaluateIdea({
    name,
    description,
    target_users,
    problem,
    demoLink,
  });

  // Persist sub-scores to the idea when we have its id
  if (ideaId) {
    try {
      await db
        .update(ideasTable)
        .set({
          evaluationScore: result.total_score,
          evaluationFeedback: result.feedback,
          problemClarity: result.problem_clarity,
          marketSize: result.market_size,
          innovationScore: result.innovation,
          executionPotential: result.execution_potential,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          suggestions: result.suggestions,
          marketPotential: result.market_potential,
        })
        .where(
          and(eq(ideasTable.id, ideaId), eq(ideasTable.userId, req.userId!)),
        );
    } catch (err) {
      req.log.warn({ err }, "DB sub-score update failed");
    }
  }

  res.json(result);
});

export default router;
