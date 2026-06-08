import type {
  FrenzyActivity,
  FrenzyItem,
  FrenzyMilestone,
  FrenzyMultiplier,
  FrenzySource,
  FrenzyTeamProgress,
  TeamScoreBreakdown,
} from "@/types/frenzy";

export const TEAM_COLORS = [
  "hsl(220,70%,55%)",
  "hsl(140,60%,45%)",
  "hsl(280,65%,60%)",
  "hsl(30,80%,55%)",
  "hsl(0,65%,55%)",
  "hsl(180,55%,45%)",
  "hsl(55,75%,50%)",
  "hsl(320,65%,60%)",
];

export function buildTeamColors(teamNames: string[]): Record<string, string> {
  return Object.fromEntries(
    teamNames.map((n, i) => [n, TEAM_COLORS[i % TEAM_COLORS.length] ?? "#888"]),
  );
}

export function calcItemPoints(item: FrenzyItem, obtained: number): number {
  let pts = 0;
  const required = item.required ?? 1;
  const dupRequired = item.duplicate_required ?? 1;
  const dupPoints = item.points / 2;

  if (obtained >= required) {
    pts += item.points;
  } else if (required === 2 && obtained === 1) {
    pts += item.points / 2;
  }

  const beyond = obtained - required;
  if (beyond >= dupRequired) {
    pts += dupPoints;
  } else if (dupRequired === 2 && beyond === 1) {
    pts += dupPoints / 2;
  }

  return pts;
}

export function calcTierEntryPoints(
  entry: FrenzyActivity | FrenzyMilestone,
  currentValue: number,
): number {
  const tiersDone = [entry.tier1, entry.tier2, entry.tier3, entry.tier4].filter(
    (t) => currentValue >= t,
  ).length;
  const base = entry.point_step * tiersDone;
  if (tiersDone === 4) {
    return base * entry.multiplier;
  }
  return base;
}

export function isMultiplierUnlocked(
  mult: FrenzyMultiplier,
  itemProgress: Record<string, number>,
): boolean {
  return mult.requirement.every((req) => (itemProgress[req] ?? 0) > 0);
}

function calcSourcePoints(
  tierName: string,
  source: FrenzySource,
  itemProgress: Record<string, number>,
  unlockedMultipliers: FrenzyMultiplier[],
): number {
  let pts = 0;
  for (const item of source.items) {
    const key = `${tierName}.${source.name}.${item.name}`;
    const obtained = itemProgress[key] ?? 0;
    pts += calcItemPoints(item, obtained);
  }
  const factor = unlockedMultipliers
    .filter((m) => m.affects.includes(source.name))
    .reduce((acc, m) => acc * m.factor, 1);
  return pts * factor;
}

function calcTotalPoints(
  tiers: Record<string, { sources: FrenzySource[] }>,
  activities: FrenzyActivity[],
  milestones: Record<string, FrenzyMilestone[]>,
  multipliers: FrenzyMultiplier[],
  progress: FrenzyTeamProgress,
): TeamScoreBreakdown {
  const { item_progress, activity_progress, milestone_progress } = progress;

  const unlocked = multipliers.filter((m) => isMultiplierUnlocked(m, item_progress));

  const tier_points: Record<string, number> = {};
  for (const [tierName, tierData] of Object.entries(tiers)) {
    let t = 0;
    for (const source of tierData.sources) {
      t += calcSourcePoints(tierName, source, item_progress, unlocked);
    }
    tier_points[tierName] = t;
  }

  const activity_points = activities.reduce(
    (acc, act) => acc + calcTierEntryPoints(act, activity_progress[act.name] ?? 0),
    0,
  );

  let milestone_points = 0;
  for (const entries of Object.values(milestones)) {
    for (const entry of entries) {
      milestone_points += calcTierEntryPoints(entry, milestone_progress[entry.name] ?? 0);
    }
  }

  const total = Object.values(tier_points).reduce((a, b) => a + b, 0) + activity_points + milestone_points;
  return { tier_points, activity_points, milestone_points, total };
}

export function getTiersCompleted(
  entry: FrenzyActivity | FrenzyMilestone,
  currentValue: number,
): number {
  return [entry.tier1, entry.tier2, entry.tier3, entry.tier4].filter((t) => currentValue >= t).length;
}
