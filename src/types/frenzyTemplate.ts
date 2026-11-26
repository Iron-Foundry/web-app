export interface FrenzyItem {
  name: string;
  points: number;
  required: number;
  duplicate_required: number;
  icon_url: string | null;
  drop_denom: number | null;
  kph: number | null;
  points_locked: boolean;
  /** OSRSClans source key of the picked loot rate row, e.g. "Vorkath#Post-quest". */
  rate_source?: string | null;
  /** OSRSClans killRateSource of the picked row: wom, droptracker, clue_scroll, item_drop, superior, fixed. */
  kill_rate_source?: string | null;
  /** OSRSClans category of the picked row; "raid" means kph counts raids, not kills. */
  rate_category?: string | null;
}

export interface FrenzySource {
  name: string;
  hovertext: string;
  icon_url: string;
  items: FrenzyItem[];
}

export interface FrenzyTierData {
  sources: FrenzySource[];
  budget_pct: number;
}

export interface FrenzyActivity {
  name: string;
  point_step: number;
  tier1: number;
  tier2: number;
  tier3: number;
  tier4: number;
  multiplier: number;
  unit: string;
  req_factor: number;
}

export interface FrenzyMilestone {
  name: string;
  point_step: number;
  tier1: number;
  tier2: number;
  tier3: number;
  tier4: number;
  multiplier: number;
  unit: string;
  req_factor: number;
}

export interface FrenzyMultiplier {
  name: string;
  description: string;
  affects: string[];
  factor: number;
  requirement: string[];
}

export interface FrenzyTemplate {
  id: number;
  name: string;
  description: string | null;
  tiers: Record<string, FrenzyTierData>;
  activities: FrenzyActivity[];
  milestones: Record<string, FrenzyMilestone[]>;
  multipliers: FrenzyMultiplier[];
  total_point_cap: number;
  version_number: number;
  created_at: string;
  updated_at: string;
}

export interface FrenzyTemplateSummary {
  id: number;
  name: string;
  description: string | null;
  version_number: number;
  created_at: string;
  updated_at: string;
}

export type FrenzyTemplateUpdate = Omit<FrenzyTemplate, "id" | "version_number" | "created_at" | "updated_at">;

export interface FrenzyVersionEditor {
  discord_user_id: number;
  discord_username: string;
  rsn: string | null;
  avatar: string | null;
}

export interface FrenzyVersionSummary {
  id: number;
  version_number: number;
  created_at: string;
  edited_by: FrenzyVersionEditor | null;
}

export interface FrenzyVersionDetail extends FrenzyVersionSummary {
  tiers: Record<string, FrenzyTierData>;
  activities: FrenzyActivity[];
  milestones: Record<string, FrenzyMilestone[]>;
  multipliers: FrenzyMultiplier[];
}
