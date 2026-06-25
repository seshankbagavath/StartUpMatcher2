import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Rocket, User, Mail, Lock, CheckCircle2, Building2, Briefcase } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const perks = [
  "AI-graded across 4 dimensions",
  "Top-3 investor matches in seconds",
  "Free forever for individual founders",
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const [role, setRole] = useState<"founder" | "investor">("founder");
  const [firm, setFirm] = useState("");

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(
      {
        data: {
          ...data,
          role,
          ...(role === "investor" && firm.trim() ? { firm: firm.trim() } : {}),
        },
      },
      {
        onSuccess: (response) => {
          login(response.token);
          toast({
            title: "Welcome aboard",
            description:
              role === "investor"
                ? "Start discovering founders."
                : "Your launchpad is ready.",
          });
          setLocation(role === "investor" ? "/onboarding" : "/dashboard");
        },
        onError: (error) => {
          toast({
            title: "Registration failed",
            description: error.message || "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <Layout>
      <div className="relative flex-1 flex items-center justify-center py-16 px-4 overflow-hidden">
        <div className="lo-aurora" />
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative w-full max-w-5xl grid md:grid-cols-2 gap-8 items-stretch"
        >
          {/* Left: perks panel */}
          <motion.div variants={item} className="hidden md:flex">
            <div className="relative w-full lo-card p-10 bg-ink-100 border-ink-200 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-brand-200/40 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-ink-200/60 blur-3xl" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mb-6 shadow-sm">
                  <Rocket className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-extrabold leading-tight text-ink-900">
                  Start your{" "}
                  <span className="text-brand-700">launch sequence</span>.
                </h2>
                <p className="mt-4 text-ink-600 leading-relaxed">
                  Get honest AI feedback and curated investor matches — free, no
                  credit card required.
                </p>
                <ul className="mt-8 space-y-3">
                  {perks.map((p) => (
                    <li key={p} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 text-brand-600 flex-none" />
                      <span className="text-ink-700">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Right: form */}
          <motion.div variants={item}>
            <div className="lo-card p-8 md:p-10 h-full">
              <div className="flex flex-col items-center mb-8 md:items-start">
                <div className="md:hidden w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-sm mb-4">
                  <Rocket className="w-6 h-6" strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Create your account
                </h1>
                <p className="mt-2 text-ink-600">It takes about 30 seconds.</p>
              </div>

              {/* Role selector */}
              <div className="mb-5">
                <p className="text-ink-700 text-xs font-bold uppercase tracking-wide mb-2">
                  I'm a…
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "founder", label: "Founder", icon: Rocket, hint: "Submit & score ideas" },
                    { value: "investor", label: "Investor", icon: Briefcase, hint: "Discover & message founders" },
                  ] as const).map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                        role === r.value
                          ? "bg-brand-50 border-brand-400"
                          : "bg-white border-ink-200 hover:border-brand-300"
                      }`}
                    >
                      <r.icon
                        className={`w-5 h-5 mb-1 ${role === r.value ? "text-brand-700" : "text-ink-500"}`}
                      />
                      <div className="text-sm font-bold text-ink-900">{r.label}</div>
                      <div className="text-xs text-ink-500">{r.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  {role === "investor" && (
                    <div className="space-y-1.5">
                      <FormLabel className="text-ink-700 text-xs font-bold uppercase tracking-wide">
                        Firm{" "}
                        <span className="text-[10px] font-semibold text-ink-500 bg-ink-100 px-1.5 py-0.5 rounded normal-case">
                          optional
                        </span>
                      </FormLabel>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                        <Input
                          placeholder="e.g. Green Seed VC"
                          value={firm}
                          onChange={(e) => setFirm(e.target.value)}
                          className="h-12 pl-10 bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500"
                        />
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-ink-700 text-xs font-bold uppercase tracking-wide">
                          Full name
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                            <Input
                              placeholder="Ada Lovelace"
                              {...field}
                              className="h-12 pl-10 bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-ink-700 text-xs font-bold uppercase tracking-wide">
                          Email
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                            <Input
                              placeholder="founder@startup.com"
                              {...field}
                              className="h-12 pl-10 bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-ink-700 text-xs font-bold uppercase tracking-wide">
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                            <Input
                              type="password"
                              placeholder="At least 6 characters"
                              {...field}
                              className="h-12 pl-10 bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 font-bold text-base bg-brand-600 hover:bg-brand-700 text-white shadow-sm lo-btn-glow cursor-pointer"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Creating account…
                      </span>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </form>
              </Form>

              <p className="text-center md:text-left text-sm text-ink-600 mt-7">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-brand-700 hover:text-brand-800 font-bold underline-offset-2 hover:underline cursor-pointer"
                >
                  Log in
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
