/**
 * Unified AI layer.
 *
 * Strategy: use a real OpenAI-compatible provider (Groq) for chat completions
 * when AI_INTEGRATIONS_OPENAI_API_KEY is set, and transparently fall back to a
 * deterministic local model when it is not (or when a call fails).
 *
 * Embeddings are always computed locally with a hashed bag-of-words vector —
 * Groq does not expose an embeddings endpoint, and a lexical vector gives
 * meaningful cosine similarity for category/interest overlap without a network
 * round-trip.
 */
import { getAIClient, AI_MODEL } from "@workspace/integrations-openai-ai-server";
import { logger } from "./logger";

// ───────────────────────────── Evaluation ──────────────────────────────────

export interface EvaluationResult {
  problem_clarity: number;
  market_size: number;
  innovation: number;
  execution_potential: number;
  total_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  market_potential: "low" | "medium" | "high";
  feedback: string;
}

export interface EvaluationInput {
  name: string;
  description: string;
  target_users?: string | null;
  problem?: string | null;
  demoLink?: string | null;
}

/** True when a real AI provider is configured. */
export function aiEnabled(): boolean {
  return getAIClient() !== null;
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Math.round(n)));

/**
 * Deterministic heuristic evaluator — no network. Produces the same 4-dimension
 * shape the real model returns so callers don't care which ran.
 */
export function evaluateIdeaMock(input: EvaluationInput): EvaluationResult {
  const desc = input.description.toLowerCase();
  const problem = (input.problem ?? "").toLowerCase();
  const users = (input.target_users ?? "").toLowerCase();
  const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
  const totalWords = words(input.description) + words(problem) + words(users);

  const HOT = ["ai", "ml", "health", "climate", "fintech", "saas", "security", "data", "robot"];

  // Problem clarity (0-25)
  let problem_clarity = 12;
  if (problem.length > 40) problem_clarity += 5;
  if (/painful|broken|inefficient|frustrat|waste|costly|manual/.test(problem + desc)) problem_clarity += 4;
  if (users.length > 15) problem_clarity += 3;
  if (totalWords > 60) problem_clarity += 2;
  problem_clarity = clamp(problem_clarity, 4, 25);

  // Market size (0-25)
  let market_size = 12;
  if (HOT.some((h) => desc.includes(h) || problem.includes(h))) market_size += 5;
  if (/billion|trillion|global|worldwide|massive/.test(desc + problem)) market_size += 5;
  if (/niche|local|small/.test(desc)) market_size -= 4;
  if (users.length > 25) market_size += 2;
  market_size = clamp(market_size, 4, 25);

  // Innovation (0-25)
  let innovation = 12;
  if (/first|novel|unique|patent|proprietary|breakthrough/.test(desc)) innovation += 6;
  if (/ai|machine learning|blockchain|automat/.test(desc)) innovation += 4;
  if (/traditional|existing solution|just like|clone/.test(desc)) innovation -= 5;
  innovation = clamp(innovation, 4, 25);

  // Execution potential (0-25)
  let execution_potential = 12;
  if (input.demoLink) execution_potential += 6;
  if (/prototype|beta|launched|mvp|live|users|customers|revenue/.test(desc)) execution_potential += 5;
  if (totalWords > 90) execution_potential += 2;
  execution_potential = clamp(execution_potential, 4, 25);

  const total_score = problem_clarity + market_size + innovation + execution_potential;

  const strengths: string[] = [];
  if (problem_clarity >= 18) strengths.push("Clearly articulated, painful problem");
  if (market_size >= 18) strengths.push("Large, high-growth market opportunity");
  if (innovation >= 18) strengths.push("Genuinely differentiated approach");
  if (execution_potential >= 18) strengths.push("Strong signals of execution ability");
  if (input.demoLink) strengths.push("Working demo demonstrates traction");
  if (strengths.length === 0) strengths.push("Solid problem-solution direction to build on");

  const weaknesses: string[] = [];
  if (problem_clarity < 14) weaknesses.push("Problem statement needs sharpening");
  if (market_size < 14) weaknesses.push("Market size and reachability are unclear");
  if (innovation < 14) weaknesses.push("Differentiation from existing solutions is thin");
  if (execution_potential < 14) weaknesses.push("Little evidence of execution yet — ship an MVP");
  if (weaknesses.length === 0) weaknesses.push("Tighten the go-to-market narrative");

  const suggestions = [
    "Validate with 10+ target users before building further",
    "State your unique value proposition in one sentence",
    input.demoLink
      ? "Instrument the demo to capture activation metrics"
      : "Build a lightweight demo or landing page to collect signups",
  ];

  const market_potential: EvaluationResult["market_potential"] =
    market_size >= 19 ? "high" : market_size >= 13 ? "medium" : "low";

  const feedback =
    total_score >= 80
      ? `"${input.name}" scores ${total_score}/100 — genuinely fundable. The bones are strong; now out-execute everyone else and don't fumble go-to-market.`
      : total_score >= 60
        ? `"${input.name}" scores ${total_score}/100 — promising but not yet investable. The thing that would sink this today: ${weaknesses[0]?.toLowerCase() ?? "weak execution evidence"}. Fix it before you pitch.`
        : `"${input.name}" scores ${total_score}/100 — this is not ready, and most investors would pass. ${weaknesses[0] ?? "The core assumption is unproven"}. Go validate with real users before building anything else.`;

  return {
    problem_clarity,
    market_size,
    innovation,
    execution_potential,
    total_score,
    strengths,
    weaknesses,
    suggestions,
    market_potential,
    feedback,
  };
}

