import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, PlusCircle, Search, Rocket, MessageSquare } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const { toast } = useToast();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
        toast({ title: "See you next launch" });
        setLocation("/");
      },
      onError: () => {
        logout();
        setLocation("/");
      },
    });
  };

  const navLink = (
    href: string,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
  ) => {
    const active = location === href;
    return (
      <Link
        href={href}
        className={`group relative flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
          active
            ? "text-brand-700"
            : "text-ink-600 hover:text-ink-900"
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
        {active && (
          <motion.span
            layoutId="nav-indicator"
            className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col text-ink-900">
      <header className="sticky top-0 z-50 w-full border-b border-ink-200/70 bg-white/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
              <motion.div
                className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 shadow-md"
                whileHover={{ scale: 1.06, rotate: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              >
                <Rocket className="w-5 h-5 text-white" strokeWidth={2.5} />
              </motion.div>
              <span className="font-display font-extrabold text-xl tracking-tight">
                Lift<span className="text-gradient-brand">Off</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLink("/startups", "Browse", Search)}
              {user && user.role !== "investor" &&
                navLink("/dashboard", "Dashboard", LayoutDashboard)}
              {user && user.role !== "investor" &&
                navLink("/submit", "Submit Idea", PlusCircle)}
              {user && navLink("/messages", "Messages", MessageSquare)}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 group cursor-pointer"
                >
                  <span className="hidden sm:inline-block text-sm font-semibold text-ink-700 group-hover:text-ink-900 transition-colors">
                    {user.name}
                  </span>
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold text-sm group-hover:ring-2 group-hover:ring-brand-300 transition-all">
                    {user.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-ink-600 hover:text-ink-900 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Sign out</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-ink-600 hover:text-ink-900 transition-colors px-3 py-2 cursor-pointer"
                >
                  Log in
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm lo-btn-glow cursor-pointer"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative">{children}</main>
    </div>
  );
}
