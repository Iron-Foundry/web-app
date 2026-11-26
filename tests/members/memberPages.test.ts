import { describe, expect, test } from "bun:test";
import { dashboardFacts, profileFacts } from "@/components/members/memberFacts";
import { answerText, missingRequired, submitErrorText, type Field } from "@/components/members/surveys/surveyTypes";
import { timeLeft } from "@/components/members/DashboardCompetitions";
import { templateAction } from "@/components/members/surveys/TemplateList";
import { rowSectionFor } from "@/lib/navigation";
import { countdownText } from "@/components/competitions/CompetitionHeader";
import type { MeStats } from "@/types/members";

const stats = { collection_log_slots: 0, collection_log_slots_max: 0, total_loot_value: 0, rank_tier: null } as unknown as MeStats;

describe("dashboardFacts", () => {
  test("leaves out figures the member lacks", () => {
    const user = { username: "hammertime", rsn: null, alts_count: 0, clan_rank: null };
    expect(dashboardFacts(user, stats, null).map((f) => f.label)).toEqual(["Discord"]);
  });
  test("counts alts on the RSN", () => {
    const user = { username: "hammertime", rsn: "Hammer Time", alts_count: 2, clan_rank: null };
    expect(dashboardFacts(user, undefined, null)[1]).toMatchObject({ label: "RSN", sub: "+2 alts" });
  });
});

test("profileFacts prefers the ranking tier", () => {
  const primary = { rsn: "a", is_primary: true, rank: "Ruby", points: 10, boss_points: null, skill_points: null };
  const labels = profileFacts({ ...stats, rank_tier: "Onyx" }, primary).map((f) => [f.label, f.value]);
  expect(labels).toEqual([["Ranking Points", "10"], ["Rank Tier", "Ruby"]]);
});

describe("survey answers", () => {
  const fields: Field[] = [
    { id: "a", type: "short_text", label: "A", required: true },
    { id: "b", type: "select", label: "B", required: true, max_choices: 3 },
    { id: "c", type: "long_text", label: "C", required: false },
  ];
  test("missingRequired names blank required fields", () => {
    expect([...missingRequired(fields, { a: "x", b: [] })]).toEqual(["b"]);
  });
  test.each([[undefined, "-"], ["", "-"], [["x", "y"], "x, y"], ["yes", "yes"]])("answerText(%p)", (value, text) => {
    expect(answerText(value)).toBe(text);
  });
  test.each([
    [409, null, "You have already submitted a response."],
    [422, "Bad answer", "Bad answer"],
    [500, { x: 1 }, "Submission failed. Please try again."],
  ])("submitErrorText(%p)", (status, detail, text) => {
    expect(submitErrorText(status, detail)).toBe(text);
  });
});

test.each([
  [90_061_000, "1d 1h"],
  [3_660_000, "1h 1m"],
  [120_000, "2m"],
  [-1, "Ended"],
])("timeLeft at %p ms reads %p", (offset, text) => {
  expect(timeLeft(new Date(1_000_000_000 + offset).toISOString(), 1_000_000_000)).toBe(text);
});

test.each([
  [{ is_open: true, user_submitted: true }, "View submission"],
  [{ is_open: true, user_submitted: false }, "Fill out"],
  [{ is_open: false, user_submitted: false }, "View"],
] as const)("templateAction(%p)", (entry, action) => {
  expect(templateAction(entry)).toBe(action);
});

test.each([
  [90_061_000, "1d 1h 1m 1s"],
  [61_000, "1m 1s"],
  [5_000, "5s"],
  [-1, "0s"],
])("countdownText at %p ms reads %p", (offset, text) => {
  expect(countdownText(new Date(1_000_000_000 + offset).toISOString(), 1_000_000_000)).toBe(text);
});

test("the page row lists the members pages", () => {
  expect(rowSectionFor("members")?.links.map((l) => l.label)).toContain("Settings");
  expect(rowSectionFor(null)).toBeNull();
});
