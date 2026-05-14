import { buildMetricTabs, RAID_GROUPS } from "../lib/competitions";
import type { CompetitionFixture } from "./types";

export interface CompetitionCardProps {
  competition: CompetitionFixture | null;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

export function CompetitionCard({ competition }: CompetitionCardProps) {
  const base = {
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

  if (!competition) {
    return (
      <div style={{ ...base, justifyContent: "center", alignItems: "center", gap: 16 }}>
        <GridTexture />
        <CornerAccents />
        <div
          style={{
            alignSelf: "center",
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
        <div style={{ fontSize: 26, color: "#6b6452" }}>No active competitions</div>
        <div style={{ fontSize: 18, color: "#4a4035" }}>ironfoundry.cc</div>
      </div>
    );
  }

  const isOngoing = competition.status === "ongoing";
  const dateRange = `${fmtDate(competition.startsAt)} - ${fmtDate(competition.endsAt)}`;

  const statusColor = isOngoing ? "#4ade80" : "#60a5fa";
  const statusBg = isOngoing ? "rgba(74,222,128,0.15)" : "rgba(96,165,250,0.12)";
  const statusText = isOngoing ? "LIVE" : "UPCOMING";

  return (
    <div style={base}>
      <GridTexture />
      <CornerAccents />

      {/* Header row */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
            Iron Foundry · Competition
          </div>
          <div
            style={{
              fontSize: 16,
              color: statusColor,
              background: statusBg,
              border: `1px solid ${statusColor}`,
              padding: "6px 16px",
              letterSpacing: 3,
            }}
          >
            {statusText}
          </div>
        </div>
        <Divider />
      </div>

      {/* Title + metric */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, justifyContent: "center" }}>
        <div style={{ fontSize: 68, color: "#f5f0e8", lineHeight: 1 }}>{competition.title}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {buildMetricTabs(competition.metrics).map((tab) => (
            <div
              key={tab.kind === "raid" ? tab.groupKey : tab.metric}
              style={{
                fontSize: 20,
                color: "#8a7d65",
                textTransform: "uppercase",
                letterSpacing: 2,
                background: "rgba(255,255,255,0.04)",
                padding: "3px 10px",
              }}
            >
              {tab.kind === "raid" ? RAID_GROUPS[tab.groupKey]?.label ?? tab.label : tab.label}
            </div>
          ))}
        </div>
        {competition.participantCount != null && (
          <div style={{ display: "flex", fontSize: 22, color: "#6b6452" }}>
            {`${competition.participantCount} participant${competition.participantCount !== 1 ? "s" : ""}`}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 26, color: "#c6a44b" }}>{dateRange}</div>
        <div style={{ fontSize: 18, color: "#4a4035" }}>ironfoundry.cc</div>
      </div>
    </div>
  );
}
