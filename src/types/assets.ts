export interface Asset {
  id: string;
  filename: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  url: string;
  created_at: string | null;
  uploaded_by: { rsn: string | null; discord_username: string; discord_user_id?: number } | null;
}

export interface UploadResponse {
  id: string;
  url: string;
  filename: string;
}
