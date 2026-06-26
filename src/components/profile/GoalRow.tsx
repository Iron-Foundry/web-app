import { useState } from "react";
import { Pencil, Trash2, Square, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CATEGORY_STYLES, type Goal } from "@/types/goals";

export function GoalRow({ goal, onEdit, onDelete, onProgressUpdate, onToggleCheck, readonly = false }: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onProgressUpdate: (current: number) => void;
  onToggleCheck: (checked: boolean) => void;
  readonly?: boolean;
}): React.JSX.Element {
  const [confirmDelete, setConfirmDelete]     = useState(false);
  const [editingProgress, setEditingProgress] = useState(false);
  const [progressInput, setProgressInput]     = useState(String(goal.current));
  const pct  = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
  const done = pct >= 100;
  const cat  = CATEGORY_STYLES[goal.category];

  function saveProgress(): void {
    onProgressUpdate(Math.max(0, Number(progressInput) || 0));
    setEditingProgress(false);
  }

  if (goal.type === "checkbox") {
    return (
      <div className={cn("flex items-center gap-3 rounded-md border p-3", goal.checked ? "border-green-500/30 bg-green-500/5" : "border-border")}>
        <button onClick={() => !readonly && onToggleCheck(!goal.checked)} disabled={readonly} className="shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:pointer-events-none">
          {goal.checked ? <CheckSquare className="h-4 w-4 text-green-500" /> : <Square className="h-4 w-4" />}
        </button>
        <span className={cn("flex-1 text-sm min-w-0 truncate", goal.checked && "line-through text-muted-foreground")}>{goal.title}</span>
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", cat.className)}>{cat.label}</Badge>
        {!readonly && (
          <button
            onClick={() => { if (confirmDelete) { onDelete(); } else { setConfirmDelete(true); } }}
            title={confirmDelete ? "Click again to confirm" : "Delete"}
            className={cn("p-1 shrink-0 rounded transition-colors", confirmDelete ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border p-4 space-y-2.5", done ? "border-green-500/30" : "border-border")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className={cn("text-sm font-medium truncate", done ? "text-green-600 dark:text-green-400" : "text-foreground")}>{goal.title}</span>
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", cat.className)}>{cat.label}</Badge>
          {done && <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30">Complete</Badge>}
          {goal.wmMetricType && <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 text-muted-foreground">auto</Badge>}
        </div>
        {!readonly && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={() => { if (confirmDelete) { onDelete(); } else { setConfirmDelete(true); } }} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-300", done ? "bg-green-500" : "bg-primary")} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground gap-2">
          {!readonly && !goal.wmMetricType && editingProgress ? (
            <div className="flex items-center gap-1.5">
              <input type="number" min={0} value={progressInput} onChange={(e) => setProgressInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveProgress(); if (e.key === "Escape") setEditingProgress(false); }}
                className="w-28 rounded border border-input bg-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring" autoFocus />
              <button onClick={saveProgress} className="text-primary font-medium hover:underline">Save</button>
              <button onClick={() => setEditingProgress(false)} className="hover:underline">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => { if (!readonly && !goal.wmMetricType) { setProgressInput(String(goal.current)); setEditingProgress(true); } }}
              className={cn("transition-colors", (!readonly && !goal.wmMetricType) ? "hover:text-foreground" : "cursor-default")}
              title={goal.wmMetricType ? "Auto-tracked from WOM" : (!readonly ? "Click to update progress" : undefined)}
            >
              {goal.current.toLocaleString()}{goal.unit ? ` ${goal.unit}` : ""}
            </button>
          )}
          <span className="shrink-0">{pct.toFixed(1)}% of {goal.target.toLocaleString()}{goal.unit ? ` ${goal.unit}` : ""}</span>
        </div>
      </div>
      {confirmDelete && <p className="text-xs text-destructive">Click the trash icon again to confirm.</p>}
    </div>
  );
}
