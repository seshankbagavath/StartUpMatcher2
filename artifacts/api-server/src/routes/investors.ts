/**
 * POST /match-investors
 * GET  /dashboard/investor-matches
 *
 * Ranks investors using a lexical embedding + cosine similarity, then generates
 * concise match explanations (Groq when configured, templated otherwise).
 *
 * Efficiency decisions:
 *  - Investor embeddings are cached in the DB; only missing ones are computed.
 *  - All three match explanations are generated in ONE chat completion call.
 *  - The idea is embedded once per request (no caching needed — always fresh).
 */
import { Router, type IRouter } from "express";
import { db, investorsTable, ideasTable, usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { MatchInvestorsBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { localEmbed, cosine, explainMatches } from "../lib/ai";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const SEED_INVESTORS = [
  { name: "Sarah Chen",    firm: "Horizon Ventures",       interests: ["SaaS", "AI", "Machine Learning", "Developer Tools", "B2B"],                    riskLevel: "high"   as const, bio: "Sarah leads early-stage bets on infrastructure and developer-facing products. Former engineer at Stripe.",              contactHint: "sarah@horizonvc.com — mention your tech stack" },
  { name: "Marcus Williams", firm: "BlueSky Capital",      interests: ["FinTech", "Payments", "Banking", "Crypto", "Finance"],                          riskLevel: "medium" as const, bio: "Marcus backs founders reshaping financial infrastructure. 3 unicorn exits. Based in NYC.",                          contactHint: "Apply via BlueSky Capital portfolio form" },
  { name: "Priya Patel",   firm: "HealthFirst Fund",       interests: ["HealthTech", "MedTech", "Mental Health", "Wellness", "Biotech"],                riskLevel: "medium" as const, bio: "Priya was a practicing physician before pivoting to VC. She looks for founders who lived the problem.",              contactHint: "priya@healthfirstfund.com — include clinical validation data if any" },
  { name: "Jake Morrison",  firm: "Scale Partners",         interests: ["E-Commerce", "Consumer", "Marketplace", "D2C", "Retail"],                      riskLevel: "low"    as const, bio: "Jake focuses on growth-stage consumer companies with proven retention. Built and sold two D2C brands.",             contactHint: "Warm intro preferred via LinkedIn" },
  { name: "Aiko Tanaka",   firm: "Deep Tech Ventures",     interests: ["AI", "Climate Tech", "Robotics", "Deep Tech", "Sustainability", "Machine Learning"], riskLevel: "high" as const, bio: "Aiko invests at the frontier — long-term bets on science-driven companies. PhD in computational biology.",      contactHint: "aiko@deeptechvc.io — attach a technical white-paper" },
  { name: "David Okafor",  firm: "Emerging Markets Fund",  interests: ["EdTech", "Education", "AgriTech", "Logistics", "Impact", "Emerging Markets"],   riskLevel: "medium" as const, bio: "David backs founders building for under-served markets globally. Partner at Africa-focused growth fund.",          contactHint: "david@emfund.co — share your go-to-market plan" },
  { name: "Lena Schultz",  firm: "Enterprise Catalyst",    interests: ["SaaS", "CyberSecurity", "Security", "DevOps", "Enterprise", "B2B"],             riskLevel: "low"    as const, bio: "Lena focuses on B2B SaaS with enterprise contracts and strong NRR. Former Salesforce VP.",                        contactHint: "enterprise-catalyst.com/apply — include ARR and top 3 customers" },
  { name: "Omar Hassan",   firm: "Social Impact Capital",  interests: ["EdTech", "HealthTech", "Climate Tech", "Social Impact", "Non-profit", "Sustainability"], riskLevel: "low" as const, bio: "Omar backs mission-driven founders at earliest stages. Formerly ran grant programs at Gates Foundation.",  contactHint: "omar@sicapital.org — emphasize social impact metrics" },
  { name: "Nina Rodriguez", firm: "Consumer Alpha",         interests: ["Social Media", "Creator Economy", "Gaming", "Entertainment", "Media", "Consumer"], riskLevel: "high" as const, bio: "Nina invests in products people love. Former product lead at TikTok and Spotify.",                              contactHint: "nina@consumeralpha.vc — share engagement metrics and growth curves" },
  { name: "Tom Baker",     firm: "PropTech Capital",       interests: ["Real Estate", "PropTech", "Construction", "Smart Cities", "Infrastructure"],    riskLevel: "medium" as const, bio: "Tom backs founders transforming how we build, rent, and manage spaces. Former real estate developer.",             contactHint: "tom@proptechcap.io — include pilot traction with property managers" },
];

async function ensureSeeded(): Promise<void> {
  const [{ total }] = await db.select({ total: count() }).from(investorsTable);
  if (Number(total) === 0) {
    await db.insert(investorsTable).values(SEED_INVESTORS);
  }
}

// ---------------------------------------------------------------------------
// Candidate pool — seeded archetypes + registered investor users
// ---------------------------------------------------------------------------
interface Candidate {
  id: string;
  name: string;
  firm: string;
  interests: string[];
  riskLevel: "low" | "medium" | "high";
  bio: string;
  contactHint: string;
  vec: number[];
  userId: string | null;
  registered: boolean;
}

/** Lexical embedding for an investor — interests weighted over bio. */
function investorVec(interests: string[], bio: string): number[] {
  const interestText = Array(3).fill(interests.join(" ")).join(" ");
  return localEmbed(`${interestText}. ${bio}`);
}

/** Seeded archetypes, with embeddings cached in the DB (computed once). */
async function loadSeededCandidates(): Promise<Candidate[]> {
  await ensureSeeded();
  const rows = await db.select().from(investorsTable);

  const missing = rows.filter((r) => r.embedding === null);
  if (missing.length > 0) {
    await Promise.all(
      missing.map(async (inv) => {
        inv.embedding = JSON.stringify(investorVec(inv.interests, inv.bio));
        await db
          .update(investorsTable)
          .set({ embedding: inv.embedding })
          .where(eq(investorsTable.id, inv.id));
      }),
    );
  }

  return rows.map((inv) => ({
    id: inv.id,
    name: inv.name,
    firm: inv.firm,
    interests: inv.interests,
    riskLevel: inv.riskLevel,
    bio: inv.bio,
    contactHint: inv.contactHint,
    vec: JSON.parse(inv.embedding!) as number[],
    userId: null,
    registered: false,
  }));
}

/** Registered investor users with enough profile to match on. */
async function loadRegisteredCandidates(): Promise<Candidate[]> {
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "investor"));

  return rows
    .filter((u) => (u.interests?.length ?? 0) > 0 || (u.bio?.trim()?.length ?? 0) > 0)
    .map((u) => {
      const interests = u.interests ?? [];
      const bio = u.bio ?? "";
      return {
        id: u.id,
        name: u.name,
        firm: u.firm ?? "Independent",
        interests,
        riskLevel: "medium" as const,
        bio,
        contactHint: "Registered on LiftOff — message directly",
        vec: investorVec(interests, bio),
        userId: u.id,
        registered: true,
      };
    });
}

