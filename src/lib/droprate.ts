import type { LootDrop } from "@/types/reference";

export function normalizedRarity(num: number, denom: number): string {
  if (num <= 0 || denom <= 0) return "-";
  if (num >= denom) return "Always";
  const oneIn = denom / num;
  const rounded = oneIn >= 100 ? Math.round(oneIn) : Math.round(oneIn * 10) / 10;
  return `1/${rounded.toLocaleString()}`;
}

export function perKillChance(num: number, denom: number, rolls: number): number {
  if (num <= 0 || denom <= 0) return 0;
  const perRoll = Math.min(1, num / denom);
  const rollCount = Math.max(1, rolls);
  return (1 - Math.pow(1 - perRoll, rollCount)) * 100;
}

export function formatChance(pct: number): string {
  if (pct <= 0) return "-";
  if (pct >= 100) return "100%";
  if (pct < 0.1) return `${pct.toFixed(3)}%`;
  if (pct < 1) return `${pct.toFixed(2)}%`;
  return `${pct.toFixed(1)}%`;
}

export function rarityLabel(drop: LootDrop): string {
  if (drop.rarity_num != null && drop.rarity_denom != null) {
    return normalizedRarity(drop.rarity_num, drop.rarity_denom);
  }
  return drop.rarity_text ?? "-";
}

export function chanceLabel(drop: LootDrop): string {
  if (drop.rarity_num == null || drop.rarity_denom == null) return "-";
  return formatChance(perKillChance(drop.rarity_num, drop.rarity_denom, drop.rolls));
}
