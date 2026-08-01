import { describe, expect, test } from "bun:test";
import { categorizeMetricTabs, tabKey } from "@/lib/competition-metric-groups";
import { buildMetricTabs } from "@/lib/competitions";

describe("tabKey", () => {
  test("a raid tab is keyed by its group, a single tab by its metric", () => {
    const [raid, single] = buildMetricTabs([
      "chambers_of_xeric",
      "chambers_of_xeric_challenge_mode",
      "zulrah",
    ]);

    expect(raid && tabKey(raid)).toBe("chambers_of_xeric");
    expect(single && tabKey(single)).toBe("zulrah");
  });
});

describe("categorizeMetricTabs", () => {
  test("sorts each category alphabetically by label", () => {
    const categories = categorizeMetricTabs(
      buildMetricTabs(["woodcutting", "attack", "mining"]),
    );

    expect(categories).toHaveLength(1);
    expect(categories[0]?.name).toBe("Skills");
    expect(categories[0]?.tabs.map((t) => t.label)).toEqual([
      "Attack",
      "Mining",
      "Woodcutting",
    ]);
  });

  test("keeps the categories in their configured order", () => {
    const categories = categorizeMetricTabs(
      buildMetricTabs([
        "ehp",
        "last_man_standing",
        "chambers_of_xeric",
        "chambers_of_xeric_challenge_mode",
        "zulrah",
        "attack",
      ]),
    );

    expect(categories.map((c) => c.name)).toEqual([
      "Skills",
      "Bosses",
      "Raids",
      "Activities",
      "Computed",
    ]);
  });

  test("lifts raids out of the boss list, grouped and split alike", () => {
    const categories = categorizeMetricTabs(
      buildMetricTabs([
        "zulrah",
        "chambers_of_xeric",
        "chambers_of_xeric_challenge_mode",
        "theatre_of_blood",
      ]),
    );

    const byName = new Map(categories.map((c) => [c.name, c.tabs]));
    expect(byName.get("Bosses")?.map((t) => t.label)).toEqual(["Zulrah"]);
    expect(byName.get("Raids")?.map((t) => t.label)).toEqual([
      "Chambers of Xeric",
      "Theatre Of Blood",
    ]);
  });

  test("an unknown metric lands in Other rather than vanishing", () => {
    const categories = categorizeMetricTabs(buildMetricTabs(["attack", "made_up_metric"]));

    expect(categories.map((c) => c.name)).toEqual(["Skills", "Other"]);
    expect(categories[1]?.tabs.map((t) => t.label)).toEqual(["Made Up Metric"]);
  });

  test("no tabs means no categories", () => {
    expect(categorizeMetricTabs([])).toEqual([]);
  });
});
