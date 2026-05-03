import { useEffect, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { useAuth } from "@/context/AuthContext";
import { getAccounts, type LinkedAccount } from "@/api/accounts";
import {
  useParties, usePartyChat, usePartyPingRoles,
  useCreateParty, useUpdateParty, useDeleteParty,
  useJoinParty, useLeaveParty, useKickPartyMember, useSendPartyMessage,
} from "@/hooks/useParties";
import {
  VIBE_LABEL, VIBE_CLASS, displayName, fmtScheduled, relativeTime, splitLocalDatetime,
} from "@/lib/parties";
import { PartySkeleton } from "@/components/skeletons/PartySkeleton";
import type { Vibe, Party, PingRole } from "@/types/parties";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Users, Plus, X, Send,
  Crown, LogIn, LogOut, Trash2, Pencil, Check, Clock, Copy,
} from "lucide-react";

export const partiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/parties",
  component: () => <PartiesPage />,
});

// ── Time Picker ───────────────────────────────────────────────────────────────

const _HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const _MINS  = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

function TimePicker({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [h, m] = value ? value.split(":") : ["", ""];
  const sel = "h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";
  return (
    <div className="flex items-center gap-1">
      <select value={h ?? ""} onChange={e => onChange(e.target.value ? `${e.target.value}:${m || "00"}` : "")} disabled={disabled} className={sel}>
        <option value="">HH</option>
        {_HOURS.map(hh => <option key={hh} value={hh}>{hh}</option>)}
      </select>
      <span className="text-muted-foreground text-sm shrink-0">:</span>
      <select value={m ?? ""} onChange={e => onChange(h ? `${h}:${e.target.value}` : "")} disabled={disabled || !h} className={sel}>
        <option value="">MM</option>
        {_MINS.map(mm => <option key={mm} value={mm}>{mm}</option>)}
      </select>
    </div>
  );
}

// ── Party Form (shared by Create + Edit modals) ───────────────────────────────

interface PartyFormProps {
  title: string;
  initial?: Partial<{
    activity: string;
    description: string;
    vibe: Vibe;
    maxSize: number;
    scheduledDate: string;
    scheduledTime: string;
    selectedPings: string[];
  }>;
  pingRoles: PingRole[];
  onClose: () => void;
  onSubmit: (data: {
    activity: string;
    description: string | null;
    vibe: Vibe;
    max_size: number;
    scheduled_at: string | null;
    ping_role_ids: string[];
    ttl_hours?: number;
  }) => void;
  saving: boolean;
  error?: string | null;
  showTtl?: boolean;
}

function PartyForm({ title, initial = {}, pingRoles, onClose, onSubmit, saving, error, showTtl }: PartyFormProps) {
  const [activity, setActivity] = useState(initial.activity ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [vibe, setVibe] = useState<Vibe>(initial.vibe ?? "chill");
  const [maxSize, setMaxSize] = useState(initial.maxSize ?? 5);
  const [scheduledDate, setScheduledDate] = useState(initial.scheduledDate ?? "");
  const [scheduledTime, setScheduledTime] = useState(initial.scheduledTime ?? "");
  const [ttlHours, setTtlHours] = useState(4);
  const [selectedPings, setSelectedPings] = useState<string[]>(initial.selectedPings ?? []);
  const [localError, setLocalError] = useState<string | null>(null);

  function togglePing(id: string) {
    setSelectedPings(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function handleSubmit() {
    if (!activity.trim()) { setLocalError("Activity is required."); return; }
    setLocalError(null);
    onSubmit({
      activity: activity.trim(),
      description: description.trim() || null,
      vibe,
      max_size: maxSize,
      scheduled_at: scheduledDate ? new Date(`${scheduledDate}T${scheduledTime || "00:00"}`).toISOString() : null,
      ping_role_ids: selectedPings,
      ttl_hours: ttlHours,
    });
  }

  const displayError = localError ?? error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <p className="font-semibold text-base">{title}</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Activity *</label>
            <Input value={activity} onChange={e => setActivity(e.target.value)} placeholder="e.g. Theatre of Blood" maxLength={60} className="h-9" autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Any requirements, notes…" maxLength={300} className="resize-none text-sm min-h-16 field-sizing-content" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vibe</label>
            <div className="flex gap-2">
              {(["learning", "chill", "sweat"] as Vibe[]).map(v => (
                <button key={v} type="button" onClick={() => setVibe(v)} className={cn("flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors", vibe === v ? VIBE_CLASS[v] : "border-border text-muted-foreground hover:text-foreground")}>
                  {VIBE_LABEL[v]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max size</label>
              <Input type="number" min={1} max={100} value={maxSize} onChange={e => setMaxSize(Math.max(1, parseInt(e.target.value, 10) || 1))} className="h-9" />
            </div>
            {showTtl && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expires after (hours)</label>
                <Input type="number" min={0.5} max={24} step={0.5} value={ttlHours} onChange={e => setTtlHours(parseFloat(e.target.value) || 4)} className="h-9" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scheduled date</label>
              <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time</label>
              <TimePicker value={scheduledTime} onChange={setScheduledTime} disabled={!scheduledDate} />
            </div>
          </div>
          {pingRoles.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ping roles (optional)</label>
              <div className="flex flex-wrap gap-2">
                {pingRoles.map(r => (
                  <button key={r.discord_role_id} type="button" onClick={() => togglePing(r.discord_role_id)} className={cn("px-2.5 py-1 rounded-full text-xs font-medium border transition-colors", selectedPings.includes(r.discord_role_id) ? "bg-primary/15 text-primary border-primary/30" : "border-border text-muted-foreground hover:text-foreground")}>
                    {selectedPings.includes(r.discord_role_id) && <Check className="h-2.5 w-2.5 inline mr-1" />}
                    @{r.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {displayError && <p className="text-xs text-destructive">{displayError}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Chat Panel ────────────────────────────────────────────────────────────────

function ChatPanel({ partyId, closed }: { partyId: string; closed: boolean }) {
  const { user } = useAuth();
  const { data: messages = [] } = usePartyChat(partyId, !closed);
  const sendMessage = useSendPartyMessage(partyId);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!text.trim() || !user || sendMessage.isPending) return;
    sendMessage.mutate(text.trim(), { onSuccess: () => setText("") });
  }

  return (
    <div className="border-t border-border mt-3 pt-3 space-y-2">
      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
        {messages.length === 0 && <p className="text-xs text-muted-foreground italic">No messages yet. Be the first!</p>}
        {messages.map(m => (
          <div key={m.id} className="text-xs">
            <span className="font-medium text-foreground">{m.rsn || m.username}</span>
            <span className="text-muted-foreground ml-1">{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {user && !closed && (
        <div className="flex gap-1.5">
          <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()} placeholder="Say something…" className="h-7 text-xs flex-1" maxLength={300} />
          <Button size="sm" className="h-7 w-7 p-0 shrink-0" onClick={handleSend} disabled={!text.trim() || sendMessage.isPending}>
            <Send className="h-3 w-3" />
          </Button>
        </div>
      )}
      {!user && <p className="text-xs text-muted-foreground">Log in to chat.</p>}
    </div>
  );
}

// ── Party Card ────────────────────────────────────────────────────────────────

interface PartyCardProps {
  party: Party;
  currentUserId: string | null;
  onEdit: (party: Party) => void;
}

function PartyCard({ party, currentUserId, onEdit }: PartyCardProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [selectedRsn, setSelectedRsn] = useState<string>("");
  const { user } = useAuth();
  const joinParty = useJoinParty();
  const leaveParty = useLeaveParty();
  const deleteParty = useDeleteParty();
  const kickMember = useKickPartyMember();

  const isLeader = currentUserId === party.leader.user_id;
  const isMember = party.members.some(m => m.user_id === currentUserId);
  const fillPct = Math.round((party.member_count / party.max_size) * 100);
  const anyPending = joinParty.isPending || leaveParty.isPending || deleteParty.isPending || kickMember.isPending;

  useEffect(() => {
    if (!currentUserId || !user || user.alts_count === 0) return;
    getAccounts().then(setAccounts).catch(() => {});
  }, [currentUserId, user]);

  const statusBadge =
    party.status === "full"   ? <Badge className="bg-muted text-muted-foreground border-border">Full</Badge> :
    party.status === "closed" ? <Badge variant="outline" className="text-muted-foreground">Closed</Badge> :
    null;

  return (
    <Card className={cn("transition-opacity", party.status === "closed" && "opacity-50")}>
      <CardContent className="pt-4 pb-3 px-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm truncate">{party.activity}</p>
              <Badge variant="outline" className={cn("text-xs shrink-0", VIBE_CLASS[party.vibe])}>{VIBE_LABEL[party.vibe]}</Badge>
              {statusBadge}
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <Crown className="h-3 w-3 shrink-0" />
              <span className="truncate">{displayName(party.leader)}</span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {isLeader && party.status !== "closed" && (
              <>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit party" onClick={() => onEdit(party)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" title="Close party" disabled={anyPending} onClick={() => deleteParty.mutate(party.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </>
            )}
          </div>
        </div>

        {party.description && <p className="text-xs text-muted-foreground leading-relaxed">{party.description}</p>}

        {party.scheduled_at && (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium">{fmtScheduled(party.scheduled_at)}</span>
            <span className="text-muted-foreground">- {relativeTime(party.scheduled_at)}</span>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{party.member_count} / {party.max_size}</span>
            {!party.scheduled_at && party.status !== "closed" && <span className="text-muted-foreground/60">expires {relativeTime(party.expires_at)}</span>}
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", party.status === "full" ? "bg-muted-foreground" : "bg-primary")} style={{ width: `${fillPct}%` }} />
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {party.members.map(m => (
            <div key={m.user_id} className="flex items-center gap-0.5 bg-muted/60 rounded px-1.5 py-0.5 text-xs">
              {m.user_id === party.leader.user_id && <Crown className="h-2.5 w-2.5 text-primary mr-0.5" />}
              <span>{m.rsn || m.username}</span>
              {isLeader && m.user_id !== currentUserId && party.status !== "closed" && (
                <button onClick={() => kickMember.mutate({ partyId: party.id, userId: m.user_id })} className="ml-0.5 text-muted-foreground hover:text-destructive" title="Kick">
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {party.hub_code && (
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 border border-border px-3 py-1.5">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Partyhub Code</p>
              <p className="font-mono text-xs font-semibold tracking-wide truncate">{party.hub_code}</p>
            </div>
            <button onClick={() => navigator.clipboard.writeText(party.hub_code!)} title="Copy code" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex gap-2 items-center">
          {currentUserId && party.status !== "closed" && !isLeader && (
            isMember ? (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={anyPending} onClick={() => leaveParty.mutate(party.id)}>
                <LogOut className="h-3 w-3" />Leave
              </Button>
            ) : (
              <>
                {accounts.length > 1 && (
                  <select
                    value={selectedRsn}
                    onChange={(e) => setSelectedRsn(e.target.value)}
                    className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Primary RSN</option>
                    {accounts.filter(a => !a.is_primary).map(a => (
                      <option key={a.id} value={a.rsn}>{a.rsn}</option>
                    ))}
                  </select>
                )}
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={anyPending || party.status === "full"}
                  onClick={() => joinParty.mutate({ id: party.id, rsn_override: selectedRsn || null })}
                >
                  <LogIn className="h-3 w-3" />{party.status === "full" ? "Full" : "Join"}
                </Button>
              </>
            )
          )}
          <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={() => setChatOpen(v => !v)}>Party Chat</Button>
        </div>

        {chatOpen && <ChatPanel partyId={party.id} closed={party.status === "closed"} />}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PartiesPage() {
  const { user } = useAuth();
  const { data: parties = [], isLoading } = useParties();
  const { data: pingRoles = [] } = usePartyPingRoles(!!user);
  const createParty = useCreateParty();
  const updateParty = useUpdateParty();

  const [showCreate, setShowCreate] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  const currentUserId = user?.discord_user_id ?? null;

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6 py-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-rs-bold text-4xl text-primary">Active Parties</h1>
          <p className="text-sm text-muted-foreground mt-1">Find a group or start your own. Parties reset when the server restarts.</p>
        </div>
        {user ? (
          <Button className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />Create Party
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Log in to create or join parties.</p>
        )}
      </div>

      {isLoading && <PartySkeleton />}

      {!isLoading && parties.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Users className="h-10 w-10 opacity-40" />
          <p className="text-sm">No active parties. Be the first to start one!</p>
        </div>
      )}

      {!isLoading && parties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parties.map(party => (
            <PartyCard key={party.id} party={party} currentUserId={currentUserId} onEdit={setEditingParty} />
          ))}
        </div>
      )}

      {showCreate && (
        <PartyForm
          title="Create a Party"
          pingRoles={pingRoles}
          onClose={() => setShowCreate(false)}
          showTtl
          saving={createParty.isPending}
          error={createParty.error?.message}
          onSubmit={(data) => {
            createParty.mutate(
              { ...data, ttl_hours: data.ttl_hours ?? 4 },
              { onSuccess: () => setShowCreate(false) },
            );
          }}
        />
      )}

      {editingParty && (
        <PartyForm
          title="Edit Party"
          pingRoles={pingRoles}
          initial={{
            activity: editingParty.activity,
            description: editingParty.description ?? "",
            vibe: editingParty.vibe,
            maxSize: editingParty.max_size,
            ...(() => { const [d, t] = splitLocalDatetime(editingParty.scheduled_at); return { scheduledDate: d, scheduledTime: t }; })(),
            selectedPings: editingParty.ping_role_ids,
          }}
          onClose={() => setEditingParty(null)}
          saving={updateParty.isPending}
          error={updateParty.error?.message}
          onSubmit={(data) => {
            updateParty.mutate(
              { id: editingParty.id, data },
              { onSuccess: () => setEditingParty(null) },
            );
          }}
        />
      )}
    </div>
  );
}
