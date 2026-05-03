import { API_URL, getAuthToken } from "@/context/AuthContext";

export interface LinkedAccount {
  id: number;
  rsn: string;
  is_primary: boolean;
  created_at: string;
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getAuthToken();
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}

export async function getAccounts(): Promise<LinkedAccount[]> {
  const res = await authedFetch("/members/me/accounts");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<LinkedAccount[]>;
}

export async function addAccount(rsn: string): Promise<LinkedAccount> {
  const res = await authedFetch("/members/me/accounts", {
    method: "POST",
    body: JSON.stringify({ rsn }),
  });
  if (!res.ok) {
    const data = await res.json() as { detail?: string };
    throw new Error(data.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<LinkedAccount>;
}

export async function setPrimaryAccount(id: number): Promise<LinkedAccount> {
  const res = await authedFetch(`/members/me/accounts/${id}/set-primary`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const data = await res.json() as { detail?: string };
    throw new Error(data.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<LinkedAccount>;
}

export async function removeAccount(id: number): Promise<void> {
  const res = await authedFetch(`/members/me/accounts/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json() as { detail?: string };
    throw new Error(data.detail ?? `HTTP ${res.status}`);
  }
}
