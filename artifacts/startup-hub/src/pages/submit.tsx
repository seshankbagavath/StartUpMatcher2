import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateIdea, useEvaluateIdea } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Rocket,
  ArrowRight,
  Lightbulb,
  Users,
  Target,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";

type Stage = "idea" | "mvp" | "growth" | "scale";

interface FormState {
  name: string;
  description: string;
  target_users: string;
  problem: string;
  demoLink: string;
  category: string;
  stage: Stage;
  isPublic: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  target_users?: string;
  problem?: string;
  demoLink?: string;
  category?: string;
}

const CATEGORIES = [
  "AI/ML", "SaaS", "FinTech", "HealthTech", "EdTech", "E-Commerce",
  "Climate Tech", "Developer Tools", "Consumer", "Marketplace",
  "CyberSecurity", "Web3", "Other",
];

const STAGES: { value: Stage; label: string; hint: string }[] = [
  { value: "idea", label: "Idea", hint: "Just a concept" },
  { value: "mvp", label: "MVP", hint: "Building / early users" },
  { value: "growth", label: "Growth", hint: "Traction & revenue" },
  { value: "scale", label: "Scale", hint: "Scaling up" },
];

export default function SubmitIdea() {
  const { token, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    target_users: "",
    problem: "",
    demoLink: "",
    category: "AI/ML",
    stage: "idea",
    isPublic: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const createIdea = useCreateIdea();
  const evaluate = useEvaluateIdea();
  const isLoading = createIdea.isPending || evaluate.isPending;

  if (!authLoading && !token) {
    setLocation("/login");
    return null;
  }

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Startup name is required";
    if (!form.description.trim()) next.description = "Description is required";
    if (!form.target_users.trim()) next.target_users = "Target users are required";
    if (!form.problem.trim()) next.problem = "Problem statement is required";
    if (!form.category.trim()) next.category = "Pick a category";
    if (form.demoLink && !/^https?:\/\/.+/.test(form.demoLink.trim())) {
      next.demoLink = "Must start with http:// or https://";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const setField =
    <K extends keyof FormState>(field: K) =>
    (value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (field in errors) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // 1) Create the idea row
      const idea = await createIdea.mutateAsync({
        data: {
          title: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
          stage: form.stage,
          isPublic: form.isPublic,
        },
      });

      // 2) Evaluate it (persists sub-scores to that idea)
      await evaluate.mutateAsync({
        data: {
          ideaId: idea.id,
          name: form.name.trim(),
          description: form.description.trim(),
          target_users: form.target_users.trim(),
          problem: form.problem.trim(),
          demoLink: form.demoLink.trim() || null,
          category: form.category,
          stage: form.stage,
        },
      });

      toast({
        title: "Evaluation complete",
        description: "Your idea has been scored. Opening your scorecard…",
      });
      setLocation(`/ideas/${idea.id}`);
    } catch {
      toast({
        title: "Something went wrong",
        description: "Could not evaluate your idea. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="lo-aurora" />
        <div className="relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white shadow-sm mb-4">
              <Rocket className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <h1 className="text-display-sm">Submit your idea</h1>
            <p className="mt-2 text-ink-600">
              The more context you give, the sharper the AI critique.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="lo-card p-6 md:p-8 space-y-6">
            {/* Name */}
            <Field
              label="Startup name"
              icon={<Rocket className="w-4 h-4" />}
              error={errors.name}
              required
            >
              <Input
                placeholder="e.g. ClimateTrack AI"
                value={form.name}
                onChange={(e) => setField("name")(e.target.value)}
                disabled={isLoading}
                className="h-12 bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </Field>

            {/* Description */}
            <Field
              label="Description"
              icon={<Lightbulb className="w-4 h-4" />}
              error={errors.description}
              required
            >
              <Textarea
                placeholder="What does your startup do? What makes it different?"
                rows={4}
                value={form.description}
                onChange={(e) => setField("description")(e.target.value)}
                disabled={isLoading}
                className="resize-none bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </Field>

            {/* Problem */}
            <Field
              label="Problem being solved"
              icon={<Target className="w-4 h-4" />}
              error={errors.problem}
              required
            >
              <Textarea
                placeholder="What specific pain point does this address? Why now?"
                rows={3}
                value={form.problem}
                onChange={(e) => setField("problem")(e.target.value)}
                disabled={isLoading}
                className="resize-none bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </Field>

            {/* Target users */}
            <Field
              label="Target users"
              icon={<Users className="w-4 h-4" />}
              error={errors.target_users}
              required
            >
              <Input
                placeholder="e.g. Small business owners, indie developers…"
                value={form.target_users}
                onChange={(e) => setField("target_users")(e.target.value)}
                disabled={isLoading}
                className="h-12 bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </Field>

            {/* Category + Stage */}
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Category" error={errors.category} required>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setField("category")(c)}
                      disabled={isLoading}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                        form.category === c
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-white text-ink-700 border-ink-200 hover:border-brand-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Stage" required>
                <div className="grid grid-cols-2 gap-2">
                  {STAGES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setField("stage")(s.value)}
                      disabled={isLoading}
                      className={`text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                        form.stage === s.value
                          ? "bg-brand-50 border-brand-400"
                          : "bg-white border-ink-200 hover:border-brand-300"
                      }`}
                    >
                      <div className="text-sm font-bold text-ink-900">{s.label}</div>
                      <div className="text-xs text-ink-500">{s.hint}</div>
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Demo link */}
            <Field
              label="Demo link"
              icon={<LinkIcon className="w-4 h-4" />}
              error={errors.demoLink}
              optional
              hint="Optional — a demo signals execution ability."
            >
              <Input
                type="url"
                placeholder="https://demo.yourstartup.com"
                value={form.demoLink}
                onChange={(e) => setField("demoLink")(e.target.value)}
                disabled={isLoading}
                className="h-12 bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </Field>

            {/* Visibility */}
            <div className="flex items-center justify-between rounded-xl border border-ink-200 bg-ink-50 px-4 py-3">
              <div>
                <div className="text-sm font-bold text-ink-900">List publicly</div>
                <div className="text-xs text-ink-600">
                  Show this idea on the public Browse page so investors can discover it.
                </div>
              </div>
              <Switch
                checked={form.isPublic}
                onCheckedChange={(v) => setField("isPublic")(v)}
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm lo-btn-glow cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scoring your idea…
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Evaluate my idea
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

function Field({
  label,
  icon,
  error,
  required,
  optional,
  hint,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-700">
        {icon && <span className="text-ink-400">{icon}</span>}
        {label}
        {required && <span className="text-danger-500">*</span>}
        {optional && (
          <span className="text-[10px] font-semibold text-ink-500 bg-ink-100 px-1.5 py-0.5 rounded normal-case">
            optional
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-danger-600 font-medium">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}
