import { Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fmtTime, isImageAttachment } from "./format";
import type { Transcript } from "./types";

interface TranscriptViewProps {
  transcript: Transcript | null;
  firstResponderMessageId?: number | null;
}

export function TranscriptView({ transcript, firstResponderMessageId }: TranscriptViewProps) {
  if (!transcript) {
    return <p className="px-4 py-3 text-sm text-muted-foreground">No transcript available.</p>;
  }
  if (transcript.entries.length === 0) {
    return <p className="px-4 py-3 text-sm text-muted-foreground">Transcript is empty.</p>;
  }
  return (
    <div className="flex-1 overflow-y-auto divide-y divide-border">
      {transcript.staff_note && (
        <div className="px-4 py-2 bg-yellow-500/10 border-b border-border">
          <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-0.5">Staff note</p>
          <p className="text-sm text-foreground">{transcript.staff_note}</p>
        </div>
      )}
      {transcript.entries.map((entry) => (
        <div
          key={entry.message_id}
          className={cn(
            "flex gap-3 px-4 py-2",
            entry.author_is_bot && "opacity-60",
            entry.message_id === firstResponderMessageId &&
              "bg-primary/5 border-l-2 border-primary",
          )}
        >
          <img
            src={entry.author_avatar_url}
            alt=""
            className="h-7 w-7 shrink-0 rounded-full mt-0.5"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-foreground">{entry.author_display_name}</span>
              {entry.author_is_bot && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">BOT</Badge>
              )}
              {entry.message_id === firstResponderMessageId && (
                <Badge className="text-[10px] px-1 py-0 border-0 bg-primary/15 text-primary">
                  First reply
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{fmtTime(entry.timestamp)}</span>
            </div>
            {entry.content && (
              <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{entry.content}</p>
            )}
            {entry.attachments.map((att) =>
              isImageAttachment(att) ? (
                <a key={att.filename} href={att.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={att.url}
                    alt={att.filename}
                    className="mt-1 max-h-48 max-w-full rounded border border-border object-contain"
                  />
                </a>
              ) : (
                <a
                  key={att.filename}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Paperclip className="h-3 w-3" />
                  {att.filename}
                </a>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
