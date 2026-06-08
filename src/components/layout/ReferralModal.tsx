import { useEffect, useRef, useState } from "react";
import { API_URL, getAuthToken, useAuth } from "@/context/AuthContext";
import type { ReferralSource } from "@/types/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DiscordMember {
  discord_user_id: string;
  username: string;
  avatar: string | null;
}

const OPTIONS: { value: ReferralSource; label: string }[] = [
  { value: "reddit", label: "Reddit" },
  { value: "osrs_discord", label: "OSRS Discord" },
  { value: "website", label: "Website" },
  { value: "recruited_by", label: "Recruited by a member" },
  { value: "instagram", label: "Instagram" },
  { value: "other", label: "Other..." },
  { value: "prefer_not_to_say", label: "Don't Remember / Don't Want to Answer" },
];

function avatarUrl(member: DiscordMember): string | null {
  if (!member.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${member.discord_user_id}/${member.avatar}.webp?size=32`;
}

function RecruiterInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<DiscordMember[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(q: string) {
    onChange(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(
          `${API_URL}/discord/members?q=${encodeURIComponent(q)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const data = (await res.json()) as DiscordMember[];
          setSuggestions(data);
          setOpen(data.length > 0);
        }
      } catch {
        // silently ignore
      }
    }, 300);
  }

  function pick(m: DiscordMember) {
    onChange(m.username);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="relative mt-2">
      <Input
        placeholder="Search by username..."
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoFocus
      />
      {open && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          {suggestions.map((m) => (
            <li key={m.discord_user_id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                onMouseDown={() => pick(m)}
              >
                {avatarUrl(m) ? (
                  <img
                    src={avatarUrl(m)!}
                    alt=""
                    className="h-6 w-6 rounded-full shrink-0"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-muted shrink-0" />
                )}
                <span className="truncate">{m.username}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReferralModal() {
  const { user, refresh } = useAuth();
  const [selected, setSelected] = useState<ReferralSource | null>(null);
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldShow = !!user && !!user.rsn && user.referral_source == null;

useEffect(() => {
    if (!shouldShow) {
      setSelected(null);
      setDetail("");
      setError(null);
    }
  }, [shouldShow]);

  if (!shouldShow) return null;

  async function handleSubmit() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/members/me/referral`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ source: selected, detail: detail.trim() || null }),
      });
      if (res.ok) {
        await refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { detail?: string };
        setError(data.detail ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const needsDetail = selected === "recruited_by" || selected === "other";
  const detailPlaceholder =
    selected === "recruited_by"
      ? "Who recruited you?"
      : "Tell us how you found us...";
  const canSubmit =
    !!selected && (!needsDetail || !!detail.trim()) && !saving;

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-sm"
      >
        <DialogHeader>
          <DialogTitle>How did you find us?</DialogTitle>
          <DialogDescription>
            Let us know how you discovered Iron Foundry. This helps us focus
            recruitment efforts on the right platforms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          {OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setSelected(value);
                setDetail("");
                setError(null);
              }}
              className={cn(
                "w-full rounded-md border px-4 py-2.5 text-left text-sm font-medium transition-colors",
                selected === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted text-foreground",
              )}
            >
              {label}
            </button>
          ))}

          {selected === "recruited_by" && (
            <RecruiterInput value={detail} onChange={setDetail} />
          )}

          {selected === "other" && (
            <Input
              placeholder={detailPlaceholder}
              value={detail}
              onChange={(e) => {
                setDetail(e.target.value);
                setError(null);
              }}
              autoFocus
              className="mt-2"
            />
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {saving ? "Saving..." : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
