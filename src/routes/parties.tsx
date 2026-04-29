import { useEffect, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { API_URL, getAuthHeaders, useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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

// ── Types ─────────────────────────────────────────────────────────────────────

type Vibe = "learning" | "chill" | "sweat";

interface PartyMember {
  user_id: string;
  username: string;
  rsn: string | null;
  joined_at: string;
}

interface Party {
  id: string;
  activity: string;
  description: string | null;
  vibe: Vibe;
  leader: { user_id: string; username: string; rsn: string | null };
  max_size: number;
  member_count: number;
  members: PartyMember[];
  ping_role_ids: string[];
  status: "open" | "full" | "closed";
  created_at: string;
  scheduled_at: string | null;
  expires_at: string;
  hub_code: string | null;
}

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  rsn: string | null;
  text: string;
  sent_at: string;
}

interface PingRole {
  discord_role_id: string;
  label: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const VIBE_LABEL: Record<Vibe, string> = { learning: "Learning", chill: "Chill", sweat: "Sweat" };
const VIBE_CLASS: Record<Vibe, string> = {
  learning: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  chill:    "bg-green-500/15 text-green-400 border-green-500/20",
  sweat:    "bg-red-500/15 text-red-400 border-red-500/20",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function displayName(user: { username: string; rsn: string | null }) {
  return user.rsn || user.username;
}

function fmtScheduled(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit",
  });
}

function relativeTime(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60000);
  const hrs = Math.floor(abs / 3600000);
  if (abs < 60000) return diff < 0 ? "just now" : "in a moment";
  if (hrs < 1) return diff < 0 ? `${mins}m ago` : `in ${mins}m`;
  if (hrs < 24) return diff < 0 ? `${hrs}h ago` : `in ${hrs}h`;
  return new Date(iso).toLocaleDateString();
}

// ── Time Picker (select-based for cross-browser compat incl. Firefox) ─────────

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

// ── Create Party Modal ────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreated: (party: Party) => void;
  pingRoles: PingRole[];
}

