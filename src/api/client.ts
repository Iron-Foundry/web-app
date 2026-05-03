import { API_URL, getAuthHeaders } from "@/context/AuthContext";

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    // FastAPI HTTP exception: { detail: "string" }
    if (typeof b.detail === "string" && b.detail) return b.detail;
    // FastAPI validation error: { detail: [{ msg: "...", ... }] }
    if (Array.isArray(b.detail) && b.detail.length > 0) {
      const first = b.detail[0] as Record<string, unknown> | undefined;
      if (first && typeof first.msg === "string") return first.msg;
    }
  }
  return fallback;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {}
    throw new ApiRequestError(
      res.status,
      (body as { code?: string } | null)?.code ?? "UNKNOWN",
      extractMessage(body, res.statusText || `HTTP ${res.status}`),
      body,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
