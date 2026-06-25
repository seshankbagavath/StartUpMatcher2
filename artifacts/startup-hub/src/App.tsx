import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { AnimatePresence, motion } from "framer-motion";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import SubmitIdea from "@/pages/submit";
import Startups from "@/pages/startups";
import IdeaDetail from "@/pages/idea-detail";
import Messages from "@/pages/messages";
import Onboarding from "@/pages/onboarding";
import Profile from "@/pages/profile";

const queryClient = new QueryClient();

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18, ease: "easeIn" as const } },
};

function AnimatedRoutes() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex-1 flex flex-col"
      >
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/submit" component={SubmitIdea} />
          <Route path="/startups" component={Startups} />
          <Route path="/messages" component={Messages} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/profile" component={Profile} />
          <Route path="/ideas/:id" component={IdeaDetail} />
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AnimatedRoutes />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
