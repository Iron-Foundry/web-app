const DEFAULT_COLOR = "rgba(255, 255, 255, 1)";

/** A RuneLite ARGB color (a number, "#AARRGGBB", or `{ value }`) as a CSS rgba(). */
export function argbToCss(argb: unknown): string {
  if (argb && typeof argb === "object" && "value" in argb) {
    return argbToCss((argb as { value: unknown }).value);
  }
  if (typeof argb === "number") {
    const value = argb >>> 0;
    const alpha = ((value >>> 24) & 0xff) / 255;
    return `rgba(${(value >>> 16) & 0xff}, ${(value >>> 8) & 0xff}, ${value & 0xff}, ${Number(alpha.toFixed(3))})`;
  }
  if (typeof argb !== "string") return DEFAULT_COLOR;
  const hex = argb.replace(/^#/, "");
  if (hex.length !== 8) return argb;
  const alpha = parseInt(hex.slice(0, 2), 16) / 255;
  const red = parseInt(hex.slice(2, 4), 16);
  const green = parseInt(hex.slice(4, 6), 16);
  const blue = parseInt(hex.slice(6, 8), 16);
  return `rgba(${red}, ${green}, ${blue}, ${Number(alpha.toFixed(3))})`;
}
