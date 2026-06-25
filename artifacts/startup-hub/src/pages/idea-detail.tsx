import { useParams, useLocation } from "wouter";
import { useEffect } from "react";
import {
  useGetIdea,
  getGetIdeaQueryKey,
  useMatchInvestors,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useStartThread } from "@/lib/threads-api";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowLeft,
  BrainCircuit,
  Globe,
  Sparkles,
  Rocket,
  AlertCircle,
  TrendingUp,
  Users,
  BadgeCheck,
  MessageSquare,
} from "lucide-react";

const SUB_SCORES = [
  { key: "problemClarity", label: "Problem clarity", icon: BrainCircuit },
  { key: "marketSize", label: "Market size", icon: Globe },
  { key: "innovationScore", label: "Innovation", icon: Sparkles },
  { key: "executionPotential", label: "Execution", icon: Rocket },
] as const;

type SubKey = (typeof SUB_SCORES)[number]["key"];

function scoreTone(score: number) {
  if (score >= 80)
    return { stroke: "var(--lo-color-primary-600)", text: "text-brand-700", label: "Fundable", chip: "bg-brand-50 text-brand-700 border-brand-500/30" };
  if (score >= 60)
    return { stroke: "var(--lo-color-primary-500)", text: "text-brand-600", label: "Promising", chip: "bg-brand-50 text-brand-600 border-brand-400/30" };
  if (score >= 40)
    return { stroke: "var(--lo-color-warning-500)", text: "text-warning-600", label: "Risky", chip: "bg-warning-50 text-warning-600 border-warning-500/30" };
  return { stroke: "var(--lo-color-error-500)", text: "text-danger-600", label: "Not ready", chip: "bg-danger-50 text-danger-600 border-danger-500/30" };
}

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const tone = scoreTone(score);
  return (
    <div className="relative flex items-center justify-center w-44 h-44">
      <svg className="-rotate-90" width="176" height="176" viewBox="0 0 176 176">
        <circle cx="88" cy="88" r={r} fill="none" strokeWidth="12" stroke="var(--lo-color-neutral-200)" />
        <circle
          cx="88" cy="88" r={r} fill="none" strokeWidth="12"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          stroke={tone.stroke}
          style={{ transition: "stroke-dashoffset 0.9s var(--lo-ease-out)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-extrabold tabular-nums ${tone.text}`}>{score}</span>
        <span className="text-xs font-semibold text-ink-500">/ 100</span>
      </div>
    </div>
  );
}

function SubScoreBar({
  label,
  icon: Icon,
  value,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ListCard({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "strength" | "weakness" | "suggestion";
}) {
  const cfg = {
    strength: { Icon: CheckCircle2, color: "text-brand-600" },
    weakness: { Icon: XCircle, color: "text-danger-500" },
    suggestion: { Icon: Lightbulb, color: "text-warning-500" },
  }[variant];
  return (
    <div className="lo-card p-6 h-full">
      <h3 className="text-sm font-bold uppercase tracking-wide text-ink-700 mb-4">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-ink-500">Not available.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-ink-700 leading-relaxed">
              <cfg.Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function IdeaDetail() {
  const params = useParams<{ id: string }>();
  const { token, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !token) setLocation("/login");
  }, [token, authLoading, setLocation]);

  const { data: idea, isLoading, isError } = useGetIdea(params.id ?? "", {
    query: {
      enabled: !!token && !!params.id,
      queryKey: getGetIdeaQueryKey(params.id ?? ""),
    },
  });

  const matchMutation = useMatchInvestors();
  const { mutate: runMatch } = matchMutation;
  const startThread = useStartThread();
  const { toast } = useToast();

  const messageInvestor = (investorId: string) => {
    if (!idea) return;
    startThread.mutate(
      { ideaId: idea.id, investorId },
      {
        onSuccess: () => {
          toast({ title: "Conversation started", description: "Opening Messages…" });
          setLocation("/messages");
        },
        onError: (e: Error) =>
          toast({ title: "Couldn't start conversation", description: e.message, variant: "destructive" }),
      },
    );
  };

  useEffect(() => {
    if (idea && idea.evaluationScore != null) {
      runMatch({
        data: {
          ideaId: idea.id,
          title: idea.title,
          description: idea.description,
          category: idea.category,
          stage: idea.stage,
        },
      });
    }
  }, [idea, runMatch]);

  if (authLoading || !token || isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !idea) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
          <AlertCircle className="w-10 h-10 text-ink-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Idea not found</h2>
          <p className="text-ink-600 mb-6">
            This idea doesn't exist or you don't have access.
          </p>
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  const hasScore = idea.evaluationScore != null;
  const score = Math.round(idea.evaluationScore ?? 0);
  const tone = scoreTone(score);
  const strengths = idea.strengths ?? [];
  const weaknesses = idea.weaknesses ?? [];
  const suggestions = idea.suggestions ?? [];
  const matches = matchMutation.data ?? [];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Header */}
        <div>
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900 transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-display-sm">{idea.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-ink-100 text-ink-700">
                  {idea.category}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-ink-100 text-ink-700 capitalize">
                  {idea.stage}
                </span>
                {idea.isPublic && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                    Public
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="lo-card p-6">
          <p className="text-ink-700 leading-relaxed">{idea.description}</p>
        </div>

        {hasScore ? (
          <>
            {/* Score + sub-scores */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="lo-card p-6 flex flex-col items-center justify-center gap-4">
                <ScoreRing score={score} />
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${tone.chip}`}>
                  {tone.label}
                </span>
                {idea.evaluationFeedback && (
                  <p className="text-sm text-ink-600 text-center leading-relaxed max-w-sm">
                    {idea.evaluationFeedback}
                  </p>
                )}
              </div>

              <div className="lo-card p-6 flex flex-col justify-center gap-6">
                {SUB_SCORES.map((s) => (
                  <SubScoreBar
                    key={s.key}
                    label={s.label}
                    icon={s.icon}
                    value={idea[s.key as SubKey] as number | null | undefined}
                  />
                ))}
              </div>
            </div>

            {/* Strengths / weaknesses / suggestions */}
            <div className="grid md:grid-cols-3 gap-6">
              <ListCard title="Strengths" items={strengths} variant="strength" />
              <ListCard title="Weaknesses" items={weaknesses} variant="weakness" />
              <ListCard title="Suggestions" items={suggestions} variant="suggestion" />
            </div>

            {/* Matched investors */}
            <div>
              <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-brand-600" />
                Matched investors
              </h2>
              {matchMutation.isPending ? (
                <div className="grid md:grid-cols-3 gap-4">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-52 rounded-2xl" />
                  ))}
                </div>
              ) : matches.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-4">
                  {matches.map((inv) => (
                    <div key={inv.id} className="lo-card p-6 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-ink-900 truncate flex items-center gap-1.5">
                            {inv.name}
                            {inv.registered && (
                              <BadgeCheck className="w-4 h-4 text-brand-600 flex-none" />
                            )}
                          </h3>
                          <p className="text-xs text-ink-500 truncate">{inv.firm}</p>
                        </div>
                        <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                          {inv.matchScore}%
                        </span>
                      </div>
                      {inv.registered && (
                        <span className="self-start mb-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-600 text-white">
                          On LiftOff
                        </span>
                      )}
                      <p className="text-sm text-ink-700 leading-relaxed flex items-start gap-2 flex-1">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-brand-600 flex-none" />
                        <span>{inv.whyMatch}</span>
                      </p>
                      {inv.registered && inv.userId ? (
                        <Button
                          size="sm"
                          onClick={() => messageInvestor(inv.userId!)}
                          disabled={startThread.isPending}
                          className="mt-3 h-9 font-semibold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4 mr-1.5" />
                          Message {inv.name.split(" ")[0]}
                        </Button>
                      ) : (
                        <p className="text-xs text-ink-500 italic mt-3">{inv.contactHint}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="lo-card border-dashed flex flex-col items-center py-10 gap-3 text-center">
                  <Users className="w-9 h-9 text-ink-400" />
                  <p className="text-sm text-ink-600">No investor matches yet.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="lo-card border-dashed p-12 text-center">
            <Sparkles className="w-10 h-10 text-ink-400 mx-auto mb-3" />
            <h3 className="font-bold text-ink-900 mb-1">Not evaluated yet</h3>
            <p className="text-sm text-ink-600">
              This idea hasn't been scored. Submit it through the evaluator to get a scorecard.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
