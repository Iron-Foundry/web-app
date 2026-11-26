import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/layout/PageHead";
import { cn } from "@/lib/utils";

export interface TemplateEntry {
  template_id: string;
  title: string;
  description: string | null;
  is_open: boolean;
  category: "survey" | "application";
  user_submitted: boolean;
}

export type TemplateCategory = "survey" | "application";

const COPY: Record<TemplateCategory, { title: string; lede: string; empty: string; endpoint: string }> = {
  survey: { title: "Surveys", lede: "Clan surveys and feedback forms.", empty: "No surveys available.", endpoint: "/surveys" },
  application: { title: "Applications", lede: "Open applications for clan roles and events.", empty: "No open applications.", endpoint: "/surveys/applications" },
};

/** The action a template card offers: the submission, the form, or a read-only view. */
export function templateAction(entry: Pick<TemplateEntry, "is_open" | "user_submitted">): "View submission" | "Fill out" | "View" {
  if (entry.user_submitted) return "View submission";
  return entry.is_open ? "Fill out" : "View";
}

function TemplateLink({ category, id, children }: { category: TemplateCategory; id: string; children: React.ReactNode }): React.ReactElement {
  return category === "survey"
    ? <Link to="/members/surveys/$templateId" params={{ templateId: id }}>{children}</Link>
    : <Link to="/members/applications/$templateId" params={{ templateId: id }}>{children}</Link>;
}

function TemplateCard({ entry, category }: { entry: TemplateEntry; category: TemplateCategory }): React.ReactElement {
  const action = templateAction(entry);
  return (
    <article className={cn("flex flex-col gap-3 rounded-xl border border-border bg-card p-5", !entry.is_open && "opacity-60")}>
      <header className="flex items-start justify-between gap-3">
        <h2 className="font-rs-bold text-xl leading-tight">{entry.title}</h2>
        <span className={cn("text-xs font-bold uppercase tracking-wide", entry.is_open ? "text-mk-green" : "text-destructive")}>
          {entry.is_open ? "Open" : "Closed"}
        </span>
      </header>
      {entry.description && <p className="text-sm text-mk-body">{entry.description}</p>}
      <div className="mt-auto">
        <TemplateLink category={category} id={entry.template_id}>
          <Button size="sm" variant={action === "Fill out" ? "default" : "outline"}>{action}</Button>
        </TemplateLink>
      </div>
    </article>
  );
}

type ListState = { kind: "loading" } | { kind: "failed" } | { kind: "ready"; entries: TemplateEntry[] };

/** The survey or application templates a member can answer or has answered. */
export function TemplateList({ category }: { category: TemplateCategory }): React.ReactElement {
  const copy = COPY[category];
  const [state, setState] = useState<ListState>({ kind: "loading" });

  useEffect(() => {
    fetch(`${API_URL}${copy.endpoint}`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? (r.json() as Promise<TemplateEntry[]>) : Promise.reject(new Error(`${r.status}`))))
      .then((entries) => setState({ kind: "ready", entries }), () => setState({ kind: "failed" }));
  }, [copy.endpoint]);

  return (
    <div className="space-y-6">
      <PageHead title={copy.title} lede={copy.lede} />
      {state.kind === "loading" && <p className="text-sm text-muted-foreground">Loading…</p>}
      {state.kind === "failed" && <p className="text-sm text-destructive">The list could not be loaded. Try again later.</p>}
      {state.kind === "ready" && state.entries.length === 0 && <p className="text-sm text-muted-foreground">{copy.empty}</p>}
      {state.kind === "ready" && state.entries.length > 0 && (
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.entries.map((entry) => <TemplateCard key={entry.template_id} entry={entry} category={category} />)}
        </div>
      )}
    </div>
  );
}
