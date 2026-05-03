import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AuthUser } from "@/types/auth";

export type { AuthUser } from "@/types/auth";

export const API_URL: string =
  (window as unknown as { __API_URL__?: string }).__API_URL__ ??
  "http://localhost:8000";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refresh: async () => {},
});

const TOKEN_KEY = "auth_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchMe(token: string): Promise<AuthUser | null> {
  const r = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json() as AuthUser;
  return {
    ...data,
    alts_count: data.alts_count ?? 0,
    discord_roles: data.discord_roles ?? [],
    effective_roles: data.effective_roles ?? data.discord_roles ?? [],
    role_labels: data.role_labels ?? {},
    stats_opt_out: data.stats_opt_out ?? false,
    hide_presence_notifications: data.hide_presence_notifications ?? false,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      localStorage.setItem(TOKEN_KEY, urlToken);
      params.delete("token");
      const newSearch = params.toString();
      const newUrl =
        window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState({}, "", newUrl);
    }

    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }

    fetchMe(stored)
      .then((data) => {
        if (data) {
          setUser(data);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .catch(() => {
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(() => {
    window.location.href = `${API_URL}/auth/login`;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const data = await fetchMe(token);
      if (data) {
        setUser(data);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      }
    } catch {
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
