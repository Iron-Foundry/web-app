export interface Goal {
  id: string;
  title: string;
  category: "osrs" | "clan" | "custom";
  type?: "progress" | "checkbox";
  checked?: boolean;
  current: number;
  target: number;
  unit: string;
  year: number;
  wmMetricType?: "skill_xp" | "boss_kc" | "activity";
  wmMetric?: string;
}

export interface GoalFormData {
  title: string;
  category: Goal["category"];
  current: number;
  target: number;
  unit: string;
  wmMetricType?: "skill_xp" | "boss_kc" | "activity";
  wmMetric?: string;
}

export const CATEGORY_STYLES: Record<Goal["category"], { label: string; className: string }> = {
  osrs:   { label: "OSRS",   className: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30"              },
  clan:   { label: "Clan",   className: "bg-primary/15 text-primary border-primary/30"                                },
  custom: { label: "Custom", className: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"  },
};
