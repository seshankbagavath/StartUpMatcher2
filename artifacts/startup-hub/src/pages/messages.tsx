import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useThreads,
  useThreadMessages,
  useSendMessage,
} from "@/lib/threads-api";
import { MessageSquare, Send, Building2, Rocket } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const { token, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !token) setLocation("/login");
  }, [token, authLoading, setLocation]);

  const { data: threads, isLoading: threadsLoading } = useThreads();
  const { data: messages, isLoading: msgsLoading } = useThreadMessages(activeId);
  const send = useSendMessage(activeId);

  // Auto-select first thread
  useEffect(() => {
    if (!activeId && threads && threads.length > 0) setActiveId(threads[0].id);
  }, [threads, activeId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const active = threads?.find((t) => t.id === activeId) ?? null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeId) return;
    send.mutate(body, { onSuccess: () => setDraft("") });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6">
          <h1 className="text-display-sm">Messages</h1>
          <p className="mt-2 text-ink-600">
            Conversations between founders and investors.
          </p>
        </div>

        <div className="lo-card overflow-hidden grid md:grid-cols-[320px_1fr] h-[600px]">
          {/* Thread list */}
          <div className="border-r border-ink-200 overflow-y-auto">
            {threadsLoading ? (
              <div className="p-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : threads && threads.length > 0 ? (
              <ul className="divide-y divide-ink-100">
                {threads.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => setActiveId(t.id)}
                      className={`w-full text-left p-4 transition-colors cursor-pointer ${
                        t.id === activeId ? "bg-brand-50" : "hover:bg-ink-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            t.role === "investor"
                              ? "bg-brand-100 text-brand-700"
                              : "bg-ink-200 text-ink-700"
                          }`}
                        >
                          {t.role === "investor" ? (
                            <Rocket className="w-3.5 h-3.5" />
                          ) : (
                            <Building2 className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <span className="font-bold text-ink-900 text-sm truncate">
                          {t.counterpartName}
                        </span>
                      </div>
                      <div className="text-xs text-ink-500 truncate">
                        re: {t.ideaTitle}
                      </div>
                      {t.lastMessage && (
                        <div className="text-xs text-ink-600 truncate mt-1">
                          {t.lastMessage}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-sm text-ink-500">
                No conversations yet. Investors can reach out from a public idea on
                the Browse page.
              </div>
            )}
          </div>

          {/* Conversation */}
          <div className="flex flex-col">
            {active ? (
              <>
                <div className="px-5 py-3 border-b border-ink-200 bg-white">
                  <div className="font-bold text-ink-900">
                    {active.counterpartName}
                    {active.counterpartFirm && (
                      <span className="font-normal text-ink-500">
                        {" "}· {active.counterpartFirm}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-500">re: {active.ideaTitle}</div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
                  {msgsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-2/3" />
                      <Skeleton className="h-10 w-1/2 ml-auto" />
                    </div>
                  ) : messages && messages.length > 0 ? (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            m.mine
                              ? "bg-brand-600 text-white rounded-br-md"
                              : "bg-ink-100 text-ink-900 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{m.body}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              m.mine ? "text-white/70" : "text-ink-500"
                            }`}
                          >
                            {formatDistanceToNow(new Date(m.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-ink-500">
                      No messages yet — say hello.
                    </div>
                  )}
                </div>

                <form
                  onSubmit={handleSend}
                  className="p-4 border-t border-ink-200 bg-white flex gap-2"
                >
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a message…"
                    className="h-11 bg-white border-ink-200 focus-visible:ring-2 focus-visible:ring-brand-500"
                  />
                  <Button
                    type="submit"
                    disabled={!draft.trim() || send.isPending}
                    className="h-11 px-4 bg-brand-600 hover:bg-brand-700 text-white cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="w-12 h-12 text-ink-300 mb-3" />
                <p className="text-ink-600">Select a conversation to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
