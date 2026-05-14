import type { PlayerPublic } from "./types";

export interface MemberCardProps {
  player: PlayerPublic | null;
}

function fmtGp(n: number | null): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B GP`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M GP`;
  return `${n.toLocaleString()} GP`;
}

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function MemberCard({ player }: MemberCardProps) {
  const base = {
    width: 1200,
    height: 630,
    background: "#111111",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
    padding: "60px 72px",
    fontFamily: "RuneScape",
    color: "#f5f0e8",
  };

  if (!player) {
    return (
      <div style={{ ...base, justifyContent: "center", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 24, color: "#c6a44b", letterSpacing: 4 }}>IRON FOUNDRY</div>
        <div style={{ fontSize: 28, color: "#6b6452" }}>Player not found</div>
        <div style={{ fontSize: 18, color: "#4a4035" }}>ironfoundry.cc</div>
      </div>
    );
  }

  if (player.stats_opt_out) {
    return (
      <div style={{ ...base }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 22, color: "#c6a44b", letterSpacing: 4, textTransform: "uppercase" }}>
            Iron Foundry · Member
          </div>
          <div style={{ width: "100%", height: 2, background: "linear-gradient(to right, #c6a44b, transparent)" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 12 }}>
          <div style={{ fontSize: 56, color: "#f5f0e8" }}>{player.rsn}</div>
          <div style={{ fontSize: 22, color: "#6b6452" }}>This member has opted out of public stats.</div>
        </div>
        <div style={{ fontSize: 18, color: "#4a4035" }}>ironfoundry.cc</div>
      </div>
    );
  }

  const total = player.boss_points + player.skill_points;
  const bossPct = total > 0 ? Math.round((player.boss_points / total) * 100) : 0;
  const skillPct = 100 - bossPct;
  const joinStr = fmtDate(player.join_date);

  return (
    <div style={base}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 22, color: "#c6a44b", letterSpacing: 4, textTransform: "uppercase" }}>
          Iron Foundry · Member
        </div>
        <div style={{ width: "100%", height: 2, background: "linear-gradient(to right, #c6a44b, transparent)" }} />
      </div>

      {/* Name + rank */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 64, color: "#f5f0e8", lineHeight: 1 }}>{player.rsn}</div>
        <div style={{ fontSize: 28, color: "#c6a44b" }}>{player.rank}</div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 60, alignItems: "flex-start" }}>
        <StatCol label="Points" value={player.points.toLocaleString()} />
        <StatCol label="Boss" value={`${player.boss_points.toLocaleString()} (${bossPct}%)`} />
        <StatCol label="Skill" value={`${player.skill_points.toLocaleString()} (${skillPct}%)`} />
        {player.total_loot_value !== null && (
          <StatCol label="GP Looted" value={fmtGp(player.total_loot_value)} />
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 18, color: "#6b6452" }}>
          {joinStr ? `Member since ${joinStr}` : ""}
        </div>
        <div style={{ fontSize: 18, color: "#4a4035" }}>ironfoundry.cc</div>
      </div>
    </div>
  );
}

function StatCol({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 16, color: "#8a7d65", textTransform: "uppercase", letterSpacing: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, color: "#f5f0e8" }}>{value}</div>
    </div>
  );
}
