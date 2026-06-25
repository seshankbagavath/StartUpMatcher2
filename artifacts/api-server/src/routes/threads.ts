/**
 * Founder ↔ investor messaging.
 *
 *  POST /threads                 — investor opens (or reuses) a thread about an idea
 *  GET  /threads                 — list my threads (as founder or investor)
 *  GET  /threads/:id/messages    — messages in a thread I'm part of
 *  POST /threads/:id/messages    — send a message in a thread I'm part of
 */
import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import {
  db,
  threadsTable,
  threadMessagesTable,
  ideasTable,
  usersTable,
} from "@workspace/db";
// usersTable is used for participant lookups and investor validation.
import { and, eq, or, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// `investorId` is optional: omit it for the investor-initiated flow (the
// current user is the investor); supply it for the founder-initiated flow
// (the founder messages a matched investor about their own idea).
const StartThreadBody = z.object({
  ideaId: z.string(),
  investorId: z.string().optional(),
});
const SendMessageBody = z.object({ body: z.string().min(1).max(4000) });

/** POST /threads — open (or reuse) a founder↔investor thread about an idea. */
router.post("/threads", requireAuth, async (req, res): Promise<void> => {
  const parsed = StartThreadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const me = req.userId!;
  const [idea] = await db
    .select()
    .from(ideasTable)
    .where(eq(ideasTable.id, parsed.data.ideaId))
    .limit(1);

  if (!idea) {
    res.status(404).json({ error: "Idea not found" });
    return;
  }

  // Resolve the two participants depending on who initiates.
  let founderId: string;
  let investorId: string;

  if (parsed.data.investorId) {
    // Founder-initiated: I must own the idea, and the target must be an investor.
    if (idea.userId !== me) {
      res.status(403).json({ error: "Only the idea's founder can start this thread" });
      return;
    }
    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, parsed.data.investorId))
      .limit(1);
    if (!target || target.role !== "investor") {
      res.status(404).json({ error: "Investor not found" });
      return;
    }
    founderId = me;
    investorId = target.id;
  } else {
    // Investor-initiated: idea must be public and not my own.
    if (!idea.isPublic) {
      res.status(404).json({ error: "Idea not found" });
      return;
    }
    if (idea.userId === me) {
      res.status(400).json({ error: "You can't message yourself about your own idea" });
      return;
    }
    founderId = idea.userId;
    investorId = me;
  }

  // Reuse an existing thread if one exists (unique on idea + investor)
  const [existing] = await db
    .select()
    .from(threadsTable)
    .where(and(eq(threadsTable.ideaId, idea.id), eq(threadsTable.investorId, investorId)))
    .limit(1);

  if (existing) {
    res.status(200).json(existing);
    return;
  }

  const [thread] = await db
    .insert(threadsTable)
    .values({ ideaId: idea.id, founderId, investorId })
    .returning();

  res.status(201).json(thread);
});

/** GET /threads — conversations I'm a participant in, newest first. */
router.get("/threads", requireAuth, async (req, res): Promise<void> => {
  const me = req.userId!;
  const rows = await db
    .select({
      id: threadsTable.id,
      ideaId: threadsTable.ideaId,
      ideaTitle: ideasTable.title,
      founderId: threadsTable.founderId,
      investorId: threadsTable.investorId,
      updatedAt: threadsTable.updatedAt,
    })
    .from(threadsTable)
    .innerJoin(ideasTable, eq(threadsTable.ideaId, ideasTable.id))
    .where(or(eq(threadsTable.founderId, me), eq(threadsTable.investorId, me)))
    .orderBy(desc(threadsTable.updatedAt));

  // Attach counterpart name + last message
  const result = await Promise.all(
    rows.map(async (t) => {
      const counterpartId = t.founderId === me ? t.investorId : t.founderId;
      const [counterpart] = await db
        .select({ name: usersTable.name, firm: usersTable.firm })
        .from(usersTable)
        .where(eq(usersTable.id, counterpartId))
        .limit(1);
      const [last] = await db
        .select({ body: threadMessagesTable.body, createdAt: threadMessagesTable.createdAt })
        .from(threadMessagesTable)
        .where(eq(threadMessagesTable.threadId, t.id))
        .orderBy(desc(threadMessagesTable.createdAt))
        .limit(1);
      return {
        id: t.id,
        ideaId: t.ideaId,
        ideaTitle: t.ideaTitle,
        role: t.founderId === me ? "founder" : "investor",
        counterpartName: counterpart?.name ?? "Unknown",
        counterpartFirm: counterpart?.firm ?? null,
        lastMessage: last?.body ?? null,
        updatedAt: t.updatedAt,
      };
    }),
  );

  res.json(result);
});

async function assertParticipant(threadId: string, userId: string) {
  const [thread] = await db
    .select()
    .from(threadsTable)
    .where(eq(threadsTable.id, threadId))
    .limit(1);
  if (!thread) return null;
  if (thread.founderId !== userId && thread.investorId !== userId) return null;
  return thread;
}

/** GET /threads/:id/messages */
router.get("/threads/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const thread = await assertParticipant(id!, req.userId!);
  if (!thread) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }

  const messages = await db
    .select({
      id: threadMessagesTable.id,
      senderId: threadMessagesTable.senderId,
      body: threadMessagesTable.body,
      createdAt: threadMessagesTable.createdAt,
    })
    .from(threadMessagesTable)
    .where(eq(threadMessagesTable.threadId, id!))
    .orderBy(threadMessagesTable.createdAt);

  res.json(messages.map((m) => ({ ...m, mine: m.senderId === req.userId })));
});

/** POST /threads/:id/messages */
router.post("/threads/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const thread = await assertParticipant(id!, req.userId!);
  if (!thread) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }

  const [msg] = await db
    .insert(threadMessagesTable)
    .values({ threadId: id!, senderId: req.userId!, body: parsed.data.body })
    .returning();

  // Bump thread updatedAt
  await db
    .update(threadsTable)
    .set({ updatedAt: new Date() })
    .where(eq(threadsTable.id, id!));

  res.status(201).json({ ...msg, mine: true });
});

export default router;
