import { useRef, useState } from "react";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";

interface RsnCellProps {
  memberId: string;
  rsn: string | null;
  onSaved: (id: string, rsn: string | null) => void;
}

export function RsnCell({ memberId, rsn, onSaved }: RsnCellProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(rsn ?? "");
  const [saving, setSaving] = useState(false);
  const [cascading, setCascading] = useState(false);
  const [cascadeMode, setCascadeMode] = useState(false);
  const [oldRsn, setOldRsn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cascadeMsg, setCascadeMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const oldRsnRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setValue(rsn ?? "");
    setError(null);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  function openCascadeMode() {
    setOldRsn("");
    setError(null);
    setCascadeMode(true);
    setTimeout(() => oldRsnRef.current?.focus(), 0);
  }

  function closeCascadeMode() {
    setCascadeMode(false);
    setError(null);
  }

  async function triggerCascade() {
    setCascading(true);
    setCascadeMsg(null);
    setError(null);
    try {
      const token = getAuthToken();
      const body = oldRsn.trim() ? { old_rsn: oldRsn.trim() } : {};
      const res = await fetch(`${API_URL}/staff/members/${memberId}/rsn/cascade`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { detail?: string };
        setError(data.detail ?? "Cascade failed.");
        return;
      }
      setCascadeMode(false);
      setCascadeMsg("Cascaded");
      setTimeout(() => setCascadeMsg(null), 2500);
    } catch {
      setError("Network error.");
    } finally {
      setCascading(false);
    }
  }

  async function save() {
    const trimmed = value.trim() || null;
    if (trimmed === rsn) { cancel(); return; }
    setSaving(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/staff/members/${memberId}/rsn`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rsn: trimmed }),
      });
      if (res.status === 409) { setError("RSN already linked to another account."); return; }
      if (!res.ok) { setError("Failed to save."); return; }
      const data = (await res.json()) as { rsn: string | null };
      onSaved(memberId, data.rsn);
      setEditing(false);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1 min-w-36">
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
            disabled={saving}
            className="h-7 py-0 px-2 text-xs w-36"
            placeholder="RSN..."
          />
          <button onClick={save} disabled={saving} className="text-xs text-primary hover:underline disabled:opacity-50">Save</button>
          <button onClick={cancel} disabled={saving} className="text-xs text-muted-foreground hover:underline disabled:opacity-50">Cancel</button>
        </div>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  if (cascadeMode) {
    return (
      <div className="flex flex-col gap-1 min-w-44">
        <div className="flex items-center gap-1">
          <Input
            ref={oldRsnRef}
            value={oldRsn}
            onChange={(e) => setOldRsn(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") triggerCascade(); if (e.key === "Escape") closeCascadeMode(); }}
            disabled={cascading}
            className="h-7 py-0 px-2 text-xs w-36"
            placeholder="Old RSN (optional)..."
          />
          <button onClick={triggerCascade} disabled={cascading} className="text-xs text-primary hover:underline disabled:opacity-50">
            {cascading ? "Running..." : "Run"}
          </button>
          <button onClick={closeCascadeMode} disabled={cascading} className="text-xs text-muted-foreground hover:underline disabled:opacity-50">Cancel</button>
        </div>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="group/rsn flex items-center gap-1.5">
        <span className={rsn ? "font-medium text-foreground" : "italic text-muted-foreground"}>
          {rsn ?? "-"}
        </span>
        <button
          onClick={startEdit}
          aria-label="Edit RSN"
          className="opacity-0 group-hover/rsn:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        {rsn && (
          <button
            onClick={openCascadeMode}
            aria-label="Force cascade RSN"
            title="Re-run cascade across all tables"
            className="opacity-0 group-hover/rsn:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"/>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
              <path d="M3 22v-6h6"/>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
          </button>
        )}
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
      {cascadeMsg && <span className="text-xs text-green-600 dark:text-green-400">{cascadeMsg}</span>}
    </div>
  );
}
