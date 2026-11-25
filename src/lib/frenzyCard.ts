import type { FrenzyItem, FrenzyMultiplier, FrenzySource } from "@/types/frenzy";

export type ProgressState = "none" | "base" | "full";

const MEASURED_BY: Record<string, string> = {
  wom: "WOM EHB",
  droptracker: "DropTracker",
  clue_scroll: "Clue scroll",
  item_drop: "Item drop",
  superior: "Superior",
  fixed: "Fixed",
};

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
