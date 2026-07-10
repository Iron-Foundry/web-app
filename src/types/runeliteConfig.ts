export type RuneLiteColor = string | number | { value: number };

export interface TileMarkerData {
  regionId: number;
  regionX: number;
  regionY: number;
  z: number;
  color?: RuneLiteColor;
  label?: string;
}

export interface BossHealthEntry {
  percentage: number;
  color?: RuneLiteColor;
  notify?: boolean;
}

export interface BossHealthData {
  bossName: string;
  entries: BossHealthEntry[];
}

export interface RuneLiteItem {
  id: number;
  q?: number;
  f?: boolean;
}

export interface InventorySetup {
  setup: {
    inv?: (RuneLiteItem | null)[];
    eq?: (RuneLiteItem | null)[];
    rp?: (RuneLiteItem | null)[];
    afi?: Record<string, RuneLiteItem>;
    name?: string;
    notes?: string;
    sb?: number;
  };
  layout?: number[];
}

export interface RuneLiteConfig {
  id: string;
  type: string;
  name: string;
  description: string;
  data: unknown[];
  created_at: string | null;
  updated_at: string | null;
}

export interface RuneLiteConfigBody {
  type: string;
  name: string;
  description?: string;
  data: unknown[];
}
