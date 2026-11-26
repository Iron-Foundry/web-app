import type { FrenzyItem, FrenzyMultiplier, FrenzySource } from "@/types/frenzyTemplate";

export type ProgressState = "none" | "base" | "full";

const MEASURED_BY: Record<string, string> = {
  wom: "WOM EHB",
  droptracker: "DropTracker",
  clue_scroll: "Clue scroll",
  item_drop: "Item drop",
  superior: "Superior",
  fixed: "Fixed",
  foundry: "Foundry",
};

/** The tiers by their `order`; a tier with none keeps its place. The API's key order is never the staff order. */
export function orderedTiers<T extends { order?: number }>(tiers: Record<string, T>): [string, T][] {
  return Object.entries(tiers)
    .map((entry, i) => ({ entry, rank: entry[1].order ?? i, i }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map(({ entry }) => entry);
}

/** The tiers with their `order` set to their place in `names`. */
export function reorderTiers<T extends { order?: number }>(tiers: Record<string, T>, names: string[]): Record<string, T> {
  return Object.fromEntries(names.map((name, order) => [name, { ...tiers[name]!, order }]));
}

/** The tier names with `name` moved one place by `step`; unchanged at either end. */
export function movedTier(names: string[], name: string, step: -1 | 1): string[] {
  const from = names.indexOf(name);
  const to = from + step;
  if (from < 0 || to < 0 || to >= names.length) return names;
  const next = [...names];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

export function emptyItem(): FrenzyItem {
  return { name: "", points: 0, required: 1, duplicate_required: 1, icon_url: null, drop_denom: null, kph: null };
}

export function itemKey(tierName: string, cardName: string, itemName: string): string {
  return `${tierName}.${cardName}.${itemName}`;
}

export function itemState(item: FrenzyItem, obtained: number): ProgressState {
  if (obtained < item.required) return "none";
  return obtained >= item.required + Math.max(0, item.duplicate_required) ? "full" : "base";
}

export function cardState(states: ProgressState[]): ProgressState {
  if (states.length === 0) return "none";
  if (states.every((s) => s === "full")) return "full";
  return states.every((s) => s !== "none") ? "base" : "none";
}

export function rateSourceName(rateSource: string): string {
  return rateSource.split("#")[0] ?? rateSource;
}

export function rateSourceLabel(rateSource: string): string {
  return rateSource.replace("#", ", ");
}

/** A typed card groups items whose rate rows come from a source other than the card's own name. */
export function isTypedCard(source: FrenzySource): boolean {
  return source.items.some((i) => i.rate_source && rateSourceName(i.rate_source) !== source.name);
}

export function hoursPerDrop(item: FrenzyItem): number | null {
  if (!item.drop_denom || !item.kph) return null;
  return item.drop_denom / item.kph;
}

export function measuredBy(killRateSource: string | null | undefined): string {
  return killRateSource ? (MEASURED_BY[killRateSource] ?? killRateSource) : "-";
}

export function cardFactor(cardName: string, unlocked: FrenzyMultiplier[]): number {
  return unlocked.filter((m) => m.affects.includes(cardName)).reduce((acc, m) => acc * m.factor, 1);
}

export const STATE_TEXT: Record<ProgressState, string> = {
  none: "",
  base: "text-yellow-500",
  full: "text-green-500",
};
