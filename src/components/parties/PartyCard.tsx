import { memo, useEffect, useState } from "react";
import { Clock, Copy, Crown, LogIn, LogOut, MessageSquare, Pencil, Trash2, Users, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getAccounts, type LinkedAccount } from "@/api/accounts";
import { useDeleteParty, useJoinParty, useKickPartyMember, useLeaveParty } from "@/hooks/useParties";
import { VIBE_LABEL, VIBE_TEXT, displayName, fmtScheduled, relativeTime } from "@/lib/parties";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Party } from "@/types/parties";
import { ChatPanel } from "./ChatPanel";

const PRIMARY = "primary";
const ICON_BUTTON = "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

interface Props {
  party: Party;
  currentUserId: string | null;
  onEdit: (party: Party) => void;
}

function PartyCardImpl({ party, currentUserId, onEdit }: Props): React.ReactElement {
  const [chatOpen, setChatOpen] = useState(false);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [rsn, setRsn] = useState(PRIMARY);
  const { user } = useAuth();
  const joinParty = useJoinParty();
  const leaveParty = useLeaveParty();
  const deleteParty = useDeleteParty();
  const kickMember = useKickPartyMember();

  const isLeader = currentUserId === party.leader.user_id;
  const isMember = party.members.some((m) => m.user_id === currentUserId);
  const isOpen = party.status !== "closed";
  const fillPct = Math.round((party.member_count / party.max_size) * 100);
  const anyPending = joinParty.isPending || leaveParty.isPending || deleteParty.isPending || kickMember.isPending;

  useEffect(() => {
    if (!currentUserId || !user || user.alts_count === 0) return;
    getAccounts().then(setAccounts).catch(() => {});
  }, [currentUserId, user]);

  return (
    <article className={cn("flex flex-col gap-3 rounded-xl border border-border bg-card p-5", !isOpen && "opacity-55")}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-rs-bold text-xl">{party.activity}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
            <span className={cn("font-semibold", VIBE_TEXT[party.vibe])}>{VIBE_LABEL[party.vibe]}</span>
            {party.status !== "open" && <span className="text-xs font-bold uppercase tracking-wide">{party.status === "full" ? "Full" : "Closed"}</span>}
            <span className="inline-flex items-center gap-1"><Crown className="h-3.5 w-3.5 text-primary" />{displayName(party.leader)}</span>
          </p>
        </div>
        {isLeader && isOpen && (
          <div className="flex shrink-0 gap-1">
            <button type="button" className={ICON_BUTTON} aria-label="Edit party" onClick={() => onEdit(party)}><Pencil className="h-4 w-4" /></button>
            <button type="button" className={cn(ICON_BUTTON, "hover:text-destructive")} aria-label="Close party" disabled={anyPending} onClick={() => deleteParty.mutate(party.id)}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      </header>

      {party.description && <p className="leading-relaxed text-mk-body">{party.description}</p>}
      {party.scheduled_at && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />{fmtScheduled(party.scheduled_at)} - {relativeTime(party.scheduled_at)}
        </p>
      )}

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="inline-flex shrink-0 items-center gap-1"><Users className="h-4 w-4" />{party.member_count} / {party.max_size}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full", party.status === "full" ? "bg-muted-foreground" : "bg-mark")} style={{ width: `${fillPct}%` }} />
        </div>
        {!party.scheduled_at && isOpen && <span className="shrink-0 text-xs">expires {relativeTime(party.expires_at)}</span>}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {party.members.map((m) => (
          <li key={m.user_id} className={cn("inline-flex items-center gap-1", m.user_id === currentUserId && "font-semibold text-primary")}>
            {m.user_id === party.leader.user_id && <Crown className="h-3.5 w-3.5 text-primary" />}
            {m.rsn || m.username}
            {isLeader && m.user_id !== currentUserId && isOpen && (
              <button type="button" onClick={() => kickMember.mutate({ partyId: party.id, userId: m.user_id })} className="text-muted-foreground hover:text-destructive" aria-label={`Kick ${m.rsn || m.username}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {party.hub_code && (
        <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Partyhub Code</span>
          <code className="flex-1 truncate font-mono text-sm font-semibold">{party.hub_code}</code>
          <button type="button" onClick={() => navigator.clipboard.writeText(party.hub_code!)} aria-label="Copy code" className={ICON_BUTTON}><Copy className="h-4 w-4" /></button>
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2">
        {currentUserId && isOpen && !isLeader && (isMember ? (
          <Button size="sm" variant="outline" disabled={anyPending} onClick={() => leaveParty.mutate(party.id)}><LogOut />Leave</Button>
        ) : (
          <>
            {accounts.length > 1 && (
              <Select value={rsn} onValueChange={setRsn}>
                <SelectTrigger className="h-8" aria-label="Join as"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={PRIMARY}>Primary RSN</SelectItem>
                  {accounts.filter((a) => !a.is_primary).map((a) => <SelectItem key={a.id} value={a.rsn}>{a.rsn}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button size="sm" disabled={anyPending || party.status === "full"} onClick={() => joinParty.mutate({ id: party.id, rsn_override: rsn === PRIMARY ? null : rsn })}>
              <LogIn />{party.status === "full" ? "Full" : "Join"}
            </Button>
          </>
        ))}
        <Button size="sm" variant="outline" className="ml-auto" aria-expanded={chatOpen} onClick={() => setChatOpen((v) => !v)}><MessageSquare />Party Chat</Button>
      </div>

      {chatOpen && <ChatPanel partyId={party.id} closed={!isOpen} />}
    </article>
  );
}

export const PartyCard = memo(PartyCardImpl);
