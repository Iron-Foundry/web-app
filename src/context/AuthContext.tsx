import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export const API_URL: string =
  (window as unknown as { __API_URL__?: string }).__API_URL__ ??
  "http://localhost:8000";

export interface AuthUser {
  discord_user_id: string;
  username: string;
  avatar: string | null;
  rsn: string | null;
  clan_rank: string | null;      // raw in-game OSRS rank name
  discord_roles: string[];       // Discord role names - used for permission checks
  stats_opt_out: boolean;
}

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
  return sessionStorage.getItem(TOKEN_KEY);
}

async function fetchMe(token: string): Promise<AuthUser | null> {
  try {
    const r = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const data = await r.json() as AuthUser;
    // Ensure array fields have defaults for older API responses
    return {
      ...data,
      discord_roles: data.discord_roles ?? [],
      stats_opt_out: data.stats_opt_out ?? false,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Absorb token from URL param (OAuth2 callback)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      sessionStorage.setItem(TOKEN_KEY, urlToken);
      params.delete("token");
      const newSearch = params.toString();
      const newUrl =
        window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState({}, "", newUrl);
    }

    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }

    fetchMe(stored)
      .then((data) => {
        if (data) {
          setUser(data);
        } else {
          sessionStorage.removeItem(TOKEN_KEY);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(() => {
    window.location.href = `${API_URL}/auth/login`;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return;
    const data = await fetchMe(token);
    if (data) {
      setUser(data);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      setUser(null);
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
