export interface Field {
  id: string;
  type: "yes_no" | "short_text" | "long_text" | "select";
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
  max_choices?: number;
}

export interface TemplateDetail {
  template_id: string;
  title: string;
  description: string | null;
  is_open: boolean;
  category: string;
  is_active: boolean;
  fields: Field[];
  user_submission: Record<string, unknown> | null;
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

/** The ids of the required fields that have no answer yet. */
export function missingRequired(fields: Field[], answers: Record<string, unknown>): Set<string> {
  return new Set(fields.filter((f) => f.required && isBlank(answers[f.id])).map((f) => f.id));
}

/** The message for a refused submission, from the status and the API's detail. */
export function submitErrorText(status: number, detail: unknown): string {
  if (status === 409) return "You have already submitted a response.";
  return typeof detail === "string" ? detail : "Submission failed. Please try again.";
}

/** A stored answer as text: "-" when blank, a multi-select joined with commas. */
export function answerText(value: unknown): string {
  if (isBlank(value)) return "-";
  if (Array.isArray(value)) return value.map(String).join(", ");
  return String(value);
}
