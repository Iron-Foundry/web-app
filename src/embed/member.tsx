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

function GridTexture() {
  const vLines = Array.from({ length: 21 }, (_, i) => i * 60);
  const hLines = Array.from({ length: 11 }, (_, i) => i * 63);
  return (
    <svg
      width="1200"
      height="630"
      style={{ position: "absolute", top: 0, left: 0, opacity: 0.05 }}
    >
      {vLines.map((x) => (
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={630} stroke="#d4b86a" strokeWidth={1} />
      ))}
      {hLines.map((y) => (
        <line key={`h${y}`} x1={0} y1={y} x2={1200} y2={y} stroke="#d4b86a" strokeWidth={1} />
      ))}
    </svg>
  );
}

function CornerAccents() {
  const color = "rgba(198,164,75,0.6)";
  return (
    <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: 1200, height: 630 }}>
      <div style={{ position: "absolute", top: 20, left: 20, width: 28, height: 2, background: color }} />
      <div style={{ position: "absolute", top: 20, left: 20, width: 2, height: 28, background: color }} />
      <div style={{ position: "absolute", top: 20, right: 20, width: 28, height: 2, background: color }} />
      <div style={{ position: "absolute", top: 20, right: 20, width: 2, height: 28, background: color }} />
      <div style={{ position: "absolute", bottom: 20, left: 20, width: 28, height: 2, background: color }} />
      <div style={{ position: "absolute", bottom: 20, left: 20, width: 2, height: 28, background: color }} />
      <div style={{ position: "absolute", bottom: 20, right: 20, width: 28, height: 2, background: color }} />
      <div style={{ position: "absolute", bottom: 20, right: 20, width: 2, height: 28, background: color }} />
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ width: "100%", height: 1, background: "rgba(198,164,75,0.15)" }} />
      <div
        style={{
          width: "100%",
          height: 2,
          background: "linear-gradient(to right, #c6a44b, rgba(198,164,75,0.2), transparent)",
        }}
      />
      <div style={{ width: "100%", height: 1, background: "rgba(198,164,75,0.08)" }} />
    </div>
  );
}

const BASE_STYLE = {
  width: 1200,
  height: 630,
  background: "radial-gradient(ellipse at 25% 35%, #1c1710 0%, #111111 55%, #090909 100%)",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between" as const,
  padding: "60px 72px",
  fontFamily: "RuneScape",
  color: "#f5f0e8",
  position: "relative" as const,
};

const BRAND_LABEL = {
  alignSelf: "flex-start" as const,
  border: "1px solid rgba(198,164,75,0.4)",
  padding: "4px 12px",
  fontSize: 20,
  color: "#c6a44b",
  letterSpacing: 6,
  textTransform: "uppercase" as const,
};

export function MemberCard({ player }: MemberCardProps) {
  if (!player) {
    return (
      <div style={{ ...BASE_STYLE, justifyContent: "center", alignItems: "center", gap: 16 }}>
        <GridTexture />
        <CornerAccents />
        <div style={{ ...BRAND_LABEL, alignSelf: "center" }}>Iron Foundry · Member</div>
        <div style={{ fontSize: 28, color: "#6b6452" }}>Player not found</div>
        <div style={{ fontSize: 18, color: "#4a4035" }}>ironfoundry.cc</div>
      </div>
    );
  }

  if (player.stats_opt_out) {
    return (
      <div style={BASE_STYLE}>
        <GridTexture />
        <CornerAccents />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={BRAND_LABEL}>Iron Foundry · Member</div>
          <Divider />
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 12 }}>
          <div style={{ fontSize: 72, color: "#f5f0e8", lineHeight: 1 }}>{player.rsn}</div>
          <div style={{ fontSize: 22, color: "#6b6452" }}>This member has opted out of public stats.</div>
        </div>
        <div style={{ fontSize: 20, color: "#4a4035" }}>ironfoundry.cc</div>
      </div>
    );
  }

  const total = player.boss_points + player.skill_points;
  const bossPct = total > 0 ? Math.round((player.boss_points / total) * 100) : 0;
  const skillPct = 100 - bossPct;
  const joinStr = fmtDate(player.join_date);

  return (
    <div style={BASE_STYLE}>
      <GridTexture />
      <CornerAccents />

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={BRAND_LABEL}>Iron Foundry · Member</div>
        <Divider />
      </div>

      {/* Name + rank */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 72, color: "#f5f0e8", lineHeight: 1 }}>{player.rsn}</div>
        <div
          style={{
            fontSize: 24,
            color: "#c6a44b",
            border: "1px solid rgba(198,164,75,0.5)",
            padding: "4px 14px",
          }}
        >
          {player.rank}
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: 60,
          alignItems: "flex-start",
          background: "rgba(198,164,75,0.04)",
          border: "1px solid rgba(198,164,75,0.08)",
          padding: "20px 28px",
        }}
      >
        <StatCol label="Points" value={player.points.toLocaleString()} />
        <StatCol label="Boss" value={`${player.boss_points.toLocaleString()} (${bossPct}%)`} />
        <StatCol label="Skill" value={`${player.skill_points.toLocaleString()} (${skillPct}%)`} />
        {player.total_loot_value !== null && (
          <StatCol label="GP Looted" value={fmtGp(player.total_loot_value)} />
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 20, color: "#6b6452" }}>
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
      <div
        style={{
          fontSize: 16,
          color: "#8a7d65",
          textTransform: "uppercase",
          letterSpacing: 2,
          borderBottom: "1px solid rgba(198,164,75,0.2)",
          paddingBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 32, color: "#f5f0e8" }}>{value}</div>
    </div>
  );
}
