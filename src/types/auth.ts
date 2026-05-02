export interface AuthUser {
  discord_user_id: string;
  username: string;
  avatar: string | null;
  rsn: string | null;
  clan_rank: string | null;
  discord_roles: string[];
  effective_roles: string[];
  /** Map of Discord role ID -> human-readable label (from rank-mappings config). */
  role_labels: Record<string, string>;
  stats_opt_out: boolean;
  hide_presence_notifications: boolean;
}
