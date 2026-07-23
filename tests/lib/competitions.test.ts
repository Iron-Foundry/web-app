import { describe, expect, test } from "bun:test";
import { SKILL_METRICS } from "@/lib/bingo";
import {
  fmtCompetitionLabel,
  fmtGained,
  rankEmoji,
} from "@/lib/competitions";

describe("fmtCompetitionLabel", () => {
  test("humanises snake_case metrics", () => {
    expect(fmtCompetitionLabel("chambers_of_xeric")).toBe("Chambers Of Xeric");
  });
});

describe("rankEmoji", () => {
  test("medals for top 3, #rank otherwise", () => {
    expect(rankEmoji(1)).toBe("🥇");
    expect(rankEmoji(2)).toBe("🥈");
    expect(rankEmoji(3)).toBe("🥉");
    expect(rankEmoji(4)).toBe("#4");
  });
});

describe("fmtGained", () => {
  test("formats skill xp with M/K suffixes", () => {
    const skill = [...SKILL_METRICS][0]!;
    expect(fmtGained(2_500_000, skill)).toBe("2.50M xp");
    expect(fmtGained(12_000, skill)).toBe("12K xp");
    expect(fmtGained(500, skill)).toBe("500 xp");
  });

  test("formats non-skill metrics with thousands separators", () => {
    expect(fmtGained(1234, "zulrah")).toBe((1234).toLocaleString());
  });
});
