import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { PageHead } from "@/components/layout/PageHead";

export const rulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rules",
  component: RulesPage,
});

const RULES = [
  {
    number: 1,
    text: "Follow all Jagex rules, or don't, but don't broadcast what you are doing if that is the case.",
  },
  {
    number: 2,
    text: "Racist, sexist, homophobic, discriminatory and all other remarks that may be considered hostile to other people will not be tolerated.",
  },
  {
    number: 3,
    text: "Topics such as politics, religion, etc, can only be discussed publicly if it is by means of constructive conversation. Otherwise, it should be taken to DMs.",
  },
  {
    number: 4,
    text: "Scamming, luring, begging or advertising services is not allowed.",
  },
  {
    number: 5,
    text: "Unless mutually agreed upon beforehand, you may not PK other clan members.",
  },
  {
    number: 6,
    text: "Unless mutually agreed upon beforehand, all PvM drops are regarded as FFA.",
  },
];

function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6">
      <PageHead title="Clan Rules" lede="By joining Iron Foundry you agree to abide by the following rules." />
      <ol className="space-y-3">
        {RULES.map((rule) => (
          <li key={rule.number} className="flex gap-5 rounded-xl border border-border bg-card px-5 py-4">
            <span className="w-8 shrink-0 font-rs-bold text-3xl leading-none text-mark">{rule.number}</span>
            <p className="leading-relaxed text-mk-body">{rule.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
