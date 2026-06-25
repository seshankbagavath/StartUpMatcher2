import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
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
import { Rocket, Mail, Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (response) => {
          login(response.token);
          toast({ title: "Welcome back", description: "Ready for takeoff." });
          setLocation(response.user.role === "investor" ? "/startups" : "/dashboard");
        },
        onError: (error) => {
          toast({
            title: "Login failed",
            description: error.message || "Please check your credentials.",
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
          className="relative w-full max-w-md"
        >
          <div className="lo-card p-8 md:p-10">
            <motion.div variants={item} className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-sm mb-4">
                <Rocket className="w-7 h-7" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Welcome back
              </h1>
              <p className="mt-2 text-ink-600">Log in to launch your next idea.</p>
            </motion.div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <motion.div variants={item}>
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
                </motion.div>

                <motion.div variants={item}>
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
                              placeholder="••••••••"
                              {...field}
                              className="h-12 pl-10 bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={item}>
                  <Button
                    type="submit"
                    className="w-full h-12 font-bold text-base bg-brand-600 hover:bg-brand-700 text-white shadow-sm lo-btn-glow cursor-pointer"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Logging in…
                      </span>
                    ) : (
                      "Log in"
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>

            <motion.p
              variants={item}
              className="text-center text-sm text-ink-600 mt-7"
            >
              No account?{" "}
              <Link
                href="/register"
                className="text-brand-700 hover:text-brand-800 font-bold underline-offset-2 hover:underline cursor-pointer"
              >
                Sign up free
              </Link>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
