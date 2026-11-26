export interface FeedbackAttachment {
  id: string;
  url: string;
  original_name: string;
  content_type: string;
}

export interface FeedbackReply {
  id: number;
  feedback_id: number;
  body: string;
  is_pinned: boolean;
  author_name: string | null;
  author_discord_id: number | null;
  author_clan_rank: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackItem {
  id: number;
  type: "suggestion" | "bug";
  title: string;
  description: string;
  extra: { steps_to_reproduce?: string };
  status: string;
  is_anonymous: boolean;
  author_name: string | null;
  author_discord_id: number | null;
  is_own: boolean;
  heart_count: number;
  is_hearted: boolean;
  reply_count: number;
  last_reply_at: string | null;
  pinned_reply: FeedbackReply | null;
  attachments: FeedbackAttachment[];
  created_at: string;
  updated_at: string;
}

export interface FeedbackDetailItem extends FeedbackItem {
  replies: FeedbackReply[];
}
