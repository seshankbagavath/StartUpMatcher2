import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useUpdateProfile } from "@/lib/profile-api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Building2, Sparkles, ArrowRight, Plus, X, Loader2 } from "lucide-react";

const SUGGESTED = [
  "AI/ML", "SaaS", "FinTech", "HealthTech", "EdTech", "E-Commerce",
  "Climate Tech", "Developer Tools", "Consumer", "Marketplace",
  "CyberSecurity", "Web3", "AgriTech", "Deep Tech", "Sustainability",
  "Robotics", "Creator Economy", "PropTech",
];

export default function Onboarding() {
  const { token, user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [firm, setFirm] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (!authLoading && !token) setLocation("/login");
    // Founders don't need investor onboarding
    if (!authLoading && user && user.role !== "investor") setLocation("/dashboard");
  }, [token, user, authLoading, setLocation]);

  // Prefill from any existing profile data
  useEffect(() => {
    if (profile) {
      setFirm(profile.firm ?? "");
      setBio(profile.bio ?? "");
      setInterests(profile.interests ?? []);
    }
  }, [profile]);

  const toggle = (tag: string) =>
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const addCustom = () => {
    const v = custom.trim();
    if (v && !interests.includes(v)) setInterests((prev) => [...prev, v]);
    setCustom("");
  };

  const save = (skip = false) => {
    update.mutate(
      skip
        ? {}
        : {
            firm: firm.trim() || null,
            bio: bio.trim() || null,
            interests,
          },
      {
        onSuccess: () => {
          if (!skip)
            toast({ title: "Profile saved", description: "You're all set to discover founders." });
          setLocation("/startups");
        },
        onError: (e: Error) =>
          toast({ title: "Couldn't save", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <Layout>
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="lo-aurora" />
        <div className="relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white shadow-sm mb-4">
              <Briefcase className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <h1 className="text-display-sm">Set up your investor profile</h1>
            <p className="mt-2 text-ink-600">
              Tell founders who you are and what you back. You can change this anytime.
            </p>
          </div>

          <div className="lo-card p-6 md:p-8 space-y-6">
            {/* Firm */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-700">
                <Building2 className="w-4 h-4 text-ink-400" />
                Firm
              </Label>
              <Input
                placeholder="e.g. Green Seed VC"
                value={firm}
                onChange={(e) => setFirm(e.target.value)}
                className="h-12 bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-700">
                <Sparkles className="w-4 h-4 text-ink-400" />
                Bio
              </Label>
              <Textarea
                placeholder="What kind of founders and stages do you back? What's your edge?"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="resize-none bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-ink-700">
                Investment focus
              </Label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggle(tag)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                      interests.includes(tag)
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-ink-700 border-ink-200 hover:border-brand-300"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Custom interests */}
              {interests.filter((t) => !SUGGESTED.includes(t)).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {interests
                    .filter((t) => !SUGGESTED.includes(t))
                    .map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-600 text-white"
                      >
                        {tag}
                        <button type="button" onClick={() => toggle(tag)} className="cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Add your own…"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                  className="h-10 bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustom}
                  className="h-10 px-3 border-ink-300 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => save(true)}
                disabled={update.isPending}
                className="text-sm font-semibold text-ink-500 hover:text-ink-800 transition-colors cursor-pointer"
              >
                Skip for now
              </button>
              <Button
                onClick={() => save(false)}
                disabled={update.isPending}
                className="h-12 px-6 font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm lo-btn-glow cursor-pointer"
              >
                {update.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Start discovering
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
