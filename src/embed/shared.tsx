export function GridTexture() {
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

export function CornerAccents() {
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

export function Divider() {
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
