export interface PbEntry {
  player_name: string;
  activity: string;
  variant: string;
  time_seconds: number;
}

export interface ClogEntry {
  player_name: string;
  slots: number;
  slots_max: number;
}

export interface KcEntry {
  player_name: string;
  kills: number;
}

export interface KcBoss {
  metric: string;
  display_name: string;
  entries: KcEntry[];
}

export interface LeaguesEntry {
  player_name: string;
  score: number;
}

export type LeaderboardTab = "pb" | "clog" | "kc" | "leagues";
