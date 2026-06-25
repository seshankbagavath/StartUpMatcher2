/**
 * Express middleware that validates the session token from the
 * Authorization header and attaches the userId to req.
 */
import type { Request, Response, NextFunction } from "express";
import { db, sessionsTable } from "@workspace/db";
import { eq, gt } from "drizzle-orm";
import { extractBearerToken } from "../lib/auth";

// Extend Express Request to carry the authenticated userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.token, token))
    .limit(1);

  if (!session || session.expiresAt < new Date()) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  req.userId = session.userId;
  next();
}
