import type { CellModifier, RequirementNode } from "./tilerace-requirements";

export type {
  AndRequirement,
  BonusEffect,
  CellModifier,
  RequirementNode,
  SabotageAction,
  TextRequirement,
} from "./tilerace-requirements";

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
  requirement: RequirementNode | null;
  tags: TileTag[];
  created_at: string;
  updated_at: string;
}

export interface BoardPad {
  cell_x: number;
  cell_y: number;
  width: number;
  height: number;
  trigger?: CellModifier | null;
  ends_game?: boolean;
}

export interface BoardCell {
  cell_x: number;
  cell_y: number;
  path_position: number | null;
  tile_id: string | null;
  modifiers?: CellModifier[];
  tile?: RepositoryTile;
}

export interface TileRaceEventSummary {
  id: string;
  name: string;
  is_active: boolean;
  signups_open: boolean;
  fog_of_war: boolean;
  grid_cols: number;
  grid_rows: number;
  dice_count: number;
  dice_sides: number;
  is_finished: boolean;
  winner_team_id: string | null;
  start_pad: BoardPad | null;
  end_pad: BoardPad | null;
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
  pending_effects?: { skip_next?: boolean; extra_rolls?: number };
}

export interface TileRaceParticipant {
  discord_user_id: string;
  rsn: string;
  ranking_score: number;
  is_captain: boolean;
}

export interface TileRaceSignup {
  discord_user_id: string;
  account_id: number | null;
  rsn: string;
  ranking_score: number;
  wants_captain: boolean;
  signed_up_at: string;
}

export interface DiceRollResult {
  roll?: number;
  dice?: number[];
  new_position: number;
  skipped?: boolean;
  moved_to?: number;
  allow_extra_roll?: boolean;
  reroll?: boolean;
  skip_next?: boolean;
  game_over?: boolean;
}

export interface TileRaceRoll {
  id: string;
  team_id: string;
  dice: number[];
  roll: number;
  skipped: boolean;
  new_position: number;
  rolled_by: string;
  rolled_at: string;
}

export interface TileCompletion {
  team_id: string;
  path_position: number;
  completed_by: string | null;
  completed_at: string;
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
  dice_count?: number;
  dice_sides?: number;
  start_pad?: BoardPad | null;
  end_pad?: BoardPad | null;
  background_asset_id?: string | null;
  background_url?: string | null;
  fog_of_war?: boolean;
  is_finished?: boolean;
  signups_open?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  cells?: Array<{
    cell_x: number;
    cell_y: number;
    path_position: number | null;
    tile_id: string | null;
    modifiers?: CellModifier[];
  }>;
}
