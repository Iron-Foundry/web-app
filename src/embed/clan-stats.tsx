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

function GridTexture() {
  const vLines = Array.from({ length: 21 }, (_, i) => i * 60);
  const hLines = Array.from({ length: 11 }, (_, i) => i * 63);
  return (
    <svg
      width="1200"
      height="630"
      style={{ position: "absolute", top: 0, left: 0, opacity: 0.025 }}
    >
      {vLines.map((x) => (
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={630} stroke="#c6a44b" strokeWidth={1} />
      ))}
      {hLines.map((y) => (
        <line key={`h${y}`} x1={0} y1={y} x2={1200} y2={y} stroke="#c6a44b" strokeWidth={1} />
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
          <StatBlock label="Members" value={String(wom.member_count ?? "—")} />
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
