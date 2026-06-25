/**
 * Static investor dataset used for matching.
 * In a real product this would be a DB table — for now we curate
 * a representative set of investor archetypes.
 */
export interface InvestorRecord {
  id: string;
  name: string;
  firm: string;
  focus: string[];
  stages: string[];
  bio: string;
  contactHint: string;
}

export const INVESTORS: InvestorRecord[] = [
  {
    id: "inv-001",
    name: "Sarah Chen",
    firm: "Horizon Ventures",
    focus: ["SaaS", "AI/ML", "Developer Tools"],
    stages: ["idea", "mvp"],
    bio: "Sarah leads early-stage bets on infrastructure and developer-facing products. Former engineer at Stripe.",
    contactHint: "sarah@horizonvc.com — mention your tech stack",
  },
  {
    id: "inv-002",
    name: "Marcus Williams",
    firm: "BlueSky Capital",
    focus: ["FinTech", "Web3", "Payments"],
    stages: ["mvp", "growth"],
    bio: "Marcus backs founders reshaping financial infrastructure. 3 unicorn exits. Based in NYC.",
    contactHint: "Apply via BlueSky Capital portfolio form",
  },
  {
    id: "inv-003",
    name: "Priya Patel",
    firm: "HealthFirst Fund",
    focus: ["HealthTech", "BioTech", "Mental Health"],
    stages: ["idea", "mvp", "growth"],
    bio: "Priya was a practicing physician before pivoting to VC. She looks for founders who have lived the problem.",
    contactHint: "priya@healthfirstfund.com — include clinical validation data if any",
  },
  {
    id: "inv-004",
    name: "Jake Morrison",
    firm: "Scale Partners",
    focus: ["E-Commerce", "Consumer", "Marketplaces"],
    stages: ["growth", "scale"],
    bio: "Jake focuses on growth-stage consumer companies with proven retention. Built and sold two D2C brands.",
    contactHint: "Warm intro preferred via LinkedIn",
  },
  {
    id: "inv-005",
    name: "Aiko Tanaka",
    firm: "Deep Tech Ventures",
    focus: ["AI/ML", "Climate Tech", "Robotics"],
    stages: ["idea", "mvp"],
    bio: "Aiko invests at the frontier — long-term bets on science-driven companies. PhD in computational biology.",
    contactHint: "aiko@deeptechvc.io — attach a technical white-paper",
  },
  {
    id: "inv-006",
    name: "David Okafor",
    firm: "Emerging Markets Fund",
    focus: ["EdTech", "AgriTech", "Logistics"],
    stages: ["mvp", "growth"],
    bio: "David backs founders building for under-served markets globally. Partner at Africa-focused growth fund.",
    contactHint: "david@emfund.co — share your go-to-market plan",
  },
  {
    id: "inv-007",
    name: "Lena Schultz",
    firm: "Enterprise Catalyst",
    focus: ["SaaS", "CyberSecurity", "DevOps"],
    stages: ["growth", "scale"],
    bio: "Lena focuses on B2B SaaS with enterprise contracts and strong NRR. Former Salesforce VP.",
    contactHint: "enterprise-catalyst.com/apply — include ARR and top 3 customers",
  },
  {
    id: "inv-008",
    name: "Omar Hassan",
    firm: "Social Impact Capital",
    focus: ["EdTech", "HealthTech", "Climate Tech"],
    stages: ["idea", "mvp"],
    bio: "Omar backs mission-driven founders at the earliest stages. Formerly ran grant programs at Gates Foundation.",
    contactHint: "omar@sicapital.org — emphasize social impact metrics",
  },
];

/**
 * Score a single investor against a startup's category and stage.
 * Returns a matchScore between 0–100.
 */
export function scoreInvestor(
  investor: InvestorRecord,
  category: string,
  stage: string,
): number {
  let score = 0;
  const cat = category.toLowerCase();

  // Focus area match (up to 60 points)
  const focusMatch = investor.focus.some((f) =>
    f.toLowerCase().includes(cat) || cat.includes(f.toLowerCase()),
  );
  if (focusMatch) score += 60;
  else {
    // Partial keyword overlap
    const words = cat.split(/\s+/);
    const overlap = words.filter((w) =>
      investor.focus.some((f) => f.toLowerCase().includes(w)),
    ).length;
    score += Math.min(30, overlap * 15);
  }

  // Stage match (up to 40 points)
  if (investor.stages.includes(stage)) score += 40;
  else if (investor.stages.some((s) => Math.abs(investor.stages.indexOf(s) - ["idea","mvp","growth","scale"].indexOf(stage)) === 1)) {
    score += 20;
  }

  return Math.min(100, score);
}
