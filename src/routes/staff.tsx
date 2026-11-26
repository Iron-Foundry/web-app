import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { API_URL, getAuthToken } from "@/context/AuthContext";
import { PageHead } from "@/components/layout/PageHead";
import { STAFF, type StaffMember } from "@/lib/staffRoster";

export const staffRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/staff",
  component: StaffPage,
});

function useAvatar(discordId: string | undefined): string | null {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!discordId) return;
    const token = getAuthToken();
    let cancelled = false;
    fetch(`${API_URL}/members/${discordId}/avatar`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? (r.json() as Promise<{ avatar_url: string }>) : Promise.reject(new Error(`${r.status}`))))
      .then((data) => { if (!cancelled) setSrc(data.avatar_url); }, () => {})
    return () => { cancelled = true; };
  }, [discordId]);
  return src;
}

function MemberCard({ name, position, discordId }: StaffMember): React.ReactElement {
  const avatar = useAvatar(discordId);
  const extra = position?.slice(1) ?? [];
  return (
    <div
      tabIndex={extra.length > 0 ? 0 : undefined}
      className="group relative flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
        {avatar && <img src={avatar} alt={`${name} avatar`} className="h-full w-full object-cover" />}
      </span>
      <span className="grid min-w-0 leading-snug">
        <span className="truncate font-semibold">{name}</span>
        {position && position.length > 0 && <span className="truncate text-sm text-muted-foreground">{position[0]}</span>}
      </span>
      {extra.length > 0 && (
        <span className="absolute inset-x-0 top-full z-10 mt-1 hidden rounded-lg border border-border bg-muted px-3.5 py-2 text-sm leading-relaxed text-mk-body shadow-xl group-hover:block group-focus:block">
          {extra.map((p) => <span key={p} className="block">{p}</span>)}
        </span>
      )}
    </div>
  );
}

function StaffPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 py-6">
      <PageHead title="Our Team" lede="The team keeping Iron Foundry running." />
      {STAFF.map((section, i) => (
        <section key={section.title} className={i > 0 ? "space-y-4 border-t border-border pt-8" : "space-y-4"}>
          <h2 className="flex items-center gap-3.5 font-rs-bold text-2xl text-foreground">
            <img src={section.icon} alt={`${section.title} emblem`} className="h-13 w-13 object-contain" />
            {section.title}
          </h2>
          {section.members.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {section.members.map((m) => <MemberCard key={m.name} {...m} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No members listed.</p>
          )}
        </section>
      ))}
    </div>
  );
}
