import { fmtType, resolutionMs } from "./format";
import type { StaffRef, StaffStat, TicketSummary } from "./types";

interface Acc {
  ref: StaffRef;
  closed: number;
  participated: number;
  closeDurations: number[];
}

function ensure(map: Map<number, Acc>, ref: StaffRef): Acc {
  let acc = map.get(ref.id);
  if (!acc) {
    acc = { ref, closed: 0, participated: 0, closeDurations: [] };
    map.set(ref.id, acc);
  }
  return acc;
}

export function buildStaffStats(tickets: TicketSummary[]): StaffStat[] {
  const map = new Map<number, Acc>();
  for (const t of tickets) {
    if (t.closed_by) {
      const acc = ensure(map, t.closed_by);
      acc.closed += 1;
      const ms = resolutionMs(t);
      if (ms !== null) acc.closeDurations.push(ms);
    }
    for (const s of t.participants) {
      if (s.id === t.creator.id) continue;
      ensure(map, s).participated += 1;
    }
  }
  return [...map.values()]
    .map((a) => ({
      id: a.ref.id,
      display_name: a.ref.display_name,
      avatar_url: a.ref.avatar_url,
      closed: a.closed,
      participated: a.participated,
      avgCloseMs: a.closeDurations.length
        ? a.closeDurations.reduce((s, ms) => s + ms, 0) / a.closeDurations.length
        : null,
    }))
    .sort((a, b) => b.closed - a.closed || b.participated - a.participated);
}

export const RESOLUTION_BUCKETS: { label: string; maxMs: number }[] = [
  { label: "<=10m", maxMs: 10 * 60_000 },
  { label: "<=30m", maxMs: 30 * 60_000 },
  { label: "<=1h", maxMs: 1 * 3_600_000 },
  { label: "<=3h", maxMs: 3 * 3_600_000 },
  { label: "<=6h", maxMs: 6 * 3_600_000 },
  { label: "<=12h", maxMs: 12 * 3_600_000 },
  { label: "<=24h", maxMs: 24 * 3_600_000 },
  { label: ">24h", maxMs: Infinity },
];

export function buildResolutionData(
  tickets: TicketSummary[],
): { bucket: string; count: number }[] {
  const counts = new Array<number>(RESOLUTION_BUCKETS.length).fill(0);
  for (const t of tickets) {
    const ms = resolutionMs(t);
    if (ms === null) continue;
    const idx = RESOLUTION_BUCKETS.findIndex((b) => ms <= b.maxMs);
    if (idx >= 0) counts[idx] = (counts[idx] ?? 0) + 1;
  }
  return RESOLUTION_BUCKETS.map((b, i) => ({ bucket: b.label, count: counts[i] ?? 0 }));
}

export function buildTypeData(
  tickets: TicketSummary[],
): { type: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const t of tickets) {
    const label = fmtType(t.ticket_type);
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}
