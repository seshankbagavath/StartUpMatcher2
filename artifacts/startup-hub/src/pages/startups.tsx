import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useGetStartups, getGetStartupsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useStartThread } from "@/lib/threads-api";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Rocket, Sparkles, TrendingUp, Flame, MessageSquare } from "lucide-react";

const STAGES = [
  { value: "all", label: "All stages" },
  { value: "idea", label: "Idea" },
  { value: "mvp", label: "MVP" },
  { value: "growth", label: "Growth" },
  { value: "scale", label: "Scale" },
];

const CATEGORIES = [
  "All Categories", "AI/ML", "SaaS", "FinTech", "HealthTech", "EdTech",
  "E-Commerce", "Climate Tech", "Developer Tools", "Consumer", "Web3", "Other",
];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "score", label: "Highest score" },
];

function scoreChip(score: number) {
  if (score >= 80) return "bg-brand-50 text-brand-700 border-brand-500/30";
  if (score >= 60) return "bg-brand-50 text-brand-600 border-brand-400/30";
  if (score >= 40) return "bg-warning-50 text-warning-600 border-warning-500/30";
  return "bg-danger-50 text-danger-600 border-danger-500/30";
}

export default function Startups() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [category, setCategory] = useState("All Categories");
  const [sort, setSort] = useState("newest");
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const startThread = useStartThread();

  const messageFounder = (ideaId: string) => {
    startThread.mutate(ideaId, {
      onSuccess: () => {
        toast({ title: "Conversation started", description: "Opening Messages…" });
        setLocation("/messages");
      },
      onError: (e: Error) =>
        toast({
          title: "Couldn't start conversation",
          description: e.message,
          variant: "destructive",
        }),
    });
  };

  const queryParams = {
    ...(search ? { search } : {}),
    ...(stage !== "all" ? { stage } : {}),
    ...(category !== "All Categories" ? { category } : {}),
  };

  const { data: startups, isLoading } = useGetStartups(queryParams, {
    query: { queryKey: getGetStartupsQueryKey(queryParams) },
  });

  const sorted = useMemo(() => {
    const list = [...(startups ?? [])];
    if (sort === "score") {
      list.sort((a, b) => (b.evaluationScore ?? -1) - (a.evaluationScore ?? -1));
    } else {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return list;
  }, [startups, sort]);

  const topScore = useMemo(
    () => Math.max(0, ...(startups ?? []).map((s) => s.evaluationScore ?? 0)),
    [startups],
  );

  return (
    <Layout>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="lo-aurora" />
        <div className="relative">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="lo-pill">
              <Sparkles className="w-3.5 h-3.5" />
              Public launchpad
            </span>
            <h1 className="mt-4 text-display-md">
              Explore <span className="text-brand-700">founder ideas</span>
            </h1>
            <p className="mt-3 text-lg text-ink-600">
              Discover ambitious concepts from founders around the world. Filter
              by industry or stage to find what's taking off.
            </p>
          </div>

          {/* Filters */}
          <div className="lo-card p-4 mb-8 flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <Input
                placeholder="Search by title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[170px] h-11 bg-white border-ink-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="w-[140px] h-11 bg-white border-ink-200">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-ink-400" />
                    <SelectValue placeholder="Stage" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[160px] h-11 bg-white border-ink-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-ink-400" />
                    <SelectValue placeholder="Sort" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : sorted.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {sorted.map((s) => {
                const isTop =
                  sort === "score" &&
                  s.evaluationScore != null &&
                  s.evaluationScore === topScore &&
                  topScore >= 60;
                return (
                  <div key={s.id} className="lo-card p-6 flex flex-col group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-ink-100 text-ink-700">
                        {s.category}
                      </span>
                      {s.evaluationScore != null && (
                        <span
                          className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${scoreChip(s.evaluationScore)}`}
                        >
                          {isTop && <Flame className="w-3 h-3" />}
                          {s.evaluationScore}/100
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-ink-900 line-clamp-1">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm text-ink-600 leading-relaxed line-clamp-4 flex-1">
                      {s.description}
                    </p>
                    <div className="mt-4 pt-4 border-t border-ink-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-ink-600">
                        <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                          {s.founderName?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="truncate max-w-[110px] font-medium">
                          {s.founderName}
                        </span>
                      </div>
                      {user?.role === "investor" && s.founderId !== user.id ? (
                        <Button
                          size="sm"
                          onClick={() => messageFounder(s.id)}
                          disabled={startThread.isPending}
                          className="h-8 px-3 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1" />
                          Message
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-ink-100 text-ink-700 capitalize">
                          {s.stage}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="lo-card border-dashed max-w-xl mx-auto text-center py-20">
              <div className="w-14 h-14 rounded-full bg-ink-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-ink-400" />
              </div>
              <h3 className="font-bold text-ink-900 mb-1">No startups found</h3>
              <p className="text-sm text-ink-600">
                Nothing matches your current filters — try widening the search.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
