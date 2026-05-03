import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { API_URL, getAuthHeaders, useAuth } from "@/context/AuthContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { usePermissions } from "@/context/PermissionsContext";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";



interface Field {
  id: string;
  type: "yes_no" | "short_text" | "long_text" | "select";
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
  max_choices?: number;
}

interface TemplateDetail {
  template_id: string;
  title: string;
  description: string | null;
  is_open: boolean;
  category: string;
  is_active: boolean;
  fields: Field[];
  user_submission: Record<string, unknown> | null;
}






function ReadOnlyField({ field, value }: { field: Field; value: unknown }) {
  const display = (() => {
    if (value === undefined || value === null || value === "") return "-";
    if (Array.isArray(value)) return (value as string[]).join(", ");
    return String(value);
  })();

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </p>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      <p className="text-sm rounded-md border bg-muted/40 px-3 py-2 min-h-[2.25rem]">
        {display}
      </p>
    </div>
  );
}

function EditableField({
  field,
  value,
  onChange,
  hasError,
}: {
  field: Field;
  value: unknown;
  onChange: (id: string, val: unknown) => void;
  hasError: boolean;
}) {
  const label = (
    <p className="text-sm font-medium">
      {field.label}
      {field.required && <span className="text-destructive ml-1">*</span>}
    </p>
  );
  const desc = field.description ? (
    <p className="text-xs text-muted-foreground">{field.description}</p>
  ) : null;
  const errorMsg = hasError ? (
    <p className="text-xs text-destructive">This field is required.</p>
  ) : null;

  if (field.type === "yes_no") {
    return (
      <div className="space-y-1">
        {label}
        {desc}
        <ToggleGroup
          type="single"
          variant="outline"
          value={typeof value === "string" ? value : ""}
          onValueChange={(v) => onChange(field.id, v)}
        >
          <ToggleGroupItem value="yes">Yes</ToggleGroupItem>
          <ToggleGroupItem value="no">No</ToggleGroupItem>
        </ToggleGroup>
        {errorMsg}
      </div>
    );
  }

  if (field.type === "short_text") {
    return (
      <div className="space-y-1">
        {label}
        {desc}
        <Input
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={cn(hasError && "border-destructive focus-visible:ring-destructive")}
        />
        {errorMsg}
      </div>
    );
  }

  if (field.type === "long_text") {
    return (
      <div className="space-y-1">
        {label}
        {desc}
        <Textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={cn(hasError && "border-destructive focus-visible:ring-destructive")}
          rows={4}
        />
        {errorMsg}
      </div>
    );
  }

  if (field.type === "select") {
    const maxChoices = field.max_choices ?? 1;
    const opts = field.options ?? [];

    if (maxChoices === 1) {
      return (
        <div className="space-y-1">
          {label}
          {desc}
          <Select
            value={typeof value === "string" ? value : ""}
            onValueChange={(v) => onChange(field.id, v)}
          >
            <SelectTrigger
              className={cn(hasError && "border-destructive focus:ring-destructive")}
            >
              <SelectValue placeholder="Select an option…" />
            </SelectTrigger>
            <SelectContent>
              {opts.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errorMsg}
        </div>
      );
    }

    const currentValues = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="space-y-1">
        {label}
        {desc}
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={currentValues}
          onValueChange={(v) => onChange(field.id, v)}
          className="flex-wrap"
        >
          {opts.map((o) => (
            <ToggleGroupItem key={o} value={o}>
              {o}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {errorMsg}
      </div>
    );
  }

  return null;
}



export function SurveyDetailPage({
  category,
  templateId,
}: {
  category: "survey" | "application";
  templateId: string;
}) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [localSubmission, setLocalSubmission] = useState<Record<string, unknown> | null>(null);

  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const isStaff = hasPermission("staff.surveys", "read", effectiveRoles);
  const listPath = category === "survey" ? "/members/surveys" : "/members/applications";
  const listLabel = category === "survey" ? "Surveys" : "Applications";

  useEffect(() => {
    fetch(`${API_URL}/surveys/${templateId}`, { headers: getAuthHeaders() })
      .then(async (r) => {
        if (r.status === 403 || r.status === 404) {
          setAccessDenied(true);
          return;
        }
        if (r.ok) {
          const data = (await r.json()) as TemplateDetail;
          setTemplate(data);
        }
      })
      .catch(() => setAccessDenied(true))
      .finally(() => setLoading(false));
  }, [templateId]);

  function handleAnswerChange(id: string, val: unknown) {
    setAnswers((prev) => ({ ...prev, [id]: val }));
    if (errors.has(id)) {
      setErrors((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleSubmit() {
    if (!template) return;

    const missing = new Set<string>();
    for (const field of template.fields) {
      if (!field.required) continue;
      const val = answers[field.id];
      if (
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && (val as unknown[]).length === 0)
      ) {
        missing.add(field.id);
      }
    }
    if (missing.size > 0) {
      setErrors(missing);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`${API_URL}/surveys/${templateId}/responses`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (res.status === 201 || res.status === 200) {
        setLocalSubmission(answers);
      } else if (res.status === 409) {
        setLocalSubmission(answers);
        setSubmitError("You have already submitted a response.");
      } else {
        const data = await res.json().catch(() => null);
        const detail = data?.detail;
        setSubmitError(
          typeof detail === "string" ? detail : "Submission failed. Please try again."
        );
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (accessDenied || !template) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Template not found or you do not have access.
        </p>
      </div>
    );
  }

  const isOpen = template.is_open;
  const submission = localSubmission ?? template.user_submission;
  const alreadySubmitted = submission !== null;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to={listPath} className="hover:underline">
            {listLabel}
          </Link>
          <span>/</span>
          <span className="text-foreground">{template.title}</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-rs-bold text-4xl text-primary">{template.title}</h1>
          {isOpen ? (
            <Badge variant="default" className="text-xs">
              Open
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Closed
            </Badge>
          )}
          {alreadySubmitted && (
            <Badge variant="outline" className="text-xs">
              Submitted
            </Badge>
          )}
        </div>
        {template.description && (
          <p className="text-sm text-muted-foreground">{template.description}</p>
        )}
      </div>

      <Separator />

      {template.fields.length === 0 && (
        <p className="text-sm text-muted-foreground">No questions defined.</p>
      )}

      {/* Already submitted - read-only */}
      {alreadySubmitted && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            Your submission (read-only)
          </p>
          {template.fields.map((field) => (
            <ReadOnlyField
              key={field.id}
              field={field}
              value={(submission as Record<string, unknown>)[field.id]}
            />
          ))}
        </div>
      )}

      {/* Open + not submitted - editable form */}
      {!alreadySubmitted && isOpen && template.fields.length > 0 && (
        <div className="space-y-6">
          {template.fields.map((field) => (
            <EditableField
              key={field.id}
              field={field}
              value={answers[field.id]}
              onChange={handleAnswerChange}
              hasError={errors.has(field.id)}
            />
          ))}

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        </div>
      )}

      {/* Closed + not submitted */}
      {!alreadySubmitted && !isOpen && (
        <Card>
          <CardContent className="pt-4">
            {isStaff && template.fields.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Questions (closed - view only)
                </p>
                {template.fields.map((field) => (
                  <div key={field.id} className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </p>
                    {field.description && (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground capitalize">
                      Type: {field.type.replace(/_/g, " ")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This {category} is closed and no longer accepting responses.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
