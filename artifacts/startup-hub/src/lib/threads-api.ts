/**
 * Lightweight client + React Query hooks for founder↔investor messaging.
 * Uses relative /api URLs (Vite proxies to the API) and the stored bearer token.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export interface ThreadSummary {
  id: string;
  ideaId: string;
  ideaTitle: string;
  role: "founder" | "investor";
  counterpartName: string;
  counterpartFirm: string | null;
  lastMessage: string | null;
  updatedAt: string;
}

export interface ThreadMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  mine: boolean;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("startup_hub_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useThreads() {
  return useQuery({
    queryKey: ["threads"],
    queryFn: () => apiFetch<ThreadSummary[]>("/threads"),
  });
}

export function useThreadMessages(threadId: string | null) {
  return useQuery({
    queryKey: ["threads", threadId, "messages"],
    enabled: !!threadId,
    queryFn: () => apiFetch<ThreadMessage[]>(`/threads/${threadId}/messages`),
    refetchInterval: 5000,
  });
}

export function useSendMessage(threadId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      apiFetch<ThreadMessage>(`/threads/${threadId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["threads", threadId, "messages"] });
      qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });
}

export function useStartThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: string | { ideaId: string; investorId?: string }) => {
      const body = typeof input === "string" ? { ideaId: input } : input;
      return apiFetch<{ id: string }>("/threads", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["threads"] }),
  });
}
