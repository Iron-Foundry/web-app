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

/**
 * A cell in the event grid.
 *
 * On the public board a fogged cell arrives as geometry only - the server
 * withholds `tile_id`, `tile` and `modifiers` until a team reaches it.
 */
export interface BoardCell {
  cell_x: number;
  cell_y: number;
  path_position: number | null;
  tile_id?: string | null;
  modifiers?: CellModifier[];
  tile?: RepositoryTile;
}

/**
 * Elevated permissions a team's role holds inside its own managed channels.
 *
 * Every toggle only ever grants: switching one off returns the flag to
 * inherited, it never denies. Applied onto the existing channels by the next
 * sync, so a change never rebuilds a channel or loses its history.
 */
export interface TileRaceDiscordPermissions {
  pin_messages: boolean;
  manage_messages: boolean;
  mention_everyone: boolean;
  manage_threads: boolean;
  manage_channel: boolean;
  voice_moderation: boolean;
}

export type TileRaceDiscordPermission = keyof TileRaceDiscordPermissions;

/** Event settings any visitor may see. `GET /tilerace/active` returns these. */
export interface TileRacePublicSummary {
  id: string;
  name: string;
  is_active: boolean;
  signups_open: boolean;
  fog_of_war: boolean;
  grid_cols: number;
  grid_rows: number;
  dice_count: number;
  dice_sides: number;
  team_size: number;
  is_finished: boolean;
  rolls_paused: boolean;
  winner_team_id: string | null;
  start_pad: BoardPad | null;
  end_pad: BoardPad | null;
  background_asset_id: string | null;
  background_url?: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

/** The staff view: everything public plus the Discord wiring. */
export interface TileRaceEventSummary extends TileRacePublicSummary {
  discord_provisioned: boolean;
  discord_category_id: string | null;
  discord_captains_role_id: string | null;
  discord_captains_channel_id: string | null;
  discord_permissions: TileRaceDiscordPermissions;
}

/** The board and its teams, in whichever detail the caller is entitled to. */
export interface TileRaceBoardEvent extends TileRacePublicSummary {
  cells: BoardCell[];
  teams: TileRacePublicTeam[];
}

export interface TileRacePublicEvent extends TileRaceBoardEvent {
  signup_count: number;
  my_signup: TileRaceMySignup | null;
  my_team_id: string | null;
}

export interface TileRaceEvent extends TileRaceEventSummary, TileRaceBoardEvent {
  teams: TileRaceTeam[];
  signups: TileRaceSignup[];
}

export interface TileRacePublicTeam {
  id: string;
  name: string;
  slug: string;
  icon_type: "npc" | "item";
  icon_url: string;
  color: string;
  position: number;
  furthest_position: number;
  members: TileRacePublicMember[];
}

export interface TileRaceTeam extends TileRacePublicTeam {
  discord_role_id: string | null;
  discord_text_channel_id: string | null;
  discord_voice_channel_id: string | null;
  members: TileRaceParticipant[];
  pending_effects?: {
    skip_next?: boolean;
    extra_rolls?: number;
    traps_sprung?: number[];
  };
}

export interface TileRacePublicMember {
  rsn: string;
  is_captain: boolean;
}

export interface TileRaceParticipant extends TileRacePublicMember {
  discord_user_id: string;
  ranking_score: number;
  raids_kc: number;
}

/** The caller's own signup, the only one the public board carries. */
export interface TileRaceMySignup {
  team_id: string | null;
  account_id: number | null;
  rsn: string;
  wants_captain: boolean;
  is_captain: boolean;
  signed_up_at: string;
}

export interface TileRaceSignup {
  discord_user_id: string;
  team_id: string | null;
  account_id: number | null;
  rsn: string;
  ranking_score: number;
  raids_kc: number;
  wants_captain: boolean;
  is_captain: boolean;
  added_by_staff: boolean;
  signed_up_at: string;
}

export interface TileRaceCandidate {
  discord_user_id: string;
  discord_username: string | null;
  rsn: string | null;
}

export interface GenerateTeamsOptions {
  team_size: number;
  balance_raids_kc: boolean;
  raids_kc_threshold: number;
}

export interface RosterAdd {
  discord_user_id: string;
  rsn?: string | null;
  team_id?: number | null;
}

export interface RosterPatch {
  team_id?: number | null;
  is_captain?: boolean;
  account_id?: number;
  rsn?: string;
}

/** One RSN linked to a member, offered when switching a mistaken signup. */
export interface TileRaceLinkedAccount {
  id: number;
  rsn: string;
  is_primary: boolean;
  in_use: boolean;
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
  trap?: { dice: number[]; total: number; from: number; to: number };
  trap_spent?: number;
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

export type TileClaimStatus = "claimed" | "approved" | "rejected";

export interface TileCompletion {
  team_id: string;
  path_position: number;
  status: TileClaimStatus;
  completed_by: string | null;
  completed_at: string;
}

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface TileRaceSubmission {
  id: string;
  team_id: string;
  path_position: number;
  tile_id: string | null;
  leaf_key: string;
  leaf_label: string;
  discord_user_id: string;
  player_rsn: string;
  proof_urls: string[];
  discord_thread_id: string | null;
  status: SubmissionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  submitted_at: string;
}

export interface TileRaceSubmissionPage {
  total: number;
  limit: number;
  offset: number;
  submissions: TileRaceSubmission[];
}

/**
 * The recap of a finished event.
 *
 * Aggregated server-side: only counts and time series arrive, never a proof
 * URL, a review note or a Discord id. Racers removed from the roster during the
 * event are already dropped from every submission count.
 */
export interface TileRaceRecap {
  event: TileRaceRecapEvent;
  next_event: TileRaceNextEvent | null;
  totals: TileRaceRecapTotals;
  teams: TileRaceRecapTeam[];
}

export interface TileRaceRecapEvent
  extends Omit<TileRacePublicSummary, "background_asset_id"> {
  path_length: number;
}

/** The event that takes over from this one, running or still to start. */
export interface TileRaceNextEvent {
  id: string;
  name: string;
  is_active: boolean;
  starts_at: string | null;
}

export interface TileRaceRecapTotals {
  teams: number;
  racers: number;
  removed_racers: number;
  tiles_cleared: number;
  rolls: number;
  submitted: number;
  approved: number;
  rejected: number;
  unreviewed: number;
}

export interface TileRaceRecapTeam {
  id: string;
  name: string;
  slug: string;
  icon_type: "npc" | "item";
  icon_url: string;
  color: string;
  position: number;
  furthest_position: number;
  tiles_cleared: number;
  rolls: number;
  submitted: number;
  approved: number;
  rejected: number;
  unreviewed: number;
  roster: TileRaceRecapRacer[];
  position_series: TileRaceRecapPoint[];
  submission_series: TileRaceRecapDay[];
}

export interface TileRaceRecapRacer {
  rsn: string;
  is_captain: boolean;
  approved: number;
  rejected: number;
  tiles_proved: number;
}

export interface TileRaceRecapPoint {
  at: string;
  position: number;
}

export interface TileRaceRecapDay {
  day: string;
  approved: number;
  rejected: number;
  unreviewed: number;
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
  team_size?: number;
  start_pad?: BoardPad | null;
  end_pad?: BoardPad | null;
  background_asset_id?: string | null;
  background_url?: string | null;
  fog_of_war?: boolean;
  is_finished?: boolean;
  winner_team_id?: number | null;
  rolls_paused?: boolean;
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
