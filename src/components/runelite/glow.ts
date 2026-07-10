export interface GlowValues {
  blur: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

export const DEFAULT_GLOW: GlowValues = { blur: 1.5, r: 150, g: 190, b: 230, a: 0.55 };

export function glowToFilter(glow: GlowValues): string {
  return `drop-shadow(0 0 ${glow.blur}px rgba(${glow.r}, ${glow.g}, ${glow.b}, ${glow.a}))`;
}

export function encodeGlow(glow: GlowValues): string {
  return `${glow.blur},${glow.r},${glow.g},${glow.b},${glow.a}`;
}

export function decodeGlow(spec: string): GlowValues | null {
  const parts = spec.split(",").map(Number);
  if (parts.length !== 5 || parts.some((n) => !Number.isFinite(n))) return null;
  return { blur: parts[0]!, r: parts[1]!, g: parts[2]!, b: parts[3]!, a: parts[4]! };
}

export function isDefaultGlow(glow: GlowValues): boolean {
  return (
    glow.blur === DEFAULT_GLOW.blur &&
    glow.r === DEFAULT_GLOW.r &&
    glow.g === DEFAULT_GLOW.g &&
    glow.b === DEFAULT_GLOW.b &&
    glow.a === DEFAULT_GLOW.a
  );
}