// ---------------------------------------------------------------------------
// Core matching logic (shared by both endpoints)
// ---------------------------------------------------------------------------
interface MatchedInvestor {
  id: string;
  name: string;
  firm: string;
  interests: string[];
  riskLevel: "low" | "medium" | "high";
  matchScore: number;
  whyMatch: string;
  bio: string;
  contactHint: string;
  userId: string | null;
  registered: boolean;
}

async function runMatching(ideaText: string, limit = 3): Promise<MatchedInvestor[]> {
  const ideaVec = localEmbed(ideaText);
  const [seeded, registered] = await Promise.all([
    loadSeededCandidates(),
    loadRegisteredCandidates(),
  ]);

  // Score and rank the combined pool. Give registered investors a small boost
  // so real, reachable people surface above equivalent archetypes.
  const ranked = [...seeded, ...registered]
    .map((c) => {
      const raw = Math.max(0, cosine(ideaVec, c.vec));
      let matchScore = raw <= 0 ? 0 : Math.min(99, Math.round(raw * 190 + 35));
      if (c.registered && matchScore > 0) matchScore = Math.min(99, matchScore + 4);
      return { ...c, matchScore };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);

  if (ranked.length === 0) return [];

  // Generate explanations for all top matches in one call (Groq or templated)
  const explanations = await explainMatches(ideaText, ranked);

  return ranked.map((c, i) => ({
    id: c.id,
    name: c.name,
    firm: c.firm,
    interests: c.interests,
    riskLevel: c.riskLevel,
    matchScore: c.matchScore,
    whyMatch: explanations[i] ?? "Strong alignment with this idea's focus area.",
    bio: c.bio,
    contactHint: c.contactHint,
    userId: c.userId,
    registered: c.registered,
  }));
}

// ---------------------------------------------------------------------------
// POST /match-investors
// ---------------------------------------------------------------------------
router.post("/match-investors", requireAuth, async (req, res): Promise<void> => {
  const parsed = MatchInvestorsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { ideaId, title, description, category } = parsed.data;
  let ideaText = `${title} ${description} ${category}`;

  if (ideaId) {
    const [storedIdea] = await db
      .select()
      .from(ideasTable)
      .where(eq(ideasTable.id, ideaId))
      .limit(1);
    if (storedIdea) {
      ideaText = `${storedIdea.title} ${storedIdea.description} ${storedIdea.category}`;
    }
  }

  const matches = await runMatching(ideaText);
  res.json(matches);
});

// ---------------------------------------------------------------------------
// GET /dashboard/investor-matches
// ---------------------------------------------------------------------------
router.get("/dashboard/investor-matches", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const ideas = await db
    .select()
    .from(ideasTable)
    .where(eq(ideasTable.userId, userId))
    .orderBy(ideasTable.updatedAt)
    .limit(20);

  const latest = ideas.find((i) => i.evaluationScore !== null) ?? ideas[0];

  if (!latest) {
    res.json([]);
    return;
  }

  const ideaText = `${latest.title} ${latest.description} ${latest.category}`;
  const matches = await runMatching(ideaText);
  res.json(matches);
});

export default router;
