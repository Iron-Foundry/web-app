export type Vibe = "learning" | "chill" | "sweat";
export type PartyStatus = "open" | "full" | "closed";

export interface PartyMember {
  user_id: string;
  username: string;
  rsn: string | null;
  joined_at: string;
}

export interface Party {
  id: string;
  activity: string;
  description: string | null;
  vibe: Vibe;
  leader: { user_id: string; username: string; rsn: string | null };
  max_size: number;
  member_count: number;
  members: PartyMember[];
  ping_role_ids: string[];
  status: PartyStatus;
  created_at: string;
  scheduled_at: string | null;
  expires_at: string;
  hub_code: string | null;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  rsn: string | null;
  text: string;
  sent_at: string;
}

export interface PingRole {
  discord_role_id: string;
  label: string;
}
