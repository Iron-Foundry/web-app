import { apiFetch } from "./client";
import type { AuthUser } from "@/types/auth";

export const authApi = {
  getMe: () => apiFetch<AuthUser>("/auth/me"),

  loginWithApiKey: (apiKey: string) =>
    apiFetch<{ token: string }>("/auth/token", {
      method: "POST",
      body: JSON.stringify({ api_key: apiKey }),
    }),
};
