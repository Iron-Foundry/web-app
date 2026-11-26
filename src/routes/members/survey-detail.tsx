import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { API_URL, getAuthHeaders, useAuth } from "@/context/AuthContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { usePermissions } from "@/context/PermissionsContext";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/layout/PageHead";
import { ClosedTemplate, EditableField, ReadOnlyField } from "@/components/members/surveys/SurveyFields";
import { missingRequired, submitErrorText, type TemplateDetail } from "@/components/members/surveys/surveyTypes";

type Category = "survey" | "application";
type LoadState = { kind: "loading" } | { kind: "denied" } | { kind: "ready"; template: TemplateDetail };

async function fetchTemplate(templateId: string): Promise<TemplateDetail | null> {
  const r = await fetch(`${API_URL}/surveys/${templateId}`, { headers: getAuthHeaders() });
  if (r.status === 403 || r.status === 404) return null;
  if (!r.ok) throw new Error(`template answered ${r.status}`);
  return (await r.json()) as TemplateDetail;
}

function TemplateHead({ template, category, submitted }: { template: TemplateDetail; category: Category; submitted: boolean }): React.ReactElement {
  return (
    <PageHead title={template.title} lede={template.description}>
      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        {category === "survey"
          ? <Link to="/members/surveys" className="hover:text-foreground">Surveys</Link>
          : <Link to="/members/applications" className="hover:text-foreground">Applications</Link>}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{template.title}</span>
      </p>
      <p className="flex gap-4 text-xs font-bold uppercase tracking-wide">
        <span className={template.is_open ? "text-mk-green" : "text-destructive"}>{template.is_open ? "Open" : "Closed"}</span>
        {submitted && <span className="text-mk-green">Submitted</span>}
      </p>
    </PageHead>
  );
}

export function SurveyDetailPage({ category, templateId }: { category: Category; templateId: string }) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [localSubmission, setLocalSubmission] = useState<Record<string, unknown> | null>(null);
  const isStaff = hasPermission("staff.surveys", "read", useEffectiveRoles(user?.effective_roles ?? []));

  useEffect(() => {
    fetchTemplate(templateId).then(
      (template) => setState(template ? { kind: "ready", template } : { kind: "denied" }),
      () => setState({ kind: "denied" }),
    );
  }, [templateId]);

  function handleAnswerChange(id: string, val: unknown): void {
    setAnswers((prev) => ({ ...prev, [id]: val }));
    setErrors((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  async function handleSubmit(template: TemplateDetail): Promise<void> {
    const missing = missingRequired(template.fields, answers);
    if (missing.size > 0) { setErrors(missing); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${API_URL}/surveys/${templateId}/responses`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.ok || res.status === 409) setLocalSubmission(answers);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSubmitError(submitErrorText(res.status, data?.detail));
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (state.kind === "loading") return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (state.kind === "denied") return <p className="text-sm text-muted-foreground">Template not found or you do not have access.</p>;

  const { template } = state;
  const submission = localSubmission ?? template.user_submission;

  return (
    <div className="max-w-2xl space-y-8">
      <TemplateHead template={template} category={category} submitted={submission !== null} />
      {template.fields.length === 0 && <p className="text-sm text-muted-foreground">No questions defined.</p>}

      {submission !== null && (
        <div className="grid gap-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your submission (read-only)</p>
          {template.fields.map((field) => <ReadOnlyField key={field.id} field={field} value={submission[field.id]} />)}
        </div>
      )}

      {submission === null && template.is_open && template.fields.length > 0 && (
        <div className="grid gap-6">
          {template.fields.map((field) => (
            <EditableField key={field.id} field={field} value={answers[field.id]} onChange={handleAnswerChange} hasError={errors.has(field.id)} />
          ))}
          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          <div><Button onClick={() => handleSubmit(template)} disabled={submitting}>{submitting ? "Submitting…" : "Submit"}</Button></div>
        </div>
      )}

      {submission === null && !template.is_open && <ClosedTemplate fields={template.fields} isStaff={isStaff} category={category} />}
    </div>
  );
}
