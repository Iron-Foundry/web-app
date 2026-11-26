export type EfficiencyKind = "ehp" | "ehb";

export interface EfficiencyRate {
  metric: string;
  kind: EfficiencyKind;
  rate: number;
  payload: Record<string, unknown>;
  updated_at: string;
}
