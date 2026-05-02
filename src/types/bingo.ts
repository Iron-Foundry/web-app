export interface BingoSubmission {
  tile_key: string;
  item_label: string | null;
  submitted_at: string;
  _note?: string;
}

export interface BingoPlayer {
  discord_user_id: string;
  is_captain: boolean;
  bingo_submissions: BingoSubmission[];
  wom_metrics: Record<string, number> | null;
}

export interface BingoTeam {
  team_id: number;
  players: Record<string, BingoPlayer>;
}

export interface BingoMappedData {
  generated_at: string;
  teams: Record<string, BingoTeam>;
  unmapped: {
    submissions_discord_id_not_matched: {
      tile_key: string;
      item_label: string | null;
      submitted_at: string;
      submitted_by_raw: number;
      team_id: number;
    }[];
    wom_players_not_in_bingo_roster: { rsn: string; wom_team: string }[];
    bingo_members_not_in_wom: { rsn: string; team: string }[];
  };
}
