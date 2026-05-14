import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { renderCard } from "../src/embed/utils";
import { ClanStatsCard } from "../src/embed/clan-stats";
import { CompetitionCard } from "../src/embed/competition";
import { MemberCard } from "../src/embed/member";
import { FIXTURES } from "../src/embed/fixtures";

const OUT = join(import.meta.dir, "../dist/embed-preview");
mkdirSync(OUT, { recursive: true });

const cases: Array<[string, unknown]> = [
  ["clan-stats", ClanStatsCard(FIXTURES.clanStats)],
  ["competition-ongoing", CompetitionCard({ competition: FIXTURES.competitionOngoing })],
  ["competition-upcoming", CompetitionCard({ competition: FIXTURES.competitionUpcoming })],
  ["competition-none", CompetitionCard({ competition: FIXTURES.competitionNone })],
  ["member-normal", MemberCard({ player: FIXTURES.memberNormal })],
  ["member-opted-out", MemberCard({ player: FIXTURES.memberOptedOut })],
  ["member-not-found", MemberCard({ player: FIXTURES.memberNotFound })],
  ["member-unlinked", MemberCard({ player: FIXTURES.memberUnlinked })],
];

console.log(`Rendering ${cases.length} cards to ${OUT}\n`);

for (const [name, node] of cases) {
  const start = performance.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const png = await renderCard(node as any);
  const ms = Math.round(performance.now() - start);
  const path = join(OUT, `${name}.png`);
  writeFileSync(path, png);
  console.log(`  ✓  ${name}.png  (${ms}ms, ${Math.round(png.byteLength / 1024)}KB)`);
}

console.log("\nDone.");
