/**
 * Startup idea evaluator.
 * Scores an idea across four dimensions and produces actionable feedback.
 * This is a heuristic model — no external AI calls required.
 */

export interface EvaluationInput {
  title: string;
  description: string;
  targetUsers?: string;
  problemStatement?: string;
  demoLink?: string | null;
  category?: string;
  stage?: string;
}

export interface EvaluationOutput {
  score: number;
  marketPotential: number;
  feasibility: number;
  innovation: number;
  competition: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

/** Hot sectors get a market-potential boost */
const HOT_CATEGORIES = ["ai", "ml", "health", "climate", "fintech", "saas", "security", "data"];

/** Word count of a string correlates with idea maturity */
function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

export function evaluateIdea(input: EvaluationInput): EvaluationOutput {
  const desc = input.description.toLowerCase();
  const cat = (input.category ?? "").toLowerCase();
  const stage = input.stage ?? "idea";
  const problem = (input.problemStatement ?? "").toLowerCase();
  const users = (input.targetUsers ?? "").toLowerCase();
  const totalWords = wordCount(input.description) + wordCount(problem) + wordCount(users);

  // --- Market Potential (0-100) ---
  let marketPotential = 50;
  if (HOT_CATEGORIES.some((h) => cat.includes(h))) marketPotential += 20;
  if (desc.includes("billion") || desc.includes("trillion")) marketPotential += 10;
  if (desc.includes("global") || desc.includes("worldwide")) marketPotential += 8;
  if (problem.includes("million") || problem.includes("billion")) marketPotential += 8;
  if (desc.includes("niche") || desc.includes("local")) marketPotential -= 10;
  // Having a clear target user segment signals market clarity
  if (users.length > 20) marketPotential += 5;
  marketPotential = Math.min(100, Math.max(10, marketPotential));

  // --- Feasibility (0-100) ---
  let feasibility = 55;
  if (["mvp", "growth", "scale"].includes(stage)) feasibility += 15;
  if (desc.includes("prototype") || desc.includes("beta") || desc.includes("launched")) feasibility += 10;
  if (desc.includes("patent") || desc.includes("proprietary")) feasibility -= 5;
  if (totalWords > 80) feasibility += 10; // detail = thought through
  // Demo link signals something real exists
  if (input.demoLink) feasibility += 12;
  feasibility = Math.min(100, Math.max(10, feasibility));

  // --- Innovation (0-100) ---
  let innovation = 50;
  if (desc.includes("first") || desc.includes("novel") || desc.includes("unique")) innovation += 15;
  if (problem.includes("broken") || problem.includes("painful") || problem.includes("inefficient")) innovation += 8;
  if (desc.includes("ai") || desc.includes("machine learning") || desc.includes("blockchain")) innovation += 10;
  if (desc.includes("traditional") || desc.includes("existing solution")) innovation -= 10;
  innovation = Math.min(100, Math.max(10, innovation));

  // --- Competition (0-100, higher = less competitive = better) ---
  let competition = 60;
  if (desc.includes("no competitor") || desc.includes("blue ocean")) competition += 20;
  if (desc.includes("dominant player") || desc.includes("google") || desc.includes("amazon") || desc.includes("microsoft")) competition -= 20;
  if (desc.includes("fragmented") || desc.includes("underserved")) competition += 10;
  competition = Math.min(100, Math.max(10, competition));

  // --- Weighted overall score ---
  const score = Math.round(
    marketPotential * 0.30 +
    feasibility * 0.25 +
    innovation * 0.25 +
    competition * 0.20,
  );

  // --- Strengths ---
  const strengths: string[] = [];
  if (marketPotential >= 70) strengths.push("Strong market opportunity in a high-growth sector");
  if (feasibility >= 70) strengths.push("Technically feasible with a clear path to execution");
  if (innovation >= 70) strengths.push("Differentiated approach with novel elements");
  if (competition >= 70) strengths.push("Favorable competitive landscape with room to grow");
  if (input.demoLink) strengths.push("Working demo demonstrates execution ability");
  if (input.targetUsers) strengths.push("Clear target user segment defined");
  if (strengths.length === 0) strengths.push("Clear problem definition and solution direction");

  // --- Weaknesses ---
  const weaknesses: string[] = [];
  if (marketPotential < 50) weaknesses.push("Market size may limit growth ceiling");
  if (feasibility < 50) weaknesses.push("Execution complexity is high — prioritize an MVP first");
  if (innovation < 50) weaknesses.push("Differentiation from existing solutions needs sharpening");
  if (competition < 50) weaknesses.push("Facing established competitors with significant resources");
  if (!input.demoLink) weaknesses.push("No demo yet — a prototype would strengthen investor conversations");
  if (weaknesses.length === 0) weaknesses.push("Ensure go-to-market strategy is clearly defined");

  // --- Recommendations ---
  const recommendations: string[] = [
    "Validate with at least 10 potential customers before building further",
    "Define your unique value proposition in one sentence",
    `Focus on ${stage === "idea" ? "building an MVP to test core assumptions" : "retention and unit economics"}`,
  ];
  if (competition < 60) recommendations.push("Identify a defensible niche to avoid direct competition");
  if (marketPotential > 70) recommendations.push("Explore investor conversations early — market timing is favorable");
  if (!input.demoLink) recommendations.push("Build a simple demo or landing page to start collecting signups");

  // --- Narrative feedback ---
  const feedback =
    score >= 75
      ? `"${input.title}" shows strong potential with a score of ${score}/100. The market timing looks favorable and the idea has genuine differentiation. Focus on speed to market.`
      : score >= 55
      ? `"${input.title}" scores ${score}/100 — a solid foundation with room to sharpen. Key areas to address: ${weaknesses[0]?.toLowerCase() ?? "execution clarity"}.`
      : `"${input.title}" scores ${score}/100. The idea needs more definition before attracting investors. Start by validating the core assumption with real users.`;

  return { score, marketPotential, feasibility, innovation, competition, feedback, strengths, weaknesses, recommendations };
}
