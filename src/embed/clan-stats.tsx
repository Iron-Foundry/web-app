import type { ClanStats, WomStats } from "./types";

export interface ClanStatsData {
  wom: WomStats;
  stats: ClanStats;
}

function fmt(n: number | null): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function ClanStatsCard({ wom, stats }: ClanStatsData) {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#111111",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 72px",
        fontFamily: "RuneScape",
        color: "#f5f0e8",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 22, color: "#c6a44b", letterSpacing: 4, textTransform: "uppercase" }}>
          Iron Foundry
        </div>
        <div
          style={{
            width: "100%",
            height: 2,
            background: "linear-gradient(to right, #c6a44b, transparent)",
          }}
        />
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 36,
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", gap: 80 }}>
          <StatBlock label="Members" value={String(wom.member_count ?? "—")} />
          <StatBlock label="Total XP" value={fmt(wom.total_xp)} />
          <StatBlock label="EHB" value={fmt(wom.total_ehb)} />
        </div>
        <div style={{ display: "flex", gap: 80 }}>
          <StatBlock label="GP Looted" value={fmt(stats.total_gp)} />
          <StatBlock label="Raid KC" value={fmt((wom.cox_kc ?? 0) + (wom.tob_kc ?? 0) + (wom.toa_kc ?? 0))} />
          <StatBlock label="Collection Logs" value={fmt(stats.total_clogs)} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 20, color: "#6b6452" }}>ironfoundry.cc</div>
        <div
          style={{
            width: 180,
            height: 2,
            background: "linear-gradient(to left, #c6a44b, transparent)",
          }}
        />
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 18, color: "#8a7d65", textTransform: "uppercase", letterSpacing: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 52, color: "#f5f0e8", lineHeight: 1 }}>{value}</div>
    </div>
  );
}
