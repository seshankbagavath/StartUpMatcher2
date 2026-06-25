/**
 * Profile routes — view and edit the current user's profile.
 *
 *  GET /profile   — full profile (incl. investor firm/bio/interests + counts)
 *  PUT /profile   — update name and, for investors, firm/bio/interests
 */
import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { db, usersTable, ideasTable, threadsTable } from "@workspace/db";
import { eq, or, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const UpdateProfileBody = z.object({
  name: z.string().min(2).max(120).optional(),
  firm: z.string().max(160).nullish(),
  bio: z.string().max(2000).nullish(),
  interests: z.array(z.string().min(1).max(60)).max(20).optional(),
});

async function loadProfile(userId: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) return null;

  const [{ ideaCount }] = await db
    .select({ ideaCount: count() })
    .from(ideasTable)
    .where(eq(ideasTable.userId, userId));

  const [{ threadCount }] = await db
    .select({ threadCount: count() })
    .from(threadsTable)
    .where(or(eq(threadsTable.founderId, userId), eq(threadsTable.investorId, userId)));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    firm: user.firm,
    bio: user.bio,
    interests: user.interests ?? [],
    createdAt: user.createdAt,
    stats: { ideas: Number(ideaCount), conversations: Number(threadCount) },
  };
}

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  const profile = await loadProfile(req.userId!);
  if (!profile) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(profile);
});

router.put("/profile", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, firm, bio, interests } = parsed.data;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (firm !== undefined) updates.firm = firm;
  if (bio !== undefined) updates.bio = bio;
  if (interests !== undefined) updates.interests = interests;

  if (Object.keys(updates).length > 0) {
    await db.update(usersTable).set(updates).where(eq(usersTable.id, req.userId!));
  }

  const profile = await loadProfile(req.userId!);
  res.json(profile);
});

export default router;
