import { useEffect, useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { membersLayoutRoute } from "./_layout";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { registerPage } from "@/lib/permissions";

registerPage({
  id: "members.surveys",
  label: "Surveys",
  description: "Member survey list and submission page.",
  defaults: { read: [], create: [], edit: [], delete: [] },
});

export const membersSurveysRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/surveys",
  component: SurveysPage,
});



interface SurveyEntry {
  template_id: string;
  title: string;
  description: string | null;
  is_open: boolean;
  category: "survey" | "application";
  user_submitted: boolean;
}



function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}



function SurveyCard({ entry }: { entry: SurveyEntry }) {
  const isOpen = entry.is_open;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h2 className="font-rs-bold text-lg text-primary leading-tight">{entry.title}</h2>
          {isOpen ? (
            <Badge variant="default" className="text-xs">
              Open
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Closed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {entry.description && (
          <p className="text-sm text-muted-foreground">{entry.description}</p>
        )}
        <div className="pt-1">
          {entry.user_submitted ? (
            <Link
              to="/members/surveys/$templateId"
              params={{ templateId: entry.template_id }}
            >
              <Button variant="outline" size="sm">
                View submission
              </Button>
            </Link>
          ) : isOpen ? (
            <Link
              to="/members/surveys/$templateId"
              params={{ templateId: entry.template_id }}
            >
              <Button size="sm">Fill out</Button>
            </Link>
          ) : (
            <Link
              to="/members/surveys/$templateId"
              params={{ templateId: entry.template_id }}
            >
              <Button variant="ghost" size="sm">
                View
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}



function SurveysPage() {
  const [entries, setEntries] = useState<SurveyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/surveys`, { headers: authHeaders() })
      .then((r) => (r.ok ? (r.json() as Promise<SurveyEntry[]>) : Promise.reject()))
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Surveys</h1>
        <p className="text-sm text-muted-foreground">Clan surveys and feedback forms.</p>
      </div>

      <Separator />

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading && entries.length === 0 && (
        <p className="text-sm text-muted-foreground">No surveys available.</p>
      )}

      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <SurveyCard key={entry.template_id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