function CreatePartyModal({ onClose, onCreated, pingRoles }: CreateModalProps) {
  const [activity, setActivity] = useState("");
  const [description, setDescription] = useState("");
  const [vibe, setVibe] = useState<Vibe>("chill");
  const [maxSize, setMaxSize] = useState(5);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [ttlHours, setTtlHours] = useState(4);
  const [selectedPings, setSelectedPings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!activity.trim()) { setError("Activity is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/parties`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          activity: activity.trim(),
          description: description.trim() || null,
          vibe,
          max_size: maxSize,
          scheduled_at: scheduledDate ? new Date(`${scheduledDate}T${scheduledTime || "00:00"}`).toISOString() : null,
          ttl_hours: ttlHours,
          ping_role_ids: selectedPings,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.detail ?? "Failed to create party.");
        return;
      }
      onCreated(await res.json());
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  function togglePing(id: string) {
    setSelectedPings(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <p className="font-semibold text-base">Create a Party</p>
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
                <button
                  key={v}
                  type="button"
                  onClick={() => setVibe(v)}
                  className={cn(
                    "flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors",
                    vibe === v ? VIBE_CLASS[v] : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
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
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expires after (hours)</label>
              <Input type="number" min={0.5} max={24} step={0.5} value={ttlHours} onChange={e => setTtlHours(parseFloat(e.target.value) || 4)} className="h-9" />
            </div>
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
                  <button
                    key={r.discord_role_id}
                    type="button"
                    onClick={() => togglePing(r.discord_role_id)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                      selectedPings.includes(r.discord_role_id)
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {selectedPings.includes(r.discord_role_id) && <Check className="h-2.5 w-2.5 inline mr-1" />}
                    @{r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} className="flex-1" disabled={saving}>
              {saving ? "Creating…" : "Create Party"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Edit Party Modal ──────────────────────────────────────────────────────────

interface EditModalProps {
  party: Party;
  onClose: () => void;
  onUpdated: (party: Party) => void;
}

function splitLocalDatetime(iso: string | null): [string, string] {
  if (!iso) return ["", ""];
  const d = new Date(iso);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return [date, time];
}

function EditPartyModal({ party, onClose, onUpdated }: EditModalProps) {
  const [activity, setActivity] = useState(party.activity);
  const [description, setDescription] = useState(party.description ?? "");
  const [vibe, setVibe] = useState<Vibe>(party.vibe);
  const [maxSize, setMaxSize] = useState(party.max_size);
  const [[scheduledDate, scheduledTime], setScheduledParts] = useState(() => splitLocalDatetime(party.scheduled_at));
  const [selectedPings, setSelectedPings] = useState<string[]>(party.ping_role_ids);
  const [pingRoles, setPingRoles] = useState<PingRole[]>([]);

  function setScheduledDate(v: string) { setScheduledParts([v, scheduledTime]); }
  function setScheduledTime(v: string) { setScheduledParts([scheduledDate, v]); }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/config/party-ping-roles`, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: { roles: PingRole[] }) => setPingRoles(d.roles))
      .catch(() => {});
  }, []);

  function togglePing(id: string) {
    setSelectedPings(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSave() {
    if (!activity.trim()) { setError("Activity is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/parties/${party.id}`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          activity: activity.trim(),
          description: description.trim() || null,
          vibe,
          max_size: maxSize,
          scheduled_at: scheduledDate ? new Date(`${scheduledDate}T${scheduledTime || "00:00"}`).toISOString() : null,
          ping_role_ids: selectedPings,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.detail ?? "Failed to update.");
        return;
      }
      onUpdated(await res.json());
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <p className="font-semibold text-base">Edit Party</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Activity</label>
            <Input value={activity} onChange={e => setActivity(e.target.value)} maxLength={60} className="h-9" autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={300} className="resize-none text-sm min-h-16 field-sizing-content" />
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
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max size</label>
            <Input type="number" min={1} max={100} value={maxSize} onChange={e => setMaxSize(Math.max(1, parseInt(e.target.value, 10) || 1))} className="h-9" />
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
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ping roles</label>
              <div className="flex flex-wrap gap-2">
                {pingRoles.map(r => (
                  <button
                    key={r.discord_role_id}
                    type="button"
                    onClick={() => togglePing(r.discord_role_id)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                      selectedPings.includes(r.discord_role_id)
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {selectedPings.includes(r.discord_role_id) && <Check className="h-2.5 w-2.5 inline mr-1" />}
                    @{r.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" onClick={onClose} className="flex-1" disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} className="flex-1" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Chat Panel ────────────────────────────────────────────────────────────────

function ChatPanel({ partyId, closed }: { partyId: string; closed: boolean }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (closed) return;
    let cancelled = false;
    function poll() {
      fetch(`${API_URL}/parties/${partyId}/chat`, { headers: getAuthHeaders() })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then((data: ChatMessage[]) => { if (!cancelled) setMessages(data); })
        .catch(() => {});
    }
    poll();
    const id = setInterval(poll, 500);
    return () => { cancelled = true; clearInterval(id); };
  }, [partyId, closed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/parties/${partyId}/chat`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (res.ok) {
        const msg: ChatMessage = await res.json();
        setMessages(prev => [...prev, msg]);
        setText("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-t border-border mt-3 pt-3 space-y-2">
      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No messages yet. Be the first!</p>
        )}
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
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Say something…"
            className="h-7 text-xs flex-1"
            maxLength={300}
          />
          <Button size="sm" className="h-7 w-7 p-0 shrink-0" onClick={handleSend} disabled={!text.trim() || sending}>
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
  onJoin: (id: string) => Promise<void>;
  onLeave: (id: string) => Promise<void>;
  onClose: (id: string) => Promise<void>;
  onEdit: (party: Party) => void;
  onKick: (partyId: string, userId: string) => Promise<void>;
}

function PartyCard({ party, currentUserId, onJoin, onLeave, onClose, onEdit, onKick }: PartyCardProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isLeader = currentUserId === party.leader.user_id;
  const isMember = party.members.some(m => m.user_id === currentUserId);
  const fillPct = Math.round((party.member_count / party.max_size) * 100);

  const statusBadge =
    party.status === "full"   ? <Badge className="bg-muted text-muted-foreground border-border">Full</Badge> :
    party.status === "closed" ? <Badge variant="outline" className="text-muted-foreground">Closed</Badge> :
    null;

  async function act(fn: () => Promise<void>) {
    setActionLoading(true);
    try { await fn(); } finally { setActionLoading(false); }
  }

  return (
    <Card className={cn("transition-opacity", party.status === "closed" && "opacity-50")}>
      <CardContent className="pt-4 pb-3 px-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm truncate">{party.activity}</p>
              <Badge variant="outline" className={cn("text-xs shrink-0", VIBE_CLASS[party.vibe])}>
                {VIBE_LABEL[party.vibe]}
              </Badge>
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
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit party" onClick={() => onEdit(party)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" title="Close party" disabled={actionLoading} onClick={() => act(() => onClose(party.id))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {party.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{party.description}</p>
        )}

        {/* Scheduled start time */}
        {party.scheduled_at && (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium">{fmtScheduled(party.scheduled_at)}</span>
            <span className="text-muted-foreground">· {relativeTime(party.scheduled_at)}</span>
          </div>
        )}

        {/* Fill bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{party.member_count} / {party.max_size}</span>
            {!party.scheduled_at && party.status !== "closed" && (
              <span className="text-muted-foreground/60">expires {relativeTime(party.expires_at)}</span>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", party.status === "full" ? "bg-muted-foreground" : "bg-primary")}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        {/* Members list */}
        <div className="flex flex-wrap gap-1">
          {party.members.map(m => (
            <div key={m.user_id} className="flex items-center gap-0.5 bg-muted/60 rounded px-1.5 py-0.5 text-xs">
              {m.user_id === party.leader.user_id && <Crown className="h-2.5 w-2.5 text-primary mr-0.5" />}
              <span>{m.rsn || m.username}</span>
              {isLeader && m.user_id !== currentUserId && party.status !== "closed" && (
                <button onClick={() => act(() => onKick(party.id, m.user_id))} className="ml-0.5 text-muted-foreground hover:text-destructive" title="Kick">
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Partyhub code — members only */}
        {party.hub_code && (
          <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 border border-border px-3 py-1.5">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Partyhub Code</p>
              <p className="font-mono text-xs font-semibold tracking-wide truncate">{party.hub_code}</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(party.hub_code!)}
              title="Copy code"
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 items-center">
          {currentUserId && party.status !== "closed" && !isLeader && (
            isMember ? (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={actionLoading} onClick={() => act(() => onLeave(party.id))}>
                <LogOut className="h-3 w-3" />Leave
              </Button>
            ) : (
              <Button size="sm" className="h-7 text-xs gap-1" disabled={actionLoading || party.status === "full"} onClick={() => act(() => onJoin(party.id))}>
                <LogIn className="h-3 w-3" />{party.status === "full" ? "Full" : "Join"}
              </Button>
            )
          )}
          <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={() => setChatOpen(v => !v)}>
            Party Chat
          </Button>
        </div>

        {chatOpen && <ChatPanel partyId={party.id} closed={party.status === "closed"} />}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PartiesPage() {
  const { user } = useAuth();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [pingRoles, setPingRoles] = useState<PingRole[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  // Fetch party list (poll every 15s)
  useEffect(() => {
    let cancelled = false;
    function poll() {
      fetch(`${API_URL}/parties`, { headers: getAuthHeaders() })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then((data: Party[]) => { if (!cancelled) { setParties(data); setLoading(false); } })
        .catch(() => { if (!cancelled) setLoading(false); });
    }
    poll();
    const id = setInterval(poll, 500);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Fetch ping roles when authed (needed for create form)
  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/config/party-ping-roles`, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: { roles: PingRole[] }) => setPingRoles(data.roles))
      .catch(() => {});
  }, [user]);

  function patchParty(updated: Party) {
    setParties(prev => prev.map(p => p.id === updated.id ? updated : p).filter(p => p.status !== "closed"));
  }

  async function handleJoin(partyId: string) {
    const res = await fetch(`${API_URL}/parties/${partyId}/join`, { method: "POST", headers: getAuthHeaders() });
    if (res.ok) patchParty(await res.json());
  }

  async function handleLeave(partyId: string) {
    const res = await fetch(`${API_URL}/parties/${partyId}/leave`, { method: "DELETE", headers: getAuthHeaders() });
    if (res.ok) patchParty(await res.json());
  }

  async function handleClose(partyId: string) {
    const res = await fetch(`${API_URL}/parties/${partyId}`, { method: "DELETE", headers: getAuthHeaders() });
    if (res.ok) setParties(prev => prev.filter(p => p.id !== partyId));
  }

  async function handleKick(partyId: string, userId: string) {
    const res = await fetch(`${API_URL}/parties/${partyId}/members/${userId}`, { method: "DELETE", headers: getAuthHeaders() });
    if (res.ok) patchParty(await res.json());
  }

  const currentUserId = user ? user.discord_user_id : null;

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6 py-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-rs-bold text-4xl text-primary">Active Parties</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find a group or start your own. Parties reset when the server restarts.
          </p>
        </div>
        {user ? (
          <Button className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />Create Party
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Log in to create or join parties.</p>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-lg bg-muted/40 animate-pulse" />)}
        </div>
      )}

      {!loading && parties.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Users className="h-10 w-10 opacity-40" />
          <p className="text-sm">No active parties. Be the first to start one!</p>
        </div>
      )}

      {!loading && parties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parties.map(party => (
            <PartyCard
              key={party.id}
              party={party}
              currentUserId={currentUserId}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onClose={handleClose}
              onEdit={setEditingParty}
              onKick={handleKick}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePartyModal
          onClose={() => setShowCreate(false)}
          onCreated={party => { setParties(prev => [party, ...prev]); setShowCreate(false); }}
          pingRoles={pingRoles}
        />
      )}

      {editingParty && (
        <EditPartyModal
          party={editingParty}
          onClose={() => setEditingParty(null)}
          onUpdated={updated => { patchParty(updated); setEditingParty(null); }}
        />
      )}
    </div>
  );
}
