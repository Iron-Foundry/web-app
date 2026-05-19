const SKILL_METRICS = new Set([
  "overall", "attack", "defence", "strength", "hitpoints", "ranged", "prayer",
  "magic", "cooking", "woodcutting", "fletching", "fishing", "firemaking",
  "crafting", "smithing", "mining", "herblore", "agility", "thieving", "slayer",
  "farming", "runecrafting", "hunter", "construction", "sailing",
]);

function fmtGained(v: number, metric: string): string {
  const n = Math.max(0, v);
  if (SKILL_METRICS.has(metric)) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M xp`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K xp`;
    return `${n} xp`;
  }
  return n.toLocaleString("en-GB");
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtMetric(metric: string): string {
  return metric.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface Top5Entry {
  rank: number;
  player_name: string;
  gained: number;
}

export interface CompetitionTop5Props {
  title: string;
  status: "ongoing" | "upcoming" | "finished";
  startsAt: string;
  endsAt: string;
  metric: string;
  top5: Top5Entry[];
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
      <div style={{ width: "100%", height: 2, background: "linear-gradient(to right, #c6a44b, rgba(198,164,75,0.2), transparent)" }} />
      <div style={{ width: "100%", height: 1, background: "rgba(198,164,75,0.08)" }} />
    </div>
  );
}

function rankColor(rank: number): string {
  if (rank === 1) return "#c6a44b";
  if (rank <= 3) return "#8a7d65";
  return "#6b6452";
}

function rankLabel(rank: number): string {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

export function CompetitionTop5Card(props: CompetitionTop5Props) {
  const { title, status, startsAt, endsAt, metric, top5 } = props;

  const statusColor =
    status === "ongoing" ? "#4ade80" :
    status === "upcoming" ? "#60a5fa" :
    "#6b7280";
  const statusBg =
    status === "ongoing" ? "rgba(74,222,128,0.15)" :
    status === "upcoming" ? "rgba(96,165,250,0.12)" :
    "rgba(107,114,128,0.15)";
  const statusText =
    status === "ongoing" ? "LIVE" :
    status === "upcoming" ? "UPCOMING" :
    "FINISHED";

  const maxGained = top5.reduce((m, e) => Math.max(m, e.gained), 1);
  const dateRange = `${fmtDate(startsAt)} - ${fmtDate(endsAt)}`;

  const base = {
    width: 1200,
    height: 630,
    background: "radial-gradient(ellipse at 25% 35%, #1c1710 0%, #111111 55%, #090909 100%)",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between" as const,
    padding: "48px 64px",
    fontFamily: "RuneScape",
    color: "#f5f0e8",
    position: "relative" as const,
  };

  return (
    <div style={base}>
      <GridTexture />
      <CornerAccents />

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{
            border: "1px solid rgba(198,164,75,0.4)",
            padding: "4px 12px",
            fontSize: 18,
            color: "#c6a44b",
            letterSpacing: 5,
            textTransform: "uppercase",
          }}>
            Iron Foundry · Competition
          </div>
          <div style={{
            fontSize: 15,
            color: statusColor,
            background: statusBg,
            border: `1px solid ${statusColor}`,
            padding: "5px 14px",
            letterSpacing: 3,
          }}>
            {statusText}
          </div>
        </div>
        <Divider />
      </div>

      {/* Competition info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 46, color: "#f5f0e8", lineHeight: 1 }}>{title}</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{
            fontSize: 17,
            color: "#570091",
            textTransform: "uppercase",
            letterSpacing: 2,
            background: "rgba(87, 0, 145, 0.14)",
            padding: "3px 10px",
            border: "1px solid rgba(87, 0, 145, 0.55)",
            boxShadow: "0 0 10px rgba(87, 0, 145, 0.4)",
          }}>
            {fmtMetric(metric)}
          </div>
          <div style={{ fontSize: 15, color: "#4a4035", letterSpacing: 1 }}>TOP 5 LEADERBOARD</div>
        </div>
      </div>

      {/* Top 5 rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1, justifyContent: "center" }}>
        {top5.map((entry) => {
          const barWidth = maxGained > 0 ? Math.round((entry.gained / maxGained) * 100) : 0;
          const isFirst = entry.rank === 1;
          return (
            <div key={entry.player_name} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: isFirst ? "10px 14px" : "10px 0",
                background: isFirst ? "rgba(198,164,75,0.06)" : "transparent",
                borderLeft: isFirst ? "3px solid rgba(198,164,75,0.5)" : "3px solid transparent",
              }}>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <span style={{
                    width: 44,
                    fontSize: 22,
                    color: rankColor(entry.rank),
                    letterSpacing: 1,
                  }}>
                    {rankLabel(entry.rank)}
                  </span>
                  <span style={{
                    fontSize: isFirst ? 34 : 30,
                    color: isFirst ? "#f5f0e8" : "#c8bfa8",
                  }}>
                    {entry.player_name}
                  </span>
                </div>
                <span style={{
                  fontSize: isFirst ? 30 : 26,
                  color: isFirst ? "#c6a44b" : "#8a7d65",
                  letterSpacing: 1,
                }}>
                  +{fmtGained(entry.gained, metric)}
                </span>
              </div>
              {/* Progress bar */}
              <div style={{ display: "flex", height: 2, background: "rgba(198,164,75,0.06)", marginBottom: 2 }}>
                <div style={{
                  width: `${barWidth}%`,
                  height: 2,
                  background: isFirst
                    ? "linear-gradient(to right, #c6a44b, rgba(198,164,75,0.4))"
                    : "rgba(198,164,75,0.2)",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 22, color: "#c6a44b" }}>{dateRange}</div>
          {status === "ongoing" && (
            <div style={{ fontSize: 14, color: "#4a4035", letterSpacing: 1 }}>
              {`Exported ${fmtDate(new Date().toISOString())}`}
            </div>
          )}
        </div>
        <div style={{ fontSize: 16, color: "#4a4035" }}>ironfoundry.cc</div>
      </div>
    </div>
  );
}
