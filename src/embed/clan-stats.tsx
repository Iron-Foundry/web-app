import type { ClanStats, WomStats } from "./types";
import { GridTexture, CornerAccents, Divider } from "./shared";

export interface ClanStatsData {
  wom: WomStats;
  stats: ClanStats;
}

function fmt(n: number | null): string {
  if (n === null || n === undefined) return "-";
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
        background: "radial-gradient(ellipse at 25% 35%, #1c1710 0%, #111111 55%, #090909 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 72px",
        fontFamily: "RuneScape",
        color: "#f5f0e8",
        position: "relative",
      }}
    >
      <GridTexture />
      <CornerAccents />

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            alignSelf: "flex-start",
            border: "1px solid rgba(198,164,75,0.4)",
            padding: "4px 12px",
            fontSize: 20,
            color: "#c6a44b",
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          Iron Foundry
        </div>
        <Divider />
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 80,
            background: "rgba(198,164,75,0.04)",
            border: "1px solid rgba(198,164,75,0.08)",
            padding: "20px 28px",
          }}
        >
          <StatBlock label="Members" value={String(wom.member_count ?? "-")} />
          <StatBlock label="Total XP" value={fmt(wom.total_xp)} />
          <StatBlock label="EHB" value={fmt(wom.total_ehb)} />
        </div>
        <div
          style={{
            display: "flex",
            gap: 80,
            background: "rgba(198,164,75,0.04)",
            border: "1px solid rgba(198,164,75,0.08)",
            padding: "20px 28px",
          }}
        >
          <StatBlock label="GP Looted" value={fmt(stats.total_gp)} />
          <StatBlock
            label="Raid KC"
            value={fmt((wom.cox_kc ?? 0) + (wom.tob_kc ?? 0) + (wom.toa_kc ?? 0))}
          />
          <StatBlock label="Collection Logs" value={fmt(stats.collection_log_items)} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 20, color: "#8a7d65" }}>ironfoundry.cc</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: 180,
          }}
        >
          <div style={{ width: "100%", height: 1, background: "rgba(198,164,75,0.08)" }} />
          <div
            style={{
              width: "100%",
              height: 2,
              background: "linear-gradient(to left, #c6a44b, transparent)",
            }}
          />
          <div style={{ width: "100%", height: 1, background: "rgba(198,164,75,0.15)" }} />
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          fontSize: 18,
          color: "#8a7d65",
          textTransform: "uppercase",
          letterSpacing: 2,
          borderBottom: "1px solid rgba(198,164,75,0.2)",
          paddingBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 64, color: "#f5f0e8", lineHeight: 1 }}>{value}</div>
    </div>
  );
}
