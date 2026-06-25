import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useUpdateProfile } from "@/lib/profile-api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Sparkles, Lightbulb, MessageSquare, Plus, X,
  Loader2, Pencil, Briefcase, Rocket,
} from "lucide-react";

const SUGGESTED = [
  "AI/ML", "SaaS", "FinTech", "HealthTech", "EdTech", "E-Commerce",
  "Climate Tech", "Developer Tools", "Consumer", "Marketplace",
  "CyberSecurity", "Web3", "AgriTech", "Deep Tech", "Sustainability",
  "Robotics", "Creator Economy", "PropTech",
];

export default function Profile() {
  const { token, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: profile, isLoading } = useProfile();
  const update = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (!authLoading && !token) setLocation("/login");
  }, [token, authLoading, setLocation]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setFirm(profile.firm ?? "");
      setBio(profile.bio ?? "");
      setInterests(profile.interests ?? []);
    }
  }, [profile]);

  const isInvestor = profile?.role === "investor";

  const toggle = (tag: string) =>
    setInterests((p) => (p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]));
  const addCustom = () => {
    const v = custom.trim();
    if (v && !interests.includes(v)) setInterests((p) => [...p, v]);
    setCustom("");
  };

  const save = () => {
    update.mutate(
      {
        name: name.trim() || undefined,
        ...(isInvestor ? { firm: firm.trim() || null, bio: bio.trim() || null, interests } : {}),
      },
      {
        onSuccess: () => {
          toast({ title: "Profile updated" });
          setEditing(false);
        },
        onError: (e: Error) =>
          toast({ title: "Couldn't save", description: e.message, variant: "destructive" }),
      },
    );
  };

  if (authLoading || isLoading || !profile) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Header card */}
        <div className="lo-card p-6 md:p-8">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-sm">
              {profile.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-ink-900 truncate">
                  {profile.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                    isInvestor
                      ? "bg-brand-50 text-brand-700 border border-brand-100"
                      : "bg-ink-100 text-ink-700"
                  }`}
                >
                  {isInvestor ? <Briefcase className="w-3 h-3" /> : <Rocket className="w-3 h-3" />}
                  {isInvestor ? "Investor" : "Founder"}
                </span>
              </div>
              <p className="text-sm text-ink-500 mt-0.5">{profile.email}</p>
              {isInvestor && profile.firm && (
                <p className="text-sm font-semibold text-ink-700 mt-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-ink-400" />
                  {profile.firm}
                </p>
              )}
            </div>
            {!editing && (
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                className="border-ink-300 cursor-pointer"
              >
                <Pencil className="w-4 h-4 mr-1.5" /> Edit
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-xl bg-ink-50 border border-ink-100 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-500">
                <Lightbulb className="w-3.5 h-3.5" /> Ideas
              </div>
              <div className="text-2xl font-extrabold text-ink-900 mt-1">
                {profile.stats.ideas}
              </div>
            </div>
            <div className="rounded-xl bg-ink-50 border border-ink-100 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-500">
                <MessageSquare className="w-3.5 h-3.5" /> Conversations
              </div>
              <div className="text-2xl font-extrabold text-ink-900 mt-1">
                {profile.stats.conversations}
              </div>
            </div>
          </div>
        </div>

        {/* Body: view or edit */}
        {editing ? (
          <div className="lo-card p-6 md:p-8 space-y-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-ink-700">
                Display name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </div>

            {isInvestor && (
              <>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-700">
                    <Building2 className="w-4 h-4 text-ink-400" /> Firm
                  </Label>
                  <Input
                    value={firm}
                    onChange={(e) => setFirm(e.target.value)}
                    placeholder="e.g. Green Seed VC"
                    className="h-12 bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-700">
                    <Sparkles className="w-4 h-4 text-ink-400" /> Bio
                  </Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="What do you back, and what's your edge?"
                    className="resize-none bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wide text-ink-700">
                    Investment focus
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set([...SUGGESTED, ...interests])).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggle(tag)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                          interests.includes(tag)
                            ? "bg-brand-600 text-white border-brand-600"
                            : "bg-white text-ink-700 border-ink-200 hover:border-brand-300"
                        }`}
                      >
                        {tag}
                        {interests.includes(tag) && !SUGGESTED.includes(tag) && (
                          <X className="w-3 h-3" />
                        )}
                      </button>
                    ))}
                  </div>
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
              </>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setName(profile.name);
                  setFirm(profile.firm ?? "");
                  setBio(profile.bio ?? "");
                  setInterests(profile.interests ?? []);
                }}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={save}
                disabled={update.isPending}
                className="bg-brand-600 hover:bg-brand-700 text-white cursor-pointer"
              >
                {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
              </Button>
            </div>
          </div>
        ) : (
          isInvestor && (
            <div className="lo-card p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500 mb-2">
                  About
                </h3>
                <p className="text-ink-700 leading-relaxed">
                  {profile.bio || (
                    <span className="text-ink-400 italic">
                      No bio yet — click Edit to add one.
                    </span>
                  )}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500 mb-2">
                  Investment focus
                </h3>
                {profile.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-ink-400 italic">No focus areas set yet.</p>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </Layout>
  );
}
