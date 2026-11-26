import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { assetThumbnailUrl } from "@/lib/assetUrl";
import { cn } from "@/lib/utils";
import { API_URL } from "@/context/AuthContext";
import { INGAME_TO_DISPLAY, ROLE_BADGE_CLASS } from "@/lib/ranks";
import type { FeedbackAttachment } from "./feedbackTypes";

export function AttachmentGrid({ attachments }: { attachments: FeedbackAttachment[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (attachments.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {attachments.map((a) => (
          <button
            key={a.id}
            onClick={() => setLightbox(`${API_URL}${a.url}`)}
            className="relative overflow-hidden rounded-md border bg-muted/40 hover:opacity-80 transition-opacity"
          >
            <img
              src={assetThumbnailUrl(a.url, a.content_type, 128)}
              alt={a.original_name}
              loading="lazy"
              decoding="async"
              className="h-20 w-20 object-cover"
            />
          </button>
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Attachment"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export function RankBadge({ clanRank }: { clanRank: string | null }) {
  if (!clanRank) return null;
  const displayRole = INGAME_TO_DISPLAY[clanRank];
  const roleClass = displayRole ? ROLE_BADGE_CLASS[displayRole] : null;
  if (displayRole && roleClass) {
    return (
      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", roleClass)}>
        {displayRole}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/40 text-muted-foreground">
      Staff
    </Badge>
  );
}
