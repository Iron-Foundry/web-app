import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { isImageAttachment, type Transcript, type TranscriptEntry } from "./ticketTypes";

function fmtStamp(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function EntryRow({ entry }: { entry: TranscriptEntry }): React.ReactElement {
  return (
    <li className={cn("grid grid-cols-avatar-row gap-3 px-5 py-3", entry.author_is_bot && "opacity-60")}>
      <img
        src={entry.author_avatar_url}
        alt={`${entry.author_display_name} avatar`}
        className="h-8 w-8 rounded-full"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
      />
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-2 text-sm">
          <span className="font-semibold text-foreground">{entry.author_display_name}</span>
          {entry.author_is_bot && <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">BOT</span>}
          <span className="text-xs text-muted-foreground">{fmtStamp(entry.timestamp)}</span>
        </p>
        {entry.content && <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-mk-body">{entry.content}</p>}
        {entry.attachments.map((att) =>
          isImageAttachment(att) ? (
            <a key={att.filename} href={att.url} target="_blank" rel="noopener noreferrer">
              <img src={att.url} alt={att.filename} className="mt-2 max-h-48 max-w-full rounded-lg border border-border object-contain" />
            </a>
          ) : (
            <a key={att.filename} href={att.url} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline">
              <Paperclip className="h-3 w-3" />
              {att.filename}
            </a>
          ),
        )}
      </div>
    </li>
  );
}

/** A ticket's messages in order, or the reason there are none. */
export function TranscriptView({ transcript }: { transcript: Transcript | null }): React.ReactElement {
  if (!transcript) return <p className="px-5 py-3 text-sm text-muted-foreground">No transcript available for this ticket.</p>;
  if (transcript.entries.length === 0) return <p className="px-5 py-3 text-sm text-muted-foreground">Transcript is empty.</p>;
  return (
    <ul className="max-h-112 divide-y divide-border overflow-y-auto">
      {transcript.entries.map((entry) => <EntryRow key={entry.message_id} entry={entry} />)}
    </ul>
  );
}