/** Evaluate via the real provider, falling back to the mock on any failure. */
export async function evaluateIdea(input: EvaluationInput): Promise<EvaluationResult> {
  const client = getAIClient();
  if (!client) return evaluateIdeaMock(input);

  const prompt = `Evaluate this startup idea. Score each dimension out of 25 (total = 100):
1. Problem Clarity — how clearly defined and painful is the problem?
2. Market Size — how large and reachable is the target market?
3. Innovation — how novel or differentiated is the solution?
4. Execution Potential — how feasible is building and scaling this?

Startup name: ${input.name}
Description: ${input.description}
Target users: ${input.target_users ?? "Not specified"}
Problem: ${input.problem ?? "Not specified"}
${input.demoLink ? `Demo link: ${input.demoLink}` : ""}

Return JSON only, exactly this shape:
{"problem_clarity":<0-25>,"market_size":<0-25>,"innovation":<0-25>,"execution_potential":<0-25>,"total_score":<0-100>,"strengths":["..."],"weaknesses":["..."],"suggestions":["..."],"market_potential":"low|medium|high","feedback":"..."}`;

  try {
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            "You are a brutally honest, skeptical Series-A venture capitalist who has seen thousands of pitches. Score harshly and realistically: most ideas are mediocre (50-65), genuinely strong ideas are rare (80+), and you are not afraid to give low scores. Name specific, concrete flaws — no vague encouragement. Be direct and unsentimental, but every weakness must come with a usable fix. Return valid JSON only — no markdown, no code fences.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<EvaluationResult>;

    const result: EvaluationResult = {
      problem_clarity: clamp(parsed.problem_clarity ?? 0, 0, 25),
      market_size: clamp(parsed.market_size ?? 0, 0, 25),
      innovation: clamp(parsed.innovation ?? 0, 0, 25),
      execution_potential: clamp(parsed.execution_potential ?? 0, 0, 25),
      total_score: 0,
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      suggestions: parsed.suggestions ?? [],
      market_potential: parsed.market_potential ?? "medium",
      feedback: parsed.feedback ?? "",
    };
    result.total_score =
      result.problem_clarity +
      result.market_size +
      result.innovation +
      result.execution_potential;

    // Guard against an empty/garbage response
    if (!result.feedback) return evaluateIdeaMock(input);
    return result;
  } catch (err) {
    logger.warn({ err }, "AI evaluation failed — using local fallback");
    return evaluateIdeaMock(input);
  }
}

// ───────────────────────────── Embeddings ──────────────────────────────────

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "to", "of", "in", "on", "with", "is",
  "are", "be", "that", "this", "it", "as", "at", "by", "we", "our", "your",
  "their", "them", "they", "from", "into", "via",
]);

const EMBED_DIM = 256;

/** Deterministic hashed bag-of-words embedding — cosine reflects lexical overlap. */
export function localEmbed(text: string): number[] {
  const vec = new Array<number>(EMBED_DIM).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));

  for (const tok of tokens) {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    vec[Math.abs(h) % EMBED_DIM] += 1;
  }
  return vec;
}

/** Cosine similarity between two equal-length vectors. */
export function cosine(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ──────────────────────────── Explanations ─────────────────────────────────

export interface ExplainTarget {
  name: string;
  firm: string;
  interests: string[];
}

/** Template a one-line rationale from interest/idea-text overlap. */
function explainMock(ideaText: string, m: ExplainTarget): string {
  const text = ideaText.toLowerCase();
  const hits = m.interests.filter((i) => text.includes(i.toLowerCase()));
  if (hits.length > 0) {
    return `Direct overlap with ${m.firm}'s focus on ${hits.slice(0, 2).join(" & ")}.`;
  }
  return `${m.name} backs founders in ${m.interests.slice(0, 2).join(" & ")}, adjacent to this idea.`;
}

/** Generate all match explanations in one call, falling back to templates. */
export async function explainMatches(
  ideaText: string,
  matches: ExplainTarget[],
): Promise<string[]> {
  const client = getAIClient();
  if (!client || matches.length === 0) {
    return matches.map((m) => explainMock(ideaText, m));
  }

  const list = matches
    .map((m, i) => `${i + 1}. ${m.name} (${m.firm}) — ${m.interests.join(", ")}`)
    .join("\n");
  const prompt = `A founder has this idea:\n"${ideaText}"\n\nTop investor matches:\n${list}\n\nFor each, write ONE concise sentence (max 20 words) on why they fit this specific idea. Be specific about aligning interest areas.\n\nReturn JSON only: {"explanations":["...","...","..."]}`;

  try {
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      max_completion_tokens: 400,
      messages: [
        { role: "system", content: "Return valid JSON only — no markdown." },
        { role: "user", content: prompt },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { explanations?: string[] };
    if (!parsed.explanations || parsed.explanations.length < matches.length) {
      return matches.map((m) => explainMock(ideaText, m));
    }
    return parsed.explanations;
  } catch (err) {
    logger.warn({ err }, "AI explanation failed — using templates");
    return matches.map((m) => explainMock(ideaText, m));
  }
}
