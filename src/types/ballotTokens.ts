export interface BallotTokenTransaction {
  id: number;
  delta: number;
  reason: string;
  run_id: number | null;
  created_at: string;
}

export interface BallotTokenBalance {
  balance: number;
  transactions: BallotTokenTransaction[];
}

export interface BallotTokenConfig {
  placement_tokens: number[];
  bonus_threshold_pct: number;
  bonus_tokens: number;
  vote_cost: number;
  max_hold: number;
}
