import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import {
  useGetDashboardSummary,
  useGetRecentActivity,
  useListIdeas,
  useGetDashboardInvestorMatches,
  getGetDashboardSummaryQueryKey,
  getGetRecentActivityQueryKey,
  getListIdeasQueryKey,
  getGetDashboardInvestorMatchesQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  Target,
  Users,
  Zap,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Globe,
  Sparkles,
  Rocket,
  TrendingUp,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { format } from "date-fns";

const SCORE_CATEGORIES = [
  { key: "problemClarity", label: "Problem clarity", icon: BrainCircuit, gradient: "from-brand-500 to-brand-700" },
  { key: "marketSize", label: "Market size", icon: Globe, gradient: "from-brand-400 to-brand-600" },
  { key: "innovation", label: "Innovation", icon: Sparkles, gradient: "from-brand-600 to-brand-800" },
  { key: "executionPotential", label: "Execution", icon: Rocket, gradient: "from-brand-500 to-brand-700" },
] as const;

type BreakdownKey = (typeof SCORE_CATEGORIES)[number]["key"];

function ScoreBar({
  label,
  icon: Icon,
  gradient,
  value,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  value: number | null | undefined;
}) {
  const pct = value != null ? (value / 25) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          <Icon className="w-4 h-4 text-ink-500" />
          {label}
        </span>
        <span className="text-sm font-bold text-ink-900 tabular-nums">
          {value != null ? `${Math.round(value)}/25` : "—"}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-ink-100 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className="lo-card p-6 group">
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-500">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${accent} text-white shadow-sm group-hover:scale-105 transition-transform`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-9 w-20" />
      ) : (
        <div className="text-3xl font-extrabold text-ink-900 tracking-tight">
          {value}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { token, user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !token) setLocation("/login");
  }, [token, authLoading, setLocation]);

  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({
    query: { enabled: !!token, queryKey: getGetDashboardSummaryQueryKey() },
  });
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity({
    query: { enabled: !!token, queryKey: getGetRecentActivityQueryKey() },
  });
  const { data: ideas, isLoading: ideasLoading } = useListIdeas({
    query: { enabled: !!token, queryKey: getListIdeasQueryKey() },
  });
  const { data: investorMatches, isLoading: investorsLoading } =
    useGetDashboardInvestorMatches({
      query: {
        enabled: !!token,
        queryKey: getGetDashboardInvestorMatchesQueryKey(),
      },
    });

  if (authLoading || !token) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="grid md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const scoreColor = (score?: number | null) =>
    score == null
      ? "bg-ink-100 text-ink-600 border-ink-200"
      : score >= 80
      ? "bg-brand-50 text-brand-700 border-brand-500/30"
      : score >= 50
      ? "bg-warning-50 text-warning-600 border-warning-500/30"
      : "bg-danger-50 text-danger-600 border-danger-500/30";

  const scoreLabel = (score?: number | null) =>
    score == null
      ? "Not evaluated"
      : score >= 80
      ? "Strong"
      : score >= 50
      ? "Average"
      : "Needs work";

  const activityIcon = (type: string) => {
    switch (type) {
      case "idea_submitted":
        return <Lightbulb className="w-4 h-4 text-brand-600" />;
      case "idea_evaluated":
        return <Target className="w-4 h-4 text-ink-600" />;
      case "investor_matched":
        return <Users className="w-4 h-4 text-brand-700" />;
      default:
        return <Zap className="w-4 h-4 text-ink-500" />;
    }
  };

  const hasBreakdown =
    summary?.avgBreakdown &&
    Object.values(summary.avgBreakdown).some((v) => v != null);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="lo-pill">
              <Sparkles className="w-3.5 h-3.5" />
              Command Center
            </span>
            <h1 className="mt-3 text-display-md">
              Hey {user?.name?.split(" ")[0] ?? "founder"} 👋
            </h1>
            <p className="mt-2 text-ink-600">
              Your portfolio at a glance — scores, matches, and what's moving.
            </p>
          </div>
          <Link href="/submit">
            <Button className="h-12 px-5 font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md lo-btn-cta-glow cursor-pointer">
              <PlusCircle className="w-4 h-4 mr-1" />
              Submit new idea
            </Button>
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total ideas"
            value={summary?.totalIdeas ?? 0}
            icon={Lightbulb}
            accent="from-brand-500 to-brand-700"
            loading={summaryLoading}
          />
          <StatCard
            label="Avg score"
            value={
              summary?.averageScore
                ? `${Math.round(summary.averageScore)}`
                : "—"
            }
            icon={Target}
            accent="from-brand-500 to-brand-700"
            loading={summaryLoading}
          />
          <StatCard
            label="Top category"
            value={
              <span className="text-2xl">{summary?.topCategory || "—"}</span>
            }
            icon={CheckCircle2}
            accent="from-brand-400 to-brand-600"
            loading={summaryLoading}
          />
          <StatCard
            label="Investor matches"
            value={summary?.investorMatches ?? 0}
            icon={Users}
            accent="from-brand-600 to-brand-800"
            loading={summaryLoading}
          />
        </div>

        {/* Score breakdown */}
        <div className="lo-card p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-600" />
                Score breakdown
              </h2>
              <p className="text-sm text-ink-600 mt-1">
                Average across your portfolio — each dimension scored out of 25.
              </p>
            </div>
          </div>
          {summaryLoading ? (
            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-5">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : hasBreakdown ? (
            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
              {SCORE_CATEGORIES.map((c) => (
                <ScoreBar
                  key={c.key}
                  label={c.label}
                  icon={c.icon}
                  gradient={c.gradient}
                  value={
                    summary?.avgBreakdown?.[c.key as BreakdownKey] as
                      | number
                      | null
                      | undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center text-ink-500 gap-3">
              <Target className="w-10 h-10 opacity-30" />
              <p>Submit an idea to see your evaluation breakdown.</p>
            </div>
          )}
        </div>

        {/* Investor matches */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-700" />
              Investor matches
            </h2>
          </div>
          {investorsLoading ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-56 rounded-2xl" />
              ))}
            </div>
          ) : investorMatches && investorMatches.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {investorMatches.map((inv) => (
                <div
                  key={inv.id}
                  className="lo-card p-6 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-ink-900 truncate">
                        {inv.name}
                      </h3>
                      <p className="text-xs text-ink-500 mt-0.5 truncate">
                        {inv.firm}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${
                        inv.riskLevel === "high"
                          ? "bg-danger-50 text-danger-600 border-danger-500/30"
                          : inv.riskLevel === "medium"
                          ? "bg-warning-50 text-warning-600 border-warning-500/30"
                          : "bg-brand-50 text-brand-700 border-brand-500/30"
                      }`}
                    >
                      {inv.riskLevel} risk
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {inv.interests.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100"
                      >
                        {t}
                      </span>
                    ))}
                    {inv.interests.length > 4 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-ink-100 text-ink-600">
                        +{inv.interests.length - 4}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-700 leading-relaxed flex items-start gap-2 mb-4 flex-1">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-brand-700 flex-none" />
                    <span>{inv.whyMatch}</span>
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-ink-600">
                      <span>Match score</span>
                      <span className="text-ink-900">{inv.matchScore}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-600 transition-all duration-700"
                        style={{ width: `${inv.matchScore}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-ink-500 italic mt-3">
                    {inv.contactHint}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="lo-card border-dashed flex flex-col items-center py-12 gap-3 text-center">
              <Users className="w-10 h-10 text-ink-400" />
              <div>
                <p className="font-bold text-ink-900">No matches yet</p>
                <p className="text-sm text-ink-600 mt-1">
                  Submit and evaluate an idea to find matching investors.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio + activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-brand-600" />
              Your portfolio
            </h2>
            {ideasLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
              </div>
            ) : ideas && ideas.length > 0 ? (
              <div className="space-y-3">
                {ideas.map((idea) => (
                  <button
                    key={idea.id}
                    onClick={() => setLocation(`/ideas/${idea.id}`)}
                    className="lo-card w-full p-6 text-left cursor-pointer hover:translate-y-[-2px] transition-transform"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-ink-900 text-lg">
                          {idea.title}
                        </h3>
                        <p className="text-ink-600 text-sm mt-1 line-clamp-2 leading-relaxed">
                          {idea.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-ink-100 text-ink-700">
                            {idea.category}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-ink-100 text-ink-700 capitalize">
                            {idea.stage}
                          </span>
                          {idea.isPublic && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                              Public
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${scoreColor(idea.evaluationScore)}`}
                        >
                          {idea.evaluationScore != null
                            ? `${idea.evaluationScore}/100`
                            : "—"}
                        </span>
                        <span className="text-xs font-semibold text-ink-500">
                          {scoreLabel(idea.evaluationScore)}
                        </span>
                        <ArrowRight className="w-4 h-4 text-ink-400" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="lo-card border-dashed p-12 text-center">
                <AlertCircle className="w-10 h-10 text-ink-400 mx-auto mb-3" />
                <h3 className="font-bold text-ink-900 mb-1">No ideas yet</h3>
                <p className="text-sm text-ink-600 mb-4">
                  Submit your first startup idea to get your scorecard.
                </p>
                <Link href="/submit">
                  <Button className="bg-brand-600 hover:bg-brand-700 text-white cursor-pointer">
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Submit your first idea
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-ink-600" />
              Recent activity
            </h2>
            <div className="lo-card overflow-hidden">
              {activityLoading ? (
                <div className="p-4 space-y-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3.5 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity && activity.length > 0 ? (
                <ul className="divide-y divide-ink-100">
                  {activity.map((it) => (
                    <li
                      key={it.id}
                      className="p-4 flex gap-3 hover:bg-ink-50 transition-colors"
                    >
                      <div className="mt-0.5 bg-ink-50 border border-ink-200 rounded-full p-2 h-fit">
                        {activityIcon(it.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900">
                          {it.title}
                        </p>
                        <p className="text-xs text-ink-600 mt-0.5">
                          {it.description}
                        </p>
                        <p className="text-xs text-ink-400 mt-1.5">
                          {format(new Date(it.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-sm text-ink-500">
                  No recent activity yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
