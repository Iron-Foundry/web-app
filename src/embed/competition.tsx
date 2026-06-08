import type { CompetitionFixture } from "./types";
import { GridTexture, CornerAccents, Divider } from "./shared";

const RAID_GROUPS: Record<string, { label: string; variants: string[] }> = {
  chambers_of_xeric: { label: "Chambers of Xeric", variants: ["chambers_of_xeric", "chambers_of_xeric_challenge_mode"] },
  theatre_of_blood: { label: "Theatre of Blood", variants: ["theatre_of_blood", "theatre_of_blood_hard_mode"] },
  tombs_of_amascut: { label: "Tombs of Amascut", variants: ["tombs_of_amascut", "tombs_of_amascut_expert_mode"] },
};

const METRIC_TO_RAID_GROUP: Record<string, string> = Object.fromEntries(
  Object.entries(RAID_GROUPS).flatMap(([key, { variants }]) => variants.map((v) => [v, key])),
);

function metricPills(metrics: string[]): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const metric of metrics) {
    if (seen.has(metric)) continue;
    const groupKey = METRIC_TO_RAID_GROUP[metric];
    if (groupKey) {
      const group = RAID_GROUPS[groupKey]!;
      const present = group.variants.filter((v) => metrics.includes(v));
      if (present.length >= 2) {
        present.forEach((v) => seen.add(v));
        labels.push(group.label);
        continue;
      }
    }
    seen.add(metric);
    labels.push(metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
  }
  return labels;
}

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
        <div style={{ display: "flex", gap: 8 }}>
          {metricPills(competition.metrics).map((label) => (
            <div
              key={label}
              style={{
                fontSize: 20,
                color: "#8a7d65",
                textTransform: "uppercase",
                letterSpacing: 2,
                background: "rgba(255,255,255,0.04)",
                padding: "3px 10px",
              }}
            >
              {label}
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
