import { Check, Copy, Download, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadMd, type useContentEntry } from "@/hooks/useContentEntry";
import type { EntryAuthor, EntryDetail } from "@/types/content";

type EntryState = ReturnType<typeof useContentEntry>;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function AuthorChip({ user }: { user: EntryAuthor }): React.ReactElement {
  return (
    <span className="flex items-center gap-1.5">
      {user.avatar && <img src={user.avatar} alt={`${user.rsn ?? user.discord_username ?? "Author"} avatar`} className="h-5 w-5 rounded-full object-cover" />}
      <span className="font-medium text-foreground">{user.rsn ?? user.discord_username ?? "Unknown"}</span>
    </span>
  );
}

function ReactButton({ e, signedIn }: { e: EntryState; signedIn: boolean }): React.ReactElement {
  if (!signedIn) {
    return (
      <span title="Log in to react" className="flex cursor-default items-center gap-1.5 text-sm text-muted-foreground">
        <Heart className="h-4 w-4" /><span className="tabular-nums">{e.reactionCount}</span>
      </span>
    );
  }
  return (
    <button type="button" onClick={e.handleReact} disabled={e.reacting} title={e.reacted ? "Remove reaction" : "Mark as useful"}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50">
      <Heart className={e.reacted ? "h-4 w-4 fill-current text-mk-red" : "h-4 w-4"} />
      <span className="tabular-nums">{e.reactionCount}</span>
    </button>
  );
}

/** The foot of an article: created and updated dates with authors, the useful reaction, and the copy and export actions. */
export function EntryFooter({ entry, e, signedIn }: { entry: EntryDetail; e: EntryState; signedIn: boolean }): React.ReactElement {
  const copyIcon = (kind: "raw" | "discord"): React.ReactElement =>
    e.copied === kind ? <Check className="text-mk-green" /> : <Copy />;
  return (
    <footer className="mt-8 space-y-4 border-t border-border pt-5">
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {entry.created_at && (
          <div className="flex items-center gap-1.5">
            Created <span className="text-foreground">{fmtDate(entry.created_at)}</span>
            {entry.author && <>by <AuthorChip user={entry.author} /></>}
          </div>
        )}
        {entry.updated_at && entry.updated_at !== entry.created_at && (
          <div className="flex items-center gap-1.5">
            Last updated <span className="text-foreground">{fmtDate(entry.updated_at)}</span>
            {entry.last_updated_by && <>by <AuthorChip user={entry.last_updated_by} /></>}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ReactButton e={e} signedIn={signedIn} />
        {entry.body && (
          <>
            <Button size="sm" variant="outline" onClick={() => e.handleCopy("raw")}>{copyIcon("raw")}{e.copied === "raw" ? "Copied!" : "Copy Raw"}</Button>
            <Button size="sm" variant="outline" onClick={() => e.handleCopy("discord")}>{copyIcon("discord")}{e.copied === "discord" ? "Copied!" : "Copy for Discord"}</Button>
            <Button size="sm" variant="outline" onClick={() => downloadMd(entry.title, entry.body)}><Download />Export .md</Button>
          </>
        )}
      </div>
    </footer>
  );
}
