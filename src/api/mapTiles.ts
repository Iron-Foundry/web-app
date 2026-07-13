import { API_URL } from "@/context/AuthContext";
import { apiFetch } from "./client";

export interface TileSyncStatus {
  running: boolean;
  cached: number;
  cached_bytes: number;
  processed?: number;
  total?: number;
  current_zoom?: number;
  rate_per_sec?: number;
  eta_seconds?: number | null;
}

export interface SyncStartResult {
  started: boolean;
  reason?: string;
  force?: boolean;
}

export interface TileCoverageData {
  plane: number;
  z: number;
  cols: number;
  rows: number;
  tiles: [number, number, number][];
}

export const mapTilesApi = {
  getSyncStatus: (): Promise<TileSyncStatus> =>
    apiFetch("/tiles/sync/status"),

  startSync: (force = false): Promise<SyncStartResult> =>
    apiFetch(`/tiles/sync?force=${force}`, { method: "POST" }),

  stopSync: (): Promise<{ stopped: boolean; reason?: string }> =>
    apiFetch("/tiles/sync/stop", { method: "POST" }),

  deleteAllTiles: (): Promise<{ deleted: boolean }> =>
    apiFetch("/tiles/", { method: "DELETE" }),

  deleteRegion: (regionId: number): Promise<{ deleted: number }> =>
    apiFetch(`/tiles/region/${regionId}`, { method: "DELETE" }),

  getCoverage: (plane = 0, z = 8): Promise<TileCoverageData> =>
    apiFetch(`/tiles/coverage?plane=${plane}&z=${z}`),
};

export function tileEventsUrl(): string {
  return `${API_URL}/tiles/events`;
}
