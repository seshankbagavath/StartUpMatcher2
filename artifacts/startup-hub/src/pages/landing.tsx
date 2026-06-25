import { useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Target,
  Zap,
  Users,
  Sparkles,
  Rocket,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const features = [
  {
    icon: Zap,
    title: "AI-graded in seconds",
    body:
      "Get a 100-point score across problem clarity, market size, innovation, and execution — no waiting on warm intros.",
    accent: "bg-brand-600",
  },
  {
    icon: Target,
    title: "Matched, not blasted",
    body:
      "We embed your pitch and rank investors by semantic fit. You get the three best matches, not a spammed list of fifty.",
    accent: "bg-brand-700",
  },
  {
    icon: Users,
    title: "Built for early founders",
    body:
      "Polished, public-by-default profiles let backers discover you while you're still building. No deck, no firm-name flexing.",
    accent: "bg-brand-500",
  },
];

const stats = [
  { value: "4 dims", label: "AI-scored" },
  { value: "Top 3", label: "Curated matches" },
  { value: "< 30s", label: "First evaluation" },
];

export default function Landing() {
  return (
    <Layout>
      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="lo-aurora" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="lo-pill"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI-powered founder matching
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
                className="mt-6 text-display-lg md:text-display-xl"
              >
                Your idea deserves a{" "}
                <span className="text-brand-700">real takeoff</span>.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
                className="mt-6 text-lg md:text-xl text-ink-600 max-w-xl leading-relaxed"
              >
                Drop your pitch. Get an honest AI breakdown across four dimensions —
                then meet the three investors who actually fit. No warm intros required.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
                className="mt-10 flex flex-col sm:flex-row gap-3"
              >
                <Link href="/register">
                  <Button
                    size="lg"
                    className="group h-14 px-7 text-base font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md lo-btn-glow cursor-pointer"
                  >
                    <Rocket className="w-5 h-5 mr-1" />
                    Launch your idea
                    <ArrowRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/startups">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-7 text-base font-semibold border-ink-300 text-ink-800 hover:bg-ink-100 cursor-pointer"
                  >
                    Browse startups
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.45 }}
                className="mt-10 grid grid-cols-3 gap-6 max-w-md"
              >
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl md:text-3xl font-extrabold text-brand-700">
                      {s.value}
                    </div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
                      {s.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Visual: floating rocket card preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-8 bg-gradient-to-br from-brand-100/60 via-transparent to-ink-200/40 blur-3xl" />
              <div className="relative lo-card p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">
                    AI
                  </div>
                  <div>
                    <div className="text-sm font-bold text-ink-900">
                      Evaluation complete
                    </div>
                    <div className="text-xs text-ink-500">
                      Aurora — climate-tech SaaS
                    </div>
                  </div>
                  <div className="ml-auto px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold">
                    87 / 100
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Problem clarity", v: 23, color: "from-brand-500 to-brand-600" },
                    { label: "Market size", v: 21, color: "from-brand-400 to-brand-600" },
                    { label: "Innovation", v: 22, color: "from-brand-600 to-brand-700" },
                    { label: "Execution potential", v: 21, color: "from-brand-500 to-brand-700" },
                  ].map((d, i) => (
                    <div key={d.label}>
                      <div className="flex justify-between text-sm font-semibold mb-1.5">
                        <span className="text-ink-700">{d.label}</span>
                        <span className="text-ink-900">{d.v}/25</span>
                      </div>
                      <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(d.v / 25) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.12, ease: EASE }}
                          className={`h-full rounded-full bg-gradient-to-r ${d.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-ink-200 flex items-center gap-2 text-sm font-semibold text-ink-700">
                  <TrendingUp className="w-4 h-4 text-brand-600" />
                  3 matched investors ready to review
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 bg-white border-y border-ink-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <span className="lo-pill">How it works</span>
            <h2 className="mt-4 text-display-md">
              Three steps from pitch to match.
            </h2>
            <p className="mt-4 text-lg text-ink-600">
              We turn your free-text idea into structured signal, then run it through
              an embedding model to find investors who actually care.
            </p>
          </Reveal>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="lo-card p-7 h-full group cursor-default">
                  <div
                    className={`w-12 h-12 rounded-xl ${f.accent} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform`}
                  >
                    <f.icon className="w-6 h-6" strokeWidth={2.4} />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-ink-900">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-ink-600 leading-relaxed">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social proof / values ───────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="lo-card p-8 md:p-12 bg-ink-100 border-ink-200">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <span className="lo-pill">
                    <Sparkles className="w-3.5 h-3.5" />
                    What founders get
                  </span>
                  <h3 className="mt-5 text-3xl md:text-4xl font-extrabold text-ink-900 leading-tight">
                    Honest signal. Curated reach.{" "}
                    <span className="text-brand-700">Zero ghost intros.</span>
                  </h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Sub-score breakdown with actionable feedback",
                    "Top-3 investor match with personalized rationale",
                    "Public idea page — discoverable from day one",
                    "Resubmit and re-evaluate as your story evolves",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-ink-700 leading-relaxed"
                    >
                      <CheckCircle2 className="w-5 h-5 mt-0.5 text-brand-600 flex-none" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="lo-aurora" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <h2 className="text-display-md">
              Ready to{" "}
              <span className="text-brand-700">lift off</span>?
            </h2>
            <p className="mt-5 text-lg text-ink-600">
              Free to start. No credit card. Your first AI evaluation takes about
              thirty seconds.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="group h-14 px-8 text-base font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md lo-btn-glow cursor-pointer"
                >
                  <Rocket className="w-5 h-5 mr-1" />
                  Create your account
                  <ArrowRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
