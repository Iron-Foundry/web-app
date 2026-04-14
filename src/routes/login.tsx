import { useState } from "react";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { API_URL, useAuth } from "@/context/AuthContext";

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
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
      sessionStorage.setItem("auth_token", token);
      navigate({ to: "/members" });
    } catch {
      setError("Network error - please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-12">
      <h1 className="mb-8 text-center font-rs-bold text-4xl text-primary">
        Sign In
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Discord OAuth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Discord</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              One-click login with your Discord account. You must be a member of
              the Iron Foundry server.
            </p>
            <Button onClick={login} className="w-full">
              <svg
                className="mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="-3 -3 22 22"
              >
                <path
                  fill="#5865F2"
                  fillRule="evenodd"
                  d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"
                />
              </svg>
              Login with Discord
            </Button>
          </CardContent>
        </Card>

        {/* API key */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Generate a key in Discord with <code>/userkey new</code>, then
              paste it below.
            </p>
            <form onSubmit={handleApiKeyLogin} className="flex flex-col gap-3">
              <Input
                type="password"
                placeholder="your-key-here"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" variant="outline" disabled={submitting}>
                {submitting ? "Logging in…" : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />
      <p className="text-center text-xs text-muted-foreground">
        Only Iron Foundry clan members can access the members area.
      </p>
    </div>
  );
}
