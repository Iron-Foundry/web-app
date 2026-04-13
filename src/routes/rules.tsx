import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Clan Rules</h1>
        <p className="text-muted-foreground">
          By joining Iron Foundry you agree to abide by the following rules.
        </p>
      </div>

      <div className="space-y-3">
        {RULES.map((rule) => (
          <Card key={rule.number}>
            <CardContent className="flex gap-4 py-4">
              <span className="font-rs-bold text-2xl text-primary shrink-0 w-7 leading-tight">
                {rule.number}
              </span>
              <p className="text-sm text-foreground leading-relaxed pt-0.5">
                {rule.text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
