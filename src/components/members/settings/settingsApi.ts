import { API_URL, getAuthToken } from "@/context/AuthContext";

export const INPUT_CLASS =
  "flex-1 min-w-0 rounded-lg border border-input bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export async function authedPatch(path: string, body: unknown): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
    body: JSON.stringify(body),
  });
}

/** The key with all but its first and last six characters hidden. */
export function maskKey(key: string): string {
  if (key.length <= 12) return "•".repeat(key.length);
  return key.slice(0, 6) + "•".repeat(key.length - 12) + key.slice(-6);
}
