export type TileTag =
  | "precheck"
  | "pvm"
  | "skilling"
  | "minigames"
  | "misc"
  | "endgame"
  | "midgame"
  | "earlygame";

export interface TileItem {
  item_id: number;
  name: string;
  quantity: number;
  icon_url: string;
}

export interface RepositoryTile {
  id: string;
  title: string;
  description: string;
  icon_url: string | null;
  icon_source: "wiki" | "asset" | "external";
  items: TileItem[];
  tags: TileTag[];
  created_at: string;
  updated_at: string;
}

export interface BoardCell {
  cell_x: number;
  cell_y: number;
  path_position: number | null;
  tile_id: string | null;
  tile?: RepositoryTile;
}

export interface TileRaceEventSummary {
  id: string;
  name: string;
  is_active: boolean;
  fog_of_war: boolean;
  grid_cols: number;
  grid_rows: number;
  background_asset_id: string | null;
  background_url?: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface TileRaceEvent extends TileRaceEventSummary {
  cells: BoardCell[];
  teams: TileRaceTeam[];
  signups: TileRaceSignup[];
}

export interface TileRaceTeam {
  id: string;
  name: string;
  slug: string;
  icon_type: "npc" | "item";
  icon_url: string;
  color: string;
  position: number;
  members: TileRaceParticipant[];
}

export interface TileRaceParticipant {
  discord_user_id: string;
  rsn: string;
  ranking_score: number;
  is_captain: boolean;
}

export interface TileRaceSignup {
  discord_user_id: string;
  rsn: string;
  ranking_score: number;
  signed_up_at: string;
}

export interface DiceRollResult {
  team_id: string;
  roll: number;
  new_position: number;
}

export interface TileRaceTeamCreate {
  name: string;
  slug: string;
  icon_type: "npc" | "item";
  icon_url: string;
  color: string;
}

export interface TileRaceEventCreate {
  name: string;
  grid_cols: number;
  grid_rows: number;
  background_asset_id?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
}

export interface TileRaceEventPatch {
  name?: string;
  grid_cols?: number;
  grid_rows?: number;
  background_asset_id?: string | null;
  background_url?: string | null;
  fog_of_war?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  cells?: Array<{ cell_x: number; cell_y: number; path_position: number | null; tile_id: string | null }>;
}
