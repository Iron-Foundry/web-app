import type { CompetitionFixture } from "./types";

export interface CompetitionCardProps {
  competition: CompetitionFixture | null;
}

function timeLeft(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return `${hours}h ${mins}m`;
}

export function CompetitionCard({ competition }: CompetitionCardProps) {
  if (!competition) {
    return (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#111111",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "RuneScape",
          color: "#6b6452",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 28, color: "#c6a44b", letterSpacing: 4, textTransform: "uppercase" }}>
          Iron Foundry
        </div>
        <div style={{ fontSize: 22 }}>No active competitions</div>
        <div style={{ fontSize: 18, color: "#4a4035" }}>ironfoundry.cc</div>
      </div>
    );
  }

  const isOngoing = competition.status === "ongoing";
  const timeLabel = isOngoing
    ? `Ends in ${timeLeft(competition.endsAt)}`
    : `Starts in ${timeLeft(competition.startsAt)}`;

  const statusColor = isOngoing ? "#4ade80" : "#60a5fa";
  const statusText = isOngoing ? "LIVE" : "UPCOMING";

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
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, color: "#c6a44b", letterSpacing: 4, textTransform: "uppercase" }}>
          Iron Foundry · Competition
        </div>
        <div
          style={{
            fontSize: 16,
            color: statusColor,
            border: `1px solid ${statusColor}`,
            padding: "4px 14px",
            letterSpacing: 3,
          }}
        >
          {statusText}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: "100%", height: 2, background: "linear-gradient(to right, #c6a44b, transparent)" }} />

      {/* Title + metric */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, justifyContent: "center" }}>
        <div style={{ fontSize: 64, color: "#f5f0e8", lineHeight: 1 }}>{competition.title}</div>
        <div style={{ fontSize: 24, color: "#8a7d65", textTransform: "uppercase", letterSpacing: 2 }}>
          {competition.metric.replace(/_/g, " ")}
        </div>
        {competition.participantCount != null && (
          <div style={{ display: "flex", fontSize: 22, color: "#6b6452" }}>
            {`${competition.participantCount} participant${competition.participantCount !== 1 ? "s" : ""}`}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, color: "#8a7d65" }}>{timeLabel}</div>
        <div style={{ fontSize: 18, color: "#4a4035" }}>ironfoundry.cc</div>
      </div>
    </div>
  );
}
