/**
 * Client + hooks for the current user's profile.
 * Uses relative /api URLs (Vite proxy) + the stored bearer token.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: "founder" | "investor";
  firm: string | null;
  bio: string | null;
  interests: string[];
  createdAt: string;
  stats: { ideas: number; conversations: number };
}

export interface ProfileUpdate {
  name?: string;
  firm?: string | null;
  bio?: string | null;
  interests?: string[];
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

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => apiFetch<Profile>("/profile"),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (update: ProfileUpdate) =>
      apiFetch<Profile>("/profile", {
        method: "PUT",
        body: JSON.stringify(update),
      }),
    onSuccess: (data) => {
      qc.setQueryData(["profile"], data);
      // Keep the auth context's name/role in sync
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    },
  });
}
