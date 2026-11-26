import type { LootRateRow } from "@/api/osrsclans";

type LootLine = LootRateRow["lines"][number];

/** "Vorkath#Post-quest" -> "Vorkath, Post-quest". */
export function sourceLabel(source: string): string {
  return source.replace("#", ", ");
}

/** A chance as a percent, with more decimals the rarer it is. */
export function formatChance(pct: number): string {
  if (pct <= 0) return "-";
  if (pct >= 100) return "100%";
  if (pct < 0.1) return `${pct.toFixed(3)}%`;
  if (pct < 1) return `${pct.toFixed(2)}%`;
  return `${pct.toFixed(1)}%`;
}

export function chanceLabel(row: Pick<LootRateRow, "chance">): string {
  return row.chance ? formatChance(row.chance * 100) : "-";
}

export function quantityLabel(line: LootLine): string {
  const { quantity_low: low, quantity_high: high } = line;
  const range = low == null || high == null ? line.quantity : low === high ? `${low}` : `${low}-${high}`;
  return line.noted ? `${range} (noted)` : range;
}

/** Kills an hour as staff type it, or null outside the API's 0 < rate <= 100,000. */
export function parseKillsPerHour(text: string): number | null {
  const value = Number(text.trim());
  return text.trim() !== "" && Number.isFinite(value) && value > 0 && value <= 100_000 ? value : null;
}

/** The rows under each drop table heading, in the order the headings first appear. */
export function groupRows<R extends Pick<LootRateRow, "group">>(rows: R[]): [string, R[]][] {
  const groups = new Map<string, R[]>();
  for (const row of rows) {
    const group = row.group || "Drops";
    groups.set(group, [...(groups.get(group) ?? []), row]);
  }
  return [...groups.entries()];
}
