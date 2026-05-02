export interface EntryAuthor {
  discord_user_id: number | null;
  discord_username: string | null;
  rsn: string | null;
  avatar: string | null;
}

export interface EntryDetail {
  id: string;
  title: string;
  slug: string;
  body: string;
  created_at: string | null;
  updated_at: string | null;
  author: EntryAuthor | null;
  collaborators: EntryAuthor[];
  last_updated_by: EntryAuthor | null;
  reaction_count: number;
  user_has_reacted: boolean;
}

export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  order: number;
  children?: ContentCategory[];
}

export interface ContentEntry {
  id: string;
  title: string;
  slug: string;
  category_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}
