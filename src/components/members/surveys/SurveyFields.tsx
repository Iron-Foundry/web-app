import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { answerText, type Field } from "./surveyTypes";

const ERROR_EDGE = "border-destructive focus-visible:ring-destructive";

function FieldFrame({ field, hasError = false, children }: { field: Field; hasError?: boolean; children: ReactNode }): React.ReactElement {
  return (
    <div className="grid gap-1.5">
      <p className="font-semibold">
        {field.label}
        {field.required && <span className="ml-1 text-destructive">*</span>}
      </p>
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
      {children}
      {hasError && <p className="text-sm text-destructive">This field is required.</p>}
    </div>
  );
}

export function ReadOnlyField({ field, value }: { field: Field; value: unknown }): React.ReactElement {
  return (
    <FieldFrame field={field}>
      <p className="min-h-9 rounded-lg border border-border bg-muted px-3 py-2 text-mk-body">{answerText(value)}</p>
    </FieldFrame>
  );
}

interface EditableProps {
  field: Field;
  value: unknown;
  onChange: (id: string, val: unknown) => void;
  hasError: boolean;
}

function FieldControl({ field, value, onChange, hasError }: EditableProps): React.ReactElement | null {
  const text = typeof value === "string" ? value : "";
  const set = (v: unknown): void => onChange(field.id, v);
  const opts = field.options ?? [];

  switch (field.type) {
    case "yes_no":
      return (
        <ToggleGroup type="single" variant="outline" value={text} onValueChange={set}>
          <ToggleGroupItem value="yes">Yes</ToggleGroupItem>
          <ToggleGroupItem value="no">No</ToggleGroupItem>
        </ToggleGroup>
      );
    case "short_text":
      return <Input value={text} onChange={(e) => set(e.target.value)} className={cn(hasError && ERROR_EDGE)} />;
    case "long_text":
      return <Textarea value={text} onChange={(e) => set(e.target.value)} className={cn(hasError && ERROR_EDGE)} rows={4} />;
    case "select":
      if ((field.max_choices ?? 1) === 1) {
        return (
          <Select value={text} onValueChange={set}>
            <SelectTrigger className={cn(hasError && ERROR_EDGE)}><SelectValue placeholder="Select an option…" /></SelectTrigger>
            <SelectContent>
              {opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      }
      return (
        <ToggleGroup type="multiple" variant="outline" value={Array.isArray(value) ? (value as string[]) : []} onValueChange={set} className="flex-wrap">
          {opts.map((o) => <ToggleGroupItem key={o} value={o}>{o}</ToggleGroupItem>)}
        </ToggleGroup>
      );
    default:
      return null;
  }
}

export function EditableField(props: EditableProps): React.ReactElement {
  return (
    <FieldFrame field={props.field} hasError={props.hasError}>
      <FieldControl {...props} />
    </FieldFrame>
  );
}

/** The closed template: the question list for staff, the closed line for everyone else. */
export function ClosedTemplate({ fields, isStaff, category }: { fields: Field[]; isStaff: boolean; category: string }): React.ReactElement {
  if (!isStaff || fields.length === 0) {
    return <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">This {category} is closed and no longer accepting responses.</p>;
  }
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Questions (closed - view only)</p>
      {fields.map((field) => (
        <FieldFrame key={field.id} field={field}>
          <p className="text-xs capitalize text-muted-foreground">Type: {field.type.replace(/_/g, " ")}</p>
        </FieldFrame>
      ))}
    </div>
  );
}
