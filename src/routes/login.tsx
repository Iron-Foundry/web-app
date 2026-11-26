import { useState } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { rootRoute } from "./__root";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_URL, useAuth } from "@/context/AuthContext";
import { DiscordIcon } from "@/components/layout/FooterIcons";
import logo from "@/assets/LogoTSPSmall-320x320.png";

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const PANEL = "flex flex-col gap-3 rounded-xl border border-border bg-card p-6";

function LoginPage() {
  const { login, refresh } = useAuth();
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleApiKeyLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const resp = await fetch(`${API_URL}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });
      if (resp.status === 401) {
        setError("Invalid key");
        return;
      }
      if (!resp.ok) {
        setError("Something went wrong - please try again.");
        return;
      }
      const { token } = (await resp.json()) as { token: string };
      localStorage.setItem("auth_token", token);
      await refresh();
      navigate({ to: "/members" });
    } catch {
      setError("Network error - please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 py-12 text-center">
      <img src={logo} alt="Iron Foundry monogram" className="h-16 w-16" />
      <h1 className="font-rs-bold text-5xl leading-none text-mark">Sign In</h1>

      <div className="grid w-full gap-5 text-left md:grid-cols-2">
        <section className={PANEL}>
          <h2 className="font-rs-bold text-xl">Discord</h2>
          <p className="flex-1 text-mk-body">
            One-click login with your Discord account. You must be a member of the Iron Foundry server.
          </p>
          <Button onClick={login} className="w-full">
            <DiscordIcon />
            Login with Discord
          </Button>
        </section>

        <section className={PANEL}>
          <h2 className="font-rs-bold text-xl">API Key</h2>
          <p className="text-mk-body">
            Run <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">/userkey action:'new'</code> to request one on Discord.
          </p>
          <form onSubmit={handleApiKeyLogin} className="flex flex-col gap-3">
            <label className="grid gap-1.5 text-sm text-muted-foreground">
              Key
              <Input type="password" placeholder="your-key-here" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required />
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" variant="outline" disabled={submitting} className="w-full">
              <KeyRound />
              {submitting ? "Logging in…" : "Login"}
            </Button>
          </form>
        </section>
      </div>

      <p className="text-sm text-muted-foreground">Only members of the Iron Foundry clan Discord can access the member area.</p>
    </div>
  );
}
